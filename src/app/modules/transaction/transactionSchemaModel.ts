import { Schema, model } from "mongoose";
import { ITransaction, TransactionType } from "./transactionInterface";
import { envVars } from "../../config/env";

const transactionSchema = new Schema<ITransaction>(
  {
    senderEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid sender email format"],
    },
    receiverEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid receiver email format"],
    },
    transaction_type: {
      type: String,
      enum: Object.values(TransactionType),
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      // validate: {
      //   validator: function (value: number) {
      //     const skipTypes = [
      //       "CASH_IN_COMMISSION",
      //       "CASH_OUT_COMMISSION",
      //       "CASH_IN_EARNING",
      //       "CASH_OUT_EARNING",
      //       "SENT_MONEY_EARNING",
      //       "SENT_MONEY_COMMISSION",
      //     ];

      //     if (skipTypes.includes(this.transaction_type)) {
      //       return true;
      //     }

      //     return value >= Number(envVars.MINIMUM_TRANSACTION_AMOUNT);
      //   },
      //   message: function (props) {
      //     return `Amount must be at least ${Number(
      //       envVars.MINIMUM_TRANSACTION_AMOUNT
      //     )}`;
      //     // for transaction type: ${this.transaction_type || "Unknown"}`;
      //   },
      // },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const Transaction = model<ITransaction>(
  "Transaction",
  transactionSchema
);
// export const AdminLoadTransiction = model<ITransiction>(
//   "AdminLoadTransiction",
//   transactionSchema
// );
// export const AgentLoadTransiction = model<ITransiction>(
//   "AgentLoadTransiction",
//   transactionSchema
// );
// export const CashIn = model<ITransiction>("CashIn", transactionSchema);
// export const CashOut = model<ITransiction>("CashOut", transactionSchema);
// export const SentMoney = model<ITransiction>("SentMoney", transactionSchema);
