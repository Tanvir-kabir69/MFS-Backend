import { NextFunction, Request, Response } from "express";
import { ITransaction, TransactionType } from "../transactionInterface";
import { Wallet } from "../../wallet/walletSchemaModel";
import AppError from "../../../errorHelpers/AppError";
import httpStatus from "http-status-codes";
import { envVars } from "../../../config/env";
import { getUserDailyGrandTotalByEmail } from "../utils/getUserDailyTransactionTotalsByEmail";
import { Role } from "../../user/user.interface";

export const checkAvailability = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const payload: Partial<ITransaction> = req.body;
    const transactionInfos = req.transactionInfos;

    if (!payload.amount) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "No available amount field. Include transfer amount."
      );
    }

    const senderWallet = await Wallet.findOne({
      user_id: transactionInfos.sender._id,
    });
    if (!senderWallet) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        "Sender has no existing wallet. Recreate account to have a wallet."
      );
    }

    if (senderWallet.amount < payload.amount) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Not enough balance to transfer."
      );
    }

    // Skip checks for load/unload transactions
    const skipTxTypes = [
      TransactionType.ADMIN_LOAD,
      TransactionType.AGENT_LOAD,
      TransactionType.ADMIN_UNLOAD,
      TransactionType.AGENT_UNLOAD,
    ];
    if (skipTxTypes.includes(transactionInfos.transactionType)) {
      return next();
    }

    // Compute charge if applicable
    let charge = 0;
    if (
      [
        TransactionType.CASH_IN,
        TransactionType.CASH_OUT,
        TransactionType.SENT_MONEY,
      ].includes(transactionInfos.transactionType)
    ) {
      switch (transactionInfos.transactionType) {
        case TransactionType.CASH_IN:
          charge = payload.amount * Number(envVars.CASH_IN_CHARGE);
          break;
        case TransactionType.CASH_OUT:
          charge = payload.amount * Number(envVars.CASH_OUT_CHARGE);
          break;
        case TransactionType.SENT_MONEY:
          charge = payload.amount * Number(envVars.SENT_MONEY_CHARGE);
          break;
      }
    }

    // Check sender balance including charge
    if (senderWallet.amount < payload.amount + charge) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Sender balance insufficient. Required: ${
          payload.amount + charge
        }, Available: ${senderWallet.amount}`
      );
    }

    // Helper to check daily limits
    const checkDailyLimit = async (
      role: Role,
      email: string,
      amount: number
    ) => {
      if (role !== Role.USER && role !== Role.AGENT) return;
      const { grandTotal } = await getUserDailyGrandTotalByEmail(role, email);
      const limit =
        role === Role.USER
          ? Number(envVars.USER_TRANSACTION_LIMIT)
          : Number(envVars.AGENT_TRANSACTION_LIMIT);
      if (grandTotal + amount > limit) {
        throw new AppError(
          httpStatus.EXPECTATION_FAILED,
          `This transaction exceeds ${role}'s daily limit. You can transfer up to ${
            limit - grandTotal
          } more today.`
        );
      }
    };

    // Always apply charge for SENT_MONEY, CASH_IN, CASH_OUT
    const totalAmountWithCharge = payload.amount + charge;

    // Sender daily limit check
    await checkDailyLimit(
      transactionInfos.sender.role,
      transactionInfos.sender.email,
      totalAmountWithCharge
    );

    // Receiver daily limit check
    await checkDailyLimit(
      transactionInfos.receiver.role,
      transactionInfos.receiver.email,
      payload.amount
    );

    // If all checks pass
    return next();
  } catch (error) {
    next(error);
  }
};

// Start
//  │
//  │ 1️⃣ Initial Validations
//  │ ├─ Check payload.amount exists → Error if missing
//  │ └─ Fetch senderWallet → Error if not found or insufficient balance
//  │
//  │ 2️⃣ Skip checks for certain transaction types
//  │ ├─ ADMIN_LOAD, AGENT_LOAD, ADMIN_UNLOAD, AGENT_UNLOAD → PASS immediately
//  │
//  │ 3️⃣ For CASH_IN, CASH_OUT, SENT_MONEY
//  │
//  │  ┌─ CASH_IN
//  │  │  ├─ Compute cashInCharge
//  │  │  ├─ Check senderWallet.amount >= amount + charge → Error if not
//  │  │  ├─ Check sender (AGENT) daily total + amount + charge ≤ AGENT_TRANSACTION_LIMIT
//  │  │  └─ Check receiver (USER) daily total + amount ≤ USER_TRANSACTION_LIMIT
//  │  │
//  │  └─ CASH_OUT
//  │     ├─ Compute cashOutCharge
//  │     ├─ Check sender (USER) balance >= amount + charge
//  │     ├─ Check sender (USER) daily total + amount + charge ≤ USER_TRANSACTION_LIMIT
//  │     └─ Check receiver (AGENT) daily total + amount ≤ AGENT_TRANSACTION_LIMIT
//  │
//  │  └─ SENT_MONEY (role-based)
//  │       ┌─ Sender → Receiver (Agent → User)
//  │       │    ├─ Compute sentMoneyCharge
//  │       │    ├─ Check sender balance >= amount + charge
//  │       │    ├─ Check sender daily total ≤ AGENT limit
//  │       │    └─ Check receiver daily total ≤ USER limit
//  │       │
//  │       └─ Sender → Receiver (User → Agent)
//  │            ├─ Compute sentMoneyCharge
//  │            ├─ Check sender balance >= amount + charge
//  │            ├─ Check sender daily total ≤ USER limit
//  │            └─ Check receiver daily total ≤ AGENT limit
//  │
//  │       ┌─ Sender → Receiver (User → User)
//  │       │    ├─ Compute sentMoneyCharge
//  │       │    ├─ Check sender balance >= amount + charge
//  │       │    ├─ Check sender daily total ≤ USER limit
//  │       │    └─ Check receiver daily total ≤ USER limit
//  │       │
//  │       └─ Sender → Receiver (Agent → Agent)
//  │            ├─ Compute sentMoneyCharge
//  │            ├─ Check sender balance >= amount + charge
//  │            ├─ Check sender daily total ≤ AGENT limit
//  │            └─ Check receiver daily total ≤ AGENT limit
//  │
//  │  └─ Sender → Receiver (General: Any sender → Any receiver)
//  │       ├─ If sender is USER/AGENT → Check daily limit
//  │       ├─ If receiver is USER/AGENT → Check daily limit
//  │       └─ Always check sender balance ≥ amount + applicable charge
//  │
//  │ 4️⃣ PASS → next()
// End
