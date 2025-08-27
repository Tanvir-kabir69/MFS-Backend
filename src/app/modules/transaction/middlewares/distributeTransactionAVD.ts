import { NextFunction, Request, Response } from "express";
import { ITransaction, TransactionType } from "../transactionInterface";
import { envVars } from "../../../config/env";
import httpStatus from "http-status-codes";
import AppError from "../../../errorHelpers/AppError";
import { Transaction } from "../transactionSchemaModel";
import { User } from "../../user/user.model";
import mongoose from "mongoose";
import { Wallet } from "../../wallet/walletSchemaModel";

// Helper: Fetch Super Admin and its wallet
const getSuperAdmin = async (session: mongoose.ClientSession) => {
  const superAdmin = await User.findOne({ email: envVars.SUPER_ADMIN_EMAIL }).session(session);
  if (!superAdmin) throw new AppError(httpStatus.EXPECTATION_FAILED, "Transaction Failed. No super admin");

  const superWallet = await Wallet.findOne({ user_id: superAdmin._id }).session(session);
  if (!superWallet) throw new AppError(httpStatus.EXPECTATION_FAILED, "Transaction Failed. No super wallet");

  return { superAdmin, superWallet };
};

export const distributeTransaction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload: Partial<ITransaction> = req.body;

    // --- STEP 0: Validate payload ---
    if (!payload || !payload.transaction_type || !payload.amount) {
      throw new AppError(httpStatus.BAD_REQUEST, "Transaction type and details are required");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { sender, receiver, transactionType } = req.transactionInfos;

      // --- STEP 1: Fetch Sender Wallet ---
      const senderWallet = await Wallet.findOne({ user_id: sender._id }).session(session);
      if (!senderWallet) throw new AppError(httpStatus.EXPECTATION_FAILED, "Sender wallet not found");

      // --- STEP 2: Fetch Receiver Wallet (if exists) ---
    //   let receiverWallet: Wallet | null = null;
      let receiverWallet: InstanceType<typeof Wallet> | null = null;
      if (receiver) {
        receiverWallet = await Wallet.findOne({ user_id: receiver._id }).session(session);
        if (!receiverWallet) throw new AppError(httpStatus.EXPECTATION_FAILED, "Receiver wallet not found");
      }

      const transactionsToCreate: Partial<ITransaction>[] = [];

      // --- STEP 3: Handle Admin/Agent Load or Unload ---
      if ([TransactionType.ADMIN_LOAD, TransactionType.ADMIN_UNLOAD, TransactionType.AGENT_LOAD, TransactionType.AGENT_UNLOAD].includes(transactionType)) {
        // Update sender and receiver wallets safely using $inc
        await Promise.all([
          Wallet.findByIdAndUpdate(senderWallet._id, { $inc: { amount: -payload.amount } }, { session }),
          Wallet.findByIdAndUpdate(receiverWallet!._id, { $inc: { amount: payload.amount } }, { session }),
        ]);

        // Prepare transaction record
        transactionsToCreate.push({
          senderEmail: sender.email,
          receiverEmail: receiver!.email,
          amount: payload.amount,
          transaction_type: transactionType,
        });
      }

      // --- STEP 4: Handle Cash-In, Cash-Out, Sent Money ---
      if ([TransactionType.CASH_IN, TransactionType.CASH_OUT, TransactionType.SENT_MONEY].includes(transactionType)) {
        const { superAdmin, superWallet } = await getSuperAdmin(session);

        let charge = 0, commission = 0;

        // --- STEP 4a: Calculate Charge & Commission ---
        if (transactionType === TransactionType.CASH_IN) {
          charge = payload.amount * Number(envVars.CASH_IN_CHARGE);
          commission = payload.amount * Number(envVars.CASH_IN_COMMISSION);
          // Cash-In: sender pays amount + charge, receiver gets amount, sender gets commission
          await Promise.all([
            Wallet.findByIdAndUpdate(senderWallet._id, { $inc: { amount: -payload.amount - charge + commission } }, { session }),
            receiverWallet ? Wallet.findByIdAndUpdate(receiverWallet._id, { $inc: { amount: payload.amount } }, { session }) : null,
            Wallet.findByIdAndUpdate(superWallet._id, { $inc: { amount: charge - commission } }, { session }),
          ]);
        }

        if (transactionType === TransactionType.CASH_OUT) {
          charge = payload.amount * Number(envVars.CASH_OUT_CHARGE);
          commission = payload.amount * Number(envVars.CASH_OUT_COMMISSION);
          // Cash-Out: sender pays amount + charge, agent (receiver) gets amount + commission, super admin gets charge - commission
          await Promise.all([
            Wallet.findByIdAndUpdate(senderWallet._id, { $inc: { amount: -payload.amount - charge } }, { session }),
            receiverWallet ? Wallet.findByIdAndUpdate(receiverWallet._id, { $inc: { amount: payload.amount + commission } }, { session }) : null,
            Wallet.findByIdAndUpdate(superWallet._id, { $inc: { amount: charge - commission } }, { session }),
          ]);
        }

        if (transactionType === TransactionType.SENT_MONEY) {
          charge = payload.amount * Number(envVars.SENT_MONEY_CHARGE);
          commission = payload.amount * Number(envVars.SENT_MONEY_COMMISSION);
          // Sent Money: sender pays amount + charge, receiver gets amount, sender gets commission back, super admin gets charge - commission
          await Promise.all([
            Wallet.findByIdAndUpdate(senderWallet._id, { $inc: { amount: -payload.amount - charge + commission } }, { session }),
            receiverWallet ? Wallet.findByIdAndUpdate(receiverWallet._id, { $inc: { amount: payload.amount } }, { session }) : null,
            Wallet.findByIdAndUpdate(superWallet._id, { $inc: { amount: charge - commission } }, { session }),
          ]);
        }

        // --- STEP 4b: Prepare Transaction Records ---
        transactionsToCreate.push(
          // Charge transaction (to Super Admin)
          {
            senderEmail: sender.email,
            receiverEmail: superAdmin.email,
            amount: charge,
            transaction_type: transactionType === TransactionType.CASH_IN ? TransactionType.CASH_IN_EARNING :
                               transactionType === TransactionType.CASH_OUT ? TransactionType.CASH_OUT_EARNING :
                               TransactionType.SENT_MONEY_EARNING,
          },
          // Main transaction (actual transfer)
          {
            senderEmail: sender.email,
            receiverEmail: receiver ? receiver.email : "external",
            amount: payload.amount,
            transaction_type: transactionType,
          },
          // Commission transaction (who receives commission)
          {
            senderEmail: superAdmin.email,
            receiverEmail: transactionType === TransactionType.CASH_OUT ? receiver?.email : sender.email,
            amount: commission,
            transaction_type: transactionType === TransactionType.CASH_IN ? TransactionType.CASH_IN_COMMISSION :
                               transactionType === TransactionType.CASH_OUT ? TransactionType.CASH_OUT_COMMISSION :
                               TransactionType.SENT_MONEY_COMMISSION,
          }
        );
      }

      // --- STEP 5: Batch Create All Transactions ---
      const createdTransactions = await Transaction.create(transactionsToCreate, { session, ordered: true });
    //   console.log(createdTransactions)

      // --- STEP 6: Commit Transaction ---
      await session.commitTransaction();
      session.endSession();

      // --- STEP 7: Map Transactions to req.transactionInfos ---
      req.transactionInfos.mainTransaction = createdTransactions.find(t => t.transaction_type === transactionType);
      req.transactionInfos.chargeTransaction = createdTransactions.find(t => t.transaction_type?.includes("EARNING"));
      req.transactionInfos.commissionTransaction = createdTransactions.find(t => t.transaction_type?.includes("COMMISSION"));

      // --- STEP 8: Continue Middleware ---
      next();
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      next(err);
    }
  } catch (error) {
    next(error);
  }
};
