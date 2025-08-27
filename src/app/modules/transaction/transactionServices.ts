import { JwtPayload } from "jsonwebtoken";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { Role } from "../user/user.interface";
import { Transaction } from "./transactionSchemaModel";
import { TransactionType } from "./transactionInterface";
import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";

// const getMyTransactionFromDB = async (
//   decodedToken: JwtPayload,
//   query: Record<string, string>
// ) => {
//     if(!decodedToken){
//         throw new AppError(httpStatus.BAD_REQUEST, "No Token Received")
//     }
//   let transactionQuery;

//   if ((decodedToken.role = Role.USER)) {
//     transactionQuery = Transaction.find({
//       $or: [
//         // User is receiver for CASH_IN
//         {
//           transaction_type: TransactionType.CASH_IN,
//           receiverEmail: decodedToken.email,
//         },

//         // User is sender for CASH_OUT
//         {
//           transaction_type: TransactionType.CASH_OUT,
//           senderEmail: decodedToken.email,
//         },

//         // User is sender for SENT_MONEY
//         {
//           transaction_type: TransactionType.SENT_MONEY,
//           senderEmail: decodedToken.email,
//         },

//         // User is receiver for SENT_MONEY
//         {
//           transaction_type: TransactionType.SENT_MONEY,
//           receiverEmail: decodedToken.email,
//         },
//       ],
//     });
//   }

//   if ((decodedToken.role = Role.AGENT)) {
//     transactionQuery = Transaction.find({
//       $or: [
//         // Agent is sender for CASH_IN
//         {
//           transaction_type: TransactionType.CASH_IN,
//           senderEmail: decodedToken.email,
//         },

//         // Agent is receiver for CASH_OUT
//         {
//           transaction_type: TransactionType.CASH_OUT,
//           receiverEmail: decodedToken.email,
//         },

//         // Agent can be sender OR receiver for SENT_MONEY
//         {
//           transaction_type: TransactionType.SENT_MONEY,
//           senderEmail: decodedToken.email,
//         },
//         {
//           transaction_type: TransactionType.SENT_MONEY,
//           receiverEmail: decodedToken.email,
//         },

//         // Agent Unload
//         {
//           transaction_type: TransactionType.AGENT_UNLOAD,
//           senderEmail: decodedToken.email,
//         },
//       ],
//     });
//   }

//   if ((decodedToken.role = Role.ADMIN)) {
//     transactionQuery = Transaction.find({
//       $or: [
//         // Admin is sender for CASH_IN
//         {
//           transaction_type: TransactionType.CASH_IN,
//           senderEmail: decodedToken.email,
//         },

//         // Admin is receiver for CASH_OUT
//         {
//           transaction_type: TransactionType.CASH_OUT,
//           receiverEmail: decodedToken.email,
//         },

//         // Admin can be sender OR receiver for SENT_MONEY
//         {
//           transaction_type: TransactionType.SENT_MONEY,
//           senderEmail: decodedToken.email,
//         },
//         {
//           transaction_type: TransactionType.SENT_MONEY,
//           receiverEmail: decodedToken.email,
//         },

//         // Agent Load / Unload
//         {
//           transaction_type: TransactionType.AGENT_LOAD,
//           senderEmail: decodedToken.email,
//         },
//         {
//           transaction_type: TransactionType.AGENT_UNLOAD,
//           receiverEmail: decodedToken.email,
//         },

//         // Admin Unload
//         {
//           transaction_type: TransactionType.ADMIN_UNLOAD,
//           receiverEmail: decodedToken.email,
//         },
//       ],
//     });
//   }

//   if ((decodedToken.role = Role.SUPER_ADMIN)) {
//     transactionQuery = Transaction.find({
//       $or: [
//         // sender for CASH_IN
//         {
//           transaction_type: TransactionType.CASH_IN,
//           senderEmail: decodedToken.email,
//         },

//         // receiver for CASH_OUT
//         {
//           transaction_type: TransactionType.CASH_OUT,
//           receiverEmail: decodedToken.email,
//         },

//         // can be sender OR receiver for SENT_MONEY
//         {
//           transaction_type: TransactionType.SENT_MONEY,
//           senderEmail: decodedToken.email,
//         },
//         {
//           transaction_type: TransactionType.SENT_MONEY,
//           receiverEmail: decodedToken.email,
//         },

//         // Agent Load / Unload
//         {
//           transaction_type: TransactionType.AGENT_LOAD,
//           senderEmail: decodedToken.email,
//         },
//         {
//           transaction_type: TransactionType.AGENT_UNLOAD,
//           receiverEmail: decodedToken.email,
//         },

//         // Admin load / Unload
//         {
//           transaction_type: TransactionType.ADMIN_LOAD,
//           senderEmail: decodedToken.email,
//         },
//         {
//           transaction_type: TransactionType.ADMIN_UNLOAD,
//           receiverEmail: decodedToken.email,
//         },
//       ],
//     });
//   }

