import { NextFunction, Request, Response } from "express";
import { ITransaction, TransactionType } from "../transactionInterface";
import { envVars } from "../../../config/env";
import httpStatus from "http-status-codes";
import AppError from "../../../errorHelpers/AppError";
import { Transaction } from "../transactionSchemaModel";
import { User } from "../../user/user.model";
import { Wallet } from "../../wallet/walletSchemaModel";
import mongoose from "mongoose";

export const distributeTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const payload: Partial<ITransaction> = req.body;

    if (!payload || !payload.transaction_type || !payload.amount) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Transaction type and details are required"
      );
    }

    if (
      req.transactionInfos.transactionType === TransactionType.ADMIN_LOAD ||
      req.transactionInfos.transactionType === TransactionType.ADMIN_UNLOAD ||
      req.transactionInfos.transactionType === TransactionType.AGENT_LOAD ||
      req.transactionInfos.transactionType === TransactionType.AGENT_UNLOAD
    ) {
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        // --- STEP 1: Get Sender and Receiver Wallets ---
        const [senderWallet, receiverWallet] = await Promise.all([
          Wallet.findOne({ user_id: req.transactionInfos.sender._id }).session(
            session
          ),
          Wallet.findOne({
            user_id: req.transactionInfos.receiver._id,
          }).session(session),
        ]);

        if (!senderWallet || !receiverWallet) {
          throw new AppError(
            httpStatus.EXPECTATION_FAILED,
            "Transaction Failed. Missing wallet(s)."
          );
        }

        // --- STEP 2: Calculate Final Balances ---
        const senderFinalAmount = senderWallet.amount - payload.amount;
        const receiverFinalAmount = receiverWallet.amount + payload.amount;

        // --- STEP 3: Update Sender Wallet ---
        await Wallet.findByIdAndUpdate(
          senderWallet._id,
          { amount: senderFinalAmount },
          { new: true, session }
        );

        // --- STEP 4: Update Receiver Wallet ---
        await Wallet.findByIdAndUpdate(
          receiverWallet._id,
          { amount: receiverFinalAmount },
          { new: true, session }
        );

        // --- STEP 5: Create Transaction Record ---
        const [mainTransaction] = await Transaction.create(
          [
            {
              senderEmail: req.transactionInfos.sender.email,
              receiverEmail: req.transactionInfos.receiver.email,
              amount: payload.amount,
              transaction_type: req.transactionInfos.transactionType,
            },
          ],
          { session }
        );

        // --- STEP 6: Commit Transaction ---
        await session.commitTransaction();
        session.endSession();

        req.transactionInfos.mainTransaction = mainTransaction;
        next();
      } catch (err) {
        await session.abortTransaction();
        session.endSession();
        next(err);
      }
    }

    // TRANSACTION DISTRIBUTION FOR CASH IN
    if (req.transactionInfos.transactionType === TransactionType.CASH_IN) {
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        // --- STEP 1: Get Super Admin & Wallets ---
        const superAdmin = await User.findOne({
          email: envVars.SUPER_ADMIN_EMAIL,
        }).session(session);
        if (!superAdmin) {
          throw new AppError(
            httpStatus.EXPECTATION_FAILED,
            "Transaction Failed. No super admin"
          );
        }

        const [superWallet, senderWallet, receiverWallet] = await Promise.all([
          Wallet.findOne({ user_id: superAdmin._id }).session(session),
          Wallet.findOne({ user_id: req.transactionInfos.sender._id }).session(
            session
          ),
          Wallet.findOne({
            user_id: req.transactionInfos.receiver._id,
          }).session(session),
        ]);

        if (!superWallet || !senderWallet || !receiverWallet) {
          throw new AppError(
            httpStatus.EXPECTATION_FAILED,
            "Transaction Failed. Missing wallet(s)."
          );
        }

        // --- STEP 2: Pre-calculate amounts ---
        const transactionCharge =
          payload.amount * Number(envVars.CASH_IN_CHARGE);
        const transactionCommission =
          payload.amount * Number(envVars.CASH_IN_COMMISSION);

        const senderFinalAmount =
          senderWallet.amount -
          transactionCharge -
          payload.amount +
          transactionCommission;

        const superWalletAfterCharge = superWallet.amount + transactionCharge;
        const superWalletAfterCommission =
          superWalletAfterCharge - transactionCommission;
        const receiverFinalAmount = receiverWallet.amount + payload.amount;

        // --- STEP 3: Update Sender Wallet ---
        await Wallet.findByIdAndUpdate(
          senderWallet._id,
          { amount: senderFinalAmount },
          { new: true, session }
        );

        // --- STEP 4: Create Charged Transaction ---
        const [chargeTransaction] = await Transaction.create(
          [
            {
              senderEmail: req.transactionInfos.sender.email,
              receiverEmail: envVars.SUPER_ADMIN_EMAIL,
              amount: transactionCharge,
              transaction_type: TransactionType.CASH_IN_EARNING,
            },
          ],
          { session }
        );

        // --- STEP 5: Create Main Transaction ---
        const [mainTransaction] = await Transaction.create(
          [
            {
              senderEmail: req.transactionInfos.sender.email,
              receiverEmail: req.transactionInfos.receiver.email,
              amount: payload.amount,
              transaction_type: req.transactionInfos.transactionType,
            },
          ],
          { session }
        );

        // --- STEP 6: Create Commission Transaction ---
        const [commissionTransaction] = await Transaction.create(
          [
            {
              senderEmail: envVars.SUPER_ADMIN_EMAIL,
              receiverEmail: req.transactionInfos.sender.email,
              amount: transactionCommission,
              transaction_type: TransactionType.CASH_IN_COMMISSION,
            },
          ],
          { session }
        );

        // --- STEP 7: Update Super Admin Wallet ---
        await Wallet.findByIdAndUpdate(
          superWallet._id,
          { amount: superWalletAfterCommission },
          { new: true, session }
        );

        // --- STEP 8: Update Receiver Wallet ---
        await Wallet.findByIdAndUpdate(
          receiverWallet._id,
          { amount: receiverFinalAmount },
          { new: true, session }
        );

        // --- STEP 9: Commit Transaction ---
        await session.commitTransaction();
        session.endSession();

        req.transactionInfos.chargeTransaction = chargeTransaction;
        req.transactionInfos.commissionTransaction = commissionTransaction;
        req.transactionInfos.mainTransaction = mainTransaction;
        next();
      } catch (err) {
        await session.abortTransaction();
        session.endSession();
        next(err);
      }
    }

    // TRANSACTION DISTRIBUTION FOR CASH OUT
    if (req.transactionInfos.transactionType === TransactionType.CASH_OUT) {
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        // --- STEP 1: Get Super Admin & Wallets ---
        const superAdmin = await User.findOne({
          email: envVars.SUPER_ADMIN_EMAIL,
        }).session(session);
        if (!superAdmin) {
          throw new AppError(
            httpStatus.EXPECTATION_FAILED,
            "Transaction Failed. No super admin"
          );
        }

        const [superWallet, senderWallet, receiverWallet] = await Promise.all([
          Wallet.findOne({ user_id: superAdmin._id }).session(session),
          Wallet.findOne({ user_id: req.transactionInfos.sender._id }).session(
            session
          ),
          Wallet.findOne({
            user_id: req.transactionInfos.receiver._id,
          }).session(session),
        ]);

        if (!superWallet || !senderWallet || !receiverWallet) {
          throw new AppError(
            httpStatus.EXPECTATION_FAILED,
            "Transaction Failed. Missing wallet(s)."
          );
        }

        // --- STEP 2: Pre-calculate amounts ---
        const transactionCharge =
          payload.amount * Number(envVars.CASH_OUT_CHARGE);
        const transactionCommission =
          payload.amount * Number(envVars.CASH_OUT_COMMISSION);

        // --- STEP 3: Update Wallets safely with $inc ---
        await Promise.all([
          // Deduct amount + charge from sender
          Wallet.findByIdAndUpdate(
            senderWallet._id,
            { $inc: { amount: -(payload.amount + transactionCharge) } },
            { session }
          ),
          // Add amount + commission to receiver (agent)
          Wallet.findByIdAndUpdate(
            receiverWallet._id,
            { $inc: { amount: payload.amount + transactionCommission } },
            { session }
          ),
          // Add charge to super admin
          Wallet.findByIdAndUpdate(
            superWallet._id,
            { $inc: { amount: transactionCharge - transactionCommission } },
            { session }
          ),
        ]);

        // --- STEP 4: Create Transactions in 3 parts ---
        const [chargeTransaction, mainTransaction, commissionTransaction] =
          await Transaction.create(
            [
              {
                senderEmail: req.transactionInfos.sender.email,
                receiverEmail: envVars.SUPER_ADMIN_EMAIL,
                amount: transactionCharge,
                transaction_type: TransactionType.CASH_OUT_EARNING,
              },
              {
                senderEmail: req.transactionInfos.sender.email,
                receiverEmail: req.transactionInfos.receiver.email,
                amount: payload.amount,
                transaction_type: TransactionType.CASH_OUT,
              },
              {
                senderEmail: envVars.SUPER_ADMIN_EMAIL,
                receiverEmail: req.transactionInfos.receiver.email,
                amount: transactionCommission,
                transaction_type: TransactionType.CASH_OUT_COMMISSION,
              },
            ],
            { session }
          );

        // --- STEP 5: Commit Transaction ---
        await session.commitTransaction();
        session.endSession();

        req.transactionInfos.chargeTransaction = chargeTransaction;
        req.transactionInfos.commissionTransaction = commissionTransaction;
        req.transactionInfos.mainTransaction = mainTransaction;
        next();
      } catch (err) {
        await session.abortTransaction();
        session.endSession();
        next(err);
      }
    }

    // TRANSACTION DISTRIBUTION FOR SENT MONEY
    if (req.transactionInfos.transactionType === TransactionType.SENT_MONEY) {
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        // --- STEP 1: Get Super Admin & Wallets ---
        const superAdmin = await User.findOne({
          email: envVars.SUPER_ADMIN_EMAIL,
        }).session(session);
        if (!superAdmin)
          throw new AppError(httpStatus.EXPECTATION_FAILED, "No super admin");

        const [superWallet, senderWallet, receiverWallet] = await Promise.all([
          Wallet.findOne({ user_id: superAdmin._id }).session(session),
          Wallet.findOne({ user_id: req.transactionInfos.sender._id }).session(
            session
          ),
          Wallet.findOne({
            user_id: req.transactionInfos.receiver._id,
          }).session(session),
        ]);

        if (!superWallet || !senderWallet || !receiverWallet)
          throw new AppError(
            httpStatus.EXPECTATION_FAILED,
            "Missing wallet(s)"
          );

        // --- STEP 2: Pre-calculate amounts ---
        const transactionCharge =
          payload.amount * Number(envVars.SENT_MONEY_CHARGE);
        const transactionCommission =
          payload.amount * Number(envVars.SENT_MONEY_COMMISSION);

        // Calculate final wallet amounts
        const senderFinalAmount =
          senderWallet.amount -
          payload.amount -
          transactionCharge +
          transactionCommission;
        const receiverFinalAmount = receiverWallet.amount + payload.amount;
        const superWalletFinalAmount =
          superWallet.amount + transactionCharge - transactionCommission;

        // --- STEP 3: Update Wallets ---
        await Promise.all([
          Wallet.findByIdAndUpdate(
            senderWallet._id,
            { amount: senderFinalAmount },
            { session }
          ),
          Wallet.findByIdAndUpdate(
            receiverWallet._id,
            { amount: receiverFinalAmount },
            { session }
          ),
          Wallet.findByIdAndUpdate(
            superWallet._id,
            { amount: superWalletFinalAmount },
            { session }
          ),
        ]);

        // --- STEP 4: Create Transactions in 3 parts ---
        const [chargeTransaction] = await Transaction.create(
          [
            {
              senderEmail: req.transactionInfos.sender.email,
              receiverEmail: envVars.SUPER_ADMIN_EMAIL,
              amount: transactionCharge,
              transactionType: TransactionType.SENT_MONEY_EARNING, // charge recorded
            },
          ],
          { session }
        );

        const [mainTransaction] = await Transaction.create(
          [
            {
              senderEmail: req.transactionInfos.sender.email,
              receiverEmail: req.transactionInfos.receiver.email,
              amount: payload.amount,
              transactionType: TransactionType.SENT_MONEY,
            },
          ],
          { session }
        );

        const [commissionTransaction] = await Transaction.create(
          [
            {
              senderEmail: envVars.SUPER_ADMIN_EMAIL,
              receiverEmail: req.transactionInfos.sender.email,
              amount: transactionCommission,
              transactionType: TransactionType.SENT_MONEY_COMMISSION, // commission paid back
            },
          ],
          { session }
        );

        // --- STEP 5: Commit Transaction ---
        await session.commitTransaction();
        session.endSession();

        req.transactionInfos.chargeTransaction = chargeTransaction;
        req.transactionInfos.commissionTransaction = commissionTransaction;
        req.transactionInfos.mainTransaction = mainTransaction;
        next();
      } catch (err) {
        await session.abortTransaction();
        session.endSession();
        next(err);
      }
    }
  } catch (error) {
    next(error);
  }
};

