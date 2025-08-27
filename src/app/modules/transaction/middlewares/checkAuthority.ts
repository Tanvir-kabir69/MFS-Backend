import { NextFunction, Request, Response } from "express";
import { ITransaction, TransactionType } from "../transactionInterface";
import { User } from "../../user/user.model";
import AppError from "../../../errorHelpers/AppError";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { Role } from "../../user/user.interface";

// {
//   userId: '68a4a77945a0289904562c0d',
//   email: 'super@gmail.com',
//   role: 'SUPER_ADMIN',
//   iat: 1755690193,
//   exp: 1756294993
// }

const checkAuthority = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const payload: Partial<ITransaction> = req.body;
    // const payload = req.body;
    const decodedToken = req.user as JwtPayload;
    console.log(payload);
    console.log(decodedToken);
    if (!decodedToken) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        "You are unauthorized to process this request"
      );
    }
    if (!payload) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Try Providing appropriate informations"
      );
    }
    if (!payload.transaction_type || !payload.receiverEmail) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Missing transaction_type or receiverEmail"
      );
    }
    const transactionType = payload.transaction_type;

    const sender = await User.findOne({ email: decodedToken.email });
    const receiver = await User.findOne({ email: payload.receiverEmail });
    if (!sender) {
      throw new AppError(httpStatus.BAD_REQUEST, "Sender Not Found");
    }
    if (!receiver) {
      throw new AppError(httpStatus.BAD_REQUEST, "Receiver Not Found");
    }

    if (transactionType === TransactionType.ADMIN_LOAD) {
      if (sender.role !== Role.SUPER_ADMIN) {
        throw new AppError(
          httpStatus.UNAUTHORIZED,
          "Sender is not authorized for this transaction"
        );
      }
      if (receiver.role !== Role.ADMIN) {
        throw new AppError(
          httpStatus.UNAUTHORIZED,
          "Receiver is not authorized for this transaction"
        );
      }

      req.transactionInfos = { payload, sender, receiver, transactionType };
      return next();
    }

    if (transactionType === TransactionType.AGENT_LOAD) {
      if (!(sender.role === Role.SUPER_ADMIN || sender.role === Role.ADMIN)) {
        throw new AppError(
          httpStatus.UNAUTHORIZED,
          "Sender is not authorized for this transaction"
        );
      }
      if (receiver.role !== Role.AGENT) {
        throw new AppError(
          httpStatus.UNAUTHORIZED,
          "Receiver is not authorized for this transaction"
        );
      }

      req.transactionInfos = { payload, sender, receiver, transactionType };
      return next();
    }

    if (transactionType === TransactionType.CASH_IN) {
      if (
        !(
          sender.role === Role.SUPER_ADMIN ||
          sender.role === Role.ADMIN ||
          sender.role === Role.AGENT
        )
      ) {
        throw new AppError(
          httpStatus.UNAUTHORIZED,
          "Sender is not authorized for this transaction"
        );
      }
      if (receiver.role !== Role.USER) {
        throw new AppError(
          httpStatus.UNAUTHORIZED,
          "Receiver is not authorized for this transaction"
        );
      }

      req.transactionInfos = { payload, sender, receiver, transactionType };
      return next();
    }

    if (transactionType === TransactionType.CASH_OUT) {
      if (sender.role !== Role.USER) {
        throw new AppError(
          httpStatus.UNAUTHORIZED,
          "Sender is not authorized for this transaction"
        );
      }
      if (
        !(
          receiver.role === Role.SUPER_ADMIN ||
          receiver.role === Role.ADMIN ||
          receiver.role === Role.AGENT
        )
      ) {
        throw new AppError(
          httpStatus.UNAUTHORIZED,
          "Receiver is not authorized for this transaction"
        );
      }

      req.transactionInfos = { payload, sender, receiver, transactionType };
      return next();
    }

    if (transactionType === TransactionType.AGENT_UNLOAD) {
      if (sender.role !== Role.AGENT) {
        throw new AppError(
          httpStatus.UNAUTHORIZED,
          "Sender is not authorized for this transaction"
        );
      }
      if (
        !(
          receiver.role === Role.SUPER_ADMIN ||
          receiver.role === Role.ADMIN ||
          receiver.role === Role.AGENT
        )
      ) {
        throw new AppError(
          httpStatus.UNAUTHORIZED,
          "Receiver is not authorized for this transaction"
        );
      }

      req.transactionInfos = { payload, sender, receiver, transactionType };
      return next();
    }

    if (transactionType === TransactionType.ADMIN_UNLOAD) {
      if (sender.role !== Role.ADMIN) {
        throw new AppError(
          httpStatus.UNAUTHORIZED,
          "Sender is not authorized for this transaction"
        );
      }
      if (
        !(receiver.role === Role.SUPER_ADMIN || receiver.role === Role.ADMIN)
      ) {
        throw new AppError(
          httpStatus.UNAUTHORIZED,
          "Receiver is not authorized for this transaction"
        );
      }

      req.transactionInfos = { payload, sender, receiver, transactionType };
      return next();
    }

    if (transactionType === TransactionType.SENT_MONEY) {
      req.transactionInfos = { payload, sender, receiver, transactionType };
      return next();
    }

    // fallback for unsupported types
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Unsupported transition type. This ${transactionType} type transition is handeled automatically.`
    );
  } catch (error) {
    next(error);
  }
};

export default checkAuthority;