//   if(!transactionQuery){
//     throw new AppError(httpStatus.BAD_REQUEST, "No Query found")
//   }

//   const queryBuilder = new QueryBuilder(transactionQuery, query);
//   const usersData = queryBuilder.filter().sort().fields().paginate();

//   const [data, meta] = await Promise.all([
//     usersData.build(),
//     queryBuilder.getMeta(),
//   ]);

//   return {
//     data,
//     meta,
//   };
// };

// type TxRoleMap = Partial<Record<TransactionType, ("senderEmail" | "receiverEmail")[]>>;

// const ROLE_TX_MAP: Record<Role, TxRoleMap> = {
//   [Role.USER]: {
//     [TransactionType.CASH_IN]: ["receiverEmail"],
//     [TransactionType.CASH_OUT]: ["senderEmail"],
//     [TransactionType.SENT_MONEY]: ["senderEmail", "receiverEmail"],
//   },
//   [Role.AGENT]: {
//     [TransactionType.CASH_IN]: ["senderEmail"],
//     [TransactionType.CASH_OUT]: ["receiverEmail"],
//     [TransactionType.SENT_MONEY]: ["senderEmail", "receiverEmail"],
//     [TransactionType.AGENT_LOAD]: ["receiverEmail"],
//     [TransactionType.AGENT_UNLOAD]: ["senderEmail"],
//   },
//   [Role.ADMIN]: {
//     [TransactionType.CASH_IN]: ["senderEmail"],
//     [TransactionType.CASH_OUT]: ["receiverEmail"],
//     [TransactionType.SENT_MONEY]: ["senderEmail", "receiverEmail"],
//     [TransactionType.AGENT_LOAD]: ["senderEmail"],
//     [TransactionType.AGENT_UNLOAD]: ["receiverEmail"],
//     [TransactionType.ADMIN_UNLOAD]: ["receiverEmail"],
//   },
//   [Role.SUPER_ADMIN]: {
//     [TransactionType.CASH_IN]: ["senderEmail"],
//     [TransactionType.CASH_OUT]: ["receiverEmail"],
//     [TransactionType.SENT_MONEY]: ["senderEmail", "receiverEmail"],
//     [TransactionType.AGENT_LOAD]: ["senderEmail"],
//     [TransactionType.AGENT_UNLOAD]: ["receiverEmail"],
//     [TransactionType.ADMIN_LOAD]: ["senderEmail"],
//     [TransactionType.ADMIN_UNLOAD]: ["receiverEmail"],
//   },
// };

// export const getMyTransactionFromDB = async (
//   decodedToken: JwtPayload,
//   query: Record<string, string>
// ) => {
//   if (!decodedToken) throw new AppError(400, "No Token Received");

//   const role = decodedToken.role as Role;
//   const email = decodedToken.email.toLowerCase();

//   const roleMap = ROLE_TX_MAP[role];
//   if (!roleMap) throw new AppError(400, "No transaction map for this role");

//   // Build $or conditions dynamically
//   const orConditions = Object.entries(roleMap).flatMap(([type, fields]) =>
//     fields.map(field => ({ transaction_type: type, [field]: email }))
//   );

//   const transactionQuery = Transaction.find({ $or: orConditions });

//   const queryBuilder = new QueryBuilder(transactionQuery, query);
//   const usersData = queryBuilder.filter().sort().fields().paginate();

//   const [data, meta] = await Promise.all([usersData.build(), queryBuilder.getMeta()]);

//   return { data, meta };
// };

// Transaction rules map

// const transactionRules: Record<TransactionType, { sender: Role[]; receiver: Role[] }> = {
//   [TransactionType.ADMIN_LOAD]: { sender: [Role.SUPER_ADMIN], receiver: [Role.ADMIN] },
//   [TransactionType.ADMIN_UNLOAD]: { sender: [Role.ADMIN], receiver: [Role.ADMIN, Role.SUPER_ADMIN] },
//   [TransactionType.AGENT_LOAD]: { sender: [Role.SUPER_ADMIN, Role.ADMIN], receiver: [Role.AGENT] },
//   [TransactionType.AGENT_UNLOAD]: { sender: [Role.AGENT], receiver: [Role.SUPER_ADMIN, Role.ADMIN, Role.AGENT] },
//   [TransactionType.CASH_IN]: { sender: [Role.SUPER_ADMIN, Role.ADMIN, Role.AGENT], receiver: [Role.USER] },
//   [TransactionType.CASH_OUT]: { sender: [Role.USER], receiver: [Role.SUPER_ADMIN, Role.ADMIN, Role.AGENT] },
//   [TransactionType.SENT_MONEY]: { sender: [Role.USER, Role.AGENT, Role.ADMIN, Role.SUPER_ADMIN], receiver: [Role.USER, Role.AGENT, Role.ADMIN, Role.SUPER_ADMIN] },
// };

// ts correction 1