// ----------------------------------------------------------------------------------

// My Understanding of What You Are Implementing

// Transaction Type Based Handling

// You check the type of transaction (transactionInfos.transactionType) and execute logic accordingly:

// ADMIN_LOAD, ADMIN_UNLOAD, AGENT_LOAD, AGENT_UNLOAD → simple wallet transfer (no charges/commission).

// CASH_IN → wallet update + charge to Super Admin + commission back to sender.

// CASH_OUT → wallet update + charge to Super Admin + commission back to sender.

// SENT_MONEY → wallet update + charge to Super Admin + commission back to sender.

// Atomicity via Mongoose Session

// For each transaction type, you start a mongoose session and transaction to ensure all wallet updates and transaction creation are atomic.

// commitTransaction on success, abortTransaction on error.

// Wallet Updates

// For transactions with charges/commissions (CASH_IN, CASH_OUT, SENT_MONEY):

// Sender wallet: decrease by main amount + charge, then add commission.

// Super Admin wallet: increase by charge, decrease by commission.

// Receiver wallet: increase by main amount.

// Transactions Creation

// You create three separate transaction records for charge, main, and commission using the corresponding enum types (CASH_IN_EARNING, CASH_IN_COMMISSION, etc.).

// You store these transactions in req.transactionInfos for downstream processing.

