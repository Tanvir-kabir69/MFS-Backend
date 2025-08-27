import { NextFunction, Request, Response } from "express";
import { ITransaction, TransactionType } from "../transactionInterface";
import { User } from "../../user/user.model";
import AppError from "../../../errorHelpers/AppError";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { Role } from "../../user/user.interface";

// Define allowed sender/receiver roles per transaction type
const transactionRules: Partial<
  Record<TransactionType, { sender: Role[]; receiver: Role[] }>
> = {
  [TransactionType.ADMIN_LOAD]: {
    sender: [Role.SUPER_ADMIN],
    receiver: [Role.ADMIN],
  },
  [TransactionType.ADMIN_UNLOAD]: {
    sender: [Role.ADMIN],
    receiver: [Role.ADMIN, Role.SUPER_ADMIN],
  },
  [TransactionType.AGENT_LOAD]: {
    sender: [Role.SUPER_ADMIN, Role.ADMIN],
    receiver: [Role.AGENT],
  },
  [TransactionType.AGENT_UNLOAD]: {
    sender: [Role.AGENT],
    receiver: [Role.SUPER_ADMIN, Role.ADMIN, Role.AGENT],
  },
  [TransactionType.CASH_IN]: {
    sender: [Role.SUPER_ADMIN, Role.ADMIN, Role.AGENT],
    receiver: [Role.USER],
  },
  [TransactionType.CASH_OUT]: {
    sender: [Role.USER],
    receiver: [Role.SUPER_ADMIN, Role.ADMIN, Role.AGENT],
  },
  [TransactionType.SENT_MONEY]: {
    sender: [Role.USER, Role.AGENT, Role.ADMIN, Role.SUPER_ADMIN],
    receiver: [Role.USER, Role.AGENT, Role.ADMIN, Role.SUPER_ADMIN],
  },
};

// Middleware
const checkAuthority = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const payload: Partial<ITransaction> = req.body;
    const decodedToken = req.user as JwtPayload;

    if (!decodedToken) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        "You are not authorized to process this request"
      );
    }

    if (!payload || !payload.transaction_type) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Transaction type and details are required"
      );
    }

    const transactionType = payload.transaction_type;

    const sender = await User.findOne({ email: decodedToken.email });
    const receiver = await User.findOne({ email: payload.receiverEmail });

    if (!sender) throw new AppError(httpStatus.BAD_REQUEST, "Sender not found");
    if (!receiver)
      throw new AppError(httpStatus.BAD_REQUEST, "Receiver not found");

    const rule = transactionRules[transactionType];

    if (!rule) {
      // Fallback for auto-handled transaction types
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Unsupported transaction type. The ${transactionType} transaction is handled automatically.`
      );
    }

    if (!rule.sender.includes(sender.role)) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        `Sender with role ${sender.role} not allowed for ${transactionType}`
      );
    }

    if (!rule.receiver.includes(receiver.role)) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        `Receiver with role ${receiver.role} not allowed for ${transactionType}`
      );
    }

    // Attach for controller usage
    req.transactionInfos = { sender, receiver, transactionType, payload };

    next();
  } catch (error) {
    next(error);
  }
};

export default checkAuthority;
