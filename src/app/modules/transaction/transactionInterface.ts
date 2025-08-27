import { Types } from "mongoose";

export enum TransactionType {
  ADMIN_LOAD = "ADMIN_LOAD",
  ADMIN_UNLOAD = "ADMIN_UNLOAD",
  AGENT_LOAD = "AGENT_LOAD",
  AGENT_UNLOAD = "AGENT_UNLOAD",
  CASH_IN = "CASH_IN",
  CASH_OUT = "CASH_OUT",
  SENT_MONEY = "SENT_MONEY",
  CASH_IN_COMMISSION = "CASH_IN_COMMISSION",
  CASH_OUT_COMMISSION = "CASH_OUT_COMMISSION",
  CASH_IN_EARNING = "CASH_IN_EARNING",
  CASH_OUT_EARNING = "CASH_OUT_EARNING",
  SENT_MONEY_EARNING = "SENT_MONEY_EARNING",
  SENT_MONEY_COMMISSION = "SENT_MONEY_COMMISSION",
}

export interface ITransaction {
  _id?: Types.ObjectId;
  senderEmail: string;
  receiverEmail: string;
  transaction_type: TransactionType;
  amount: number;
}