// Error Handling

// If any wallet is missing, or any operation fails, you abort the session and propagate the error.

// ----------------------------------------------------------------------------------
// Potential Logical Mismatches / Points to Watch

// Wallet Fetch vs Update

// You fetch senderWallet and receiverWallet at the start, then do findByIdAndUpdate with the calculated final amount.

// Issue: If two transactions for the same wallet run in parallel, there is a race condition, because you calculate the amount based on the initial wallet value, not the latest one in DB.

// Safe solution: Use findOneAndUpdate with $inc in session instead of calculating finalAmount manually.

// Charge and Commission Calculation

// You do transactionCharge = payload.amount * Number(envVars.CASH_IN_CHARGE)

// Make sure envVars.CASH_IN_CHARGE is 0.01 for 1%, not 1 for 100%—otherwise, your amount math is wrong.

// Receiver Wallet for CASH_OUT

// You update receiverWallet.amount + payload.amount for CASH_OUT.

// But normally in CASH_OUT, the receiver might be an external bank or agent, not stored in your wallet table. You might need to skip updating receiver wallet if it’s external.

// Repetitive Transaction Creation

// You do three separate Transaction.create calls instead of batching them into one array.

// Functionally fine with a session, but could be slightly optimized: Transaction.create([main, charge, commission], { session }).

// ENUM Typo / Consistency

// You wrote CASH_IN_C0MISSION and CASH_OUT_C0MISSION (with zero 0) in the enum. This can cause typos or mismatch. Should probably be CASH_IN_COMMISSION.

// Next() Calls

// You call next() inside each transaction type block.

// If transactionType doesn’t match any case, next() won’t be called. You may need a final else to handle unsupported types.

// Duplicate Super Admin Lookup

// You fetch superAdmin for every transaction type with charges. Could factor out a helper function to reduce repetition.