// const transactionRules: Partial<Record<TransactionType, { sender: Role[]; receiver: Role[] }>> = {
//   ADMIN_LOAD: { sender: [Role.SUPER_ADMIN], receiver: [Role.ADMIN] },
//   ADMIN_UNLOAD: { sender: [Role.ADMIN], receiver: [Role.ADMIN, Role.SUPER_ADMIN] },
//   AGENT_LOAD: { sender: [Role.SUPER_ADMIN, Role.ADMIN], receiver: [Role.AGENT] },
//   AGENT_UNLOAD: { sender: [Role.AGENT], receiver: [Role.SUPER_ADMIN, Role.ADMIN, Role.AGENT] },
//   CASH_IN: { sender: [Role.SUPER_ADMIN, Role.ADMIN, Role.AGENT], receiver: [Role.USER] },
//   CASH_OUT: { sender: [Role.USER], receiver: [Role.SUPER_ADMIN, Role.ADMIN, Role.AGENT] },
//   SENT_MONEY: {
//     sender: [Role.USER, Role.AGENT, Role.ADMIN, Role.SUPER_ADMIN],
//     receiver: [Role.USER, Role.AGENT, Role.ADMIN, Role.SUPER_ADMIN],
//   },
// };

// ts correction -2

const transactionRules: Record<
  TransactionType,
  { sender: Role[]; receiver: Role[] }
> = {
  ADMIN_LOAD: { sender: [Role.SUPER_ADMIN], receiver: [Role.ADMIN] },
  ADMIN_UNLOAD: {
    sender: [Role.ADMIN],
    receiver: [Role.ADMIN, Role.SUPER_ADMIN],
  },
  AGENT_LOAD: {
    sender: [Role.SUPER_ADMIN, Role.ADMIN],
    receiver: [Role.AGENT],
  },
  AGENT_UNLOAD: {
    sender: [Role.AGENT],
    receiver: [Role.SUPER_ADMIN, Role.ADMIN, Role.AGENT],
  },
  CASH_IN: {
    sender: [Role.SUPER_ADMIN, Role.ADMIN, Role.AGENT],
    receiver: [Role.USER],
  },
  CASH_OUT: {
    sender: [Role.USER],
    receiver: [Role.SUPER_ADMIN, Role.ADMIN, Role.AGENT],
  },
  SENT_MONEY: {
    sender: [Role.USER, Role.AGENT, Role.ADMIN, Role.SUPER_ADMIN],
    receiver: [Role.USER, Role.AGENT, Role.ADMIN, Role.SUPER_ADMIN],
  },
  CASH_IN_COMMISSION: { sender: [], receiver: [] },
  CASH_OUT_COMMISSION: { sender: [], receiver: [] },
  CASH_IN_EARNING: { sender: [], receiver: [] },
  CASH_OUT_EARNING: { sender: [], receiver: [] },
  SENT_MONEY_EARNING: { sender: [], receiver: [] },
  SENT_MONEY_COMMISSION: { sender: [], receiver: [] },
};

const getMyTransactionFromDB = async (
  query: Record<string, string>,
  decodedToken: JwtPayload
) => {
  if (!decodedToken)
    throw new AppError(httpStatus.BAD_REQUEST, "No Token Received");
  const email = decodedToken.email?.toLowerCase();
  if (!email) throw new AppError(httpStatus.BAD_REQUEST, "No email in token");

  const or: any[] = [];

  for (const [type, roles] of Object.entries(transactionRules) as [
    TransactionType,
    (typeof transactionRules)[TransactionType]
  ][]) {
    if (roles.sender.includes(decodedToken.role as Role))
      or.push({ transaction_type: type, senderEmail: email });
    if (roles.receiver.includes(decodedToken.role as Role))
      or.push({ transaction_type: type, receiverEmail: email });
  }

  if (or.length === 0)
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "No transactions available for this role"
    );

  const transactionQuery = Transaction.find({ $or: or });
  const queryBuilder = new QueryBuilder(transactionQuery, query);
  //   const dataQuery = queryBuilder.filter().sort().fields().paginate();
  const dataQuery = queryBuilder.filter().sort();

  const [data, meta] = await Promise.all([
    dataQuery.build(),
    queryBuilder.getMeta(),
  ]);

  return { data, meta };
};

const getAllTransactionsFromDB = async () => {
  const result = await Transaction.find();
  return result;
};

const getMyCommissionHistoryFromDB = async (userEmail: string) => {
  const result = await Transaction.find({
    $or: [
      {
        receiverEmail: userEmail,
        transaction_type: TransactionType.CASH_IN_COMMISSION,
      },
      {
        receiverEmail: userEmail,
        transaction_type: TransactionType.CASH_OUT_COMMISSION,
      },
      {
        receiverEmail: userEmail,
        transaction_type: TransactionType.SENT_MONEY_COMMISSION,
      },
    ],
  });

  return result;
};

export const transactionServices = {
  getMyTransactionFromDB,
  getAllTransactionsFromDB,
  getMyCommissionHistoryFromDB,
};
