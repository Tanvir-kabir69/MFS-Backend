import { NextFunction, Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import { ITransaction, TransactionType } from "../transactionInterface";
import { Wallet } from "../../wallet/walletSchemaModel";
import AppError from "../../../errorHelpers/AppError";
import httpStatus from "http-status-codes";
import { envVars } from "../../../config/env";
import { getUserDailyGrandTotalByEmail } from "../utils/getUserDailyTransactionTotalsByEmail";
import { Role } from "../../user/user.interface";

export const checkAvailabity = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const decodedToken = req.user as JwtPayload;
    const payload: Partial<ITransaction> = req.body;
    const transactionInfos = req.transactionInfos;

    if (!payload.amount) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "No available amount field. Include Transfer amount."
      );
    }

    const senderWallet = await Wallet.findOne({
      user_id: transactionInfos.sender._id,
    });
    if (!senderWallet) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        "Sender have no Existing Wallet. Recreate account to have an Wallet"
      );
    }
    if (senderWallet.amount < payload.amount) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Not available balance to transfer. ."
      );
    }

    if (transactionInfos.transactionType === TransactionType.ADMIN_LOAD) {
      return next();
    }

    if (transactionInfos.transactionType === TransactionType.AGENT_LOAD) {
      return next();
    }
    if (transactionInfos.transactionType === TransactionType.ADMIN_UNLOAD) {
      return next();
    }

    if (transactionInfos.transactionType === TransactionType.AGENT_UNLOAD) {
      return next();
    }

    // only agent and user have transaction limitation
    // only cash in , cash out, send money have charge

    if (transactionInfos.transactionType === TransactionType.CASH_IN) {
      const cashInCharge = payload.amount * Number(envVars.CASH_IN_CHARGE);
      if (senderWallet.amount < payload.amount + cashInCharge) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          `Not available balance to  transfer. Transfer amount ${
            payload.amount
          }, Cash in charge ${cashInCharge}. Make sure agent have total ${
            payload.amount + cashInCharge
          }. Otherwise reduce transfer amount`
        );
      }
      const { grandTotal: senderGrantTotal } =
        await getUserDailyGrandTotalByEmail(
          Role.AGENT,
          transactionInfos.sender.email
        );
      if (
        senderGrantTotal + payload.amount + cashInCharge >
        Number(envVars.AGENT_TRANSACTION_LIMIT)
      ) {
        throw new AppError(
          httpStatus.EXPECTATION_FAILED,
          `This Transaction crosses agent's daily transaction limit.You can Cash in onle ${
            Number(envVars.AGENT_TRANSACTION_LIMIT) - senderGrantTotal
          } without cash in charge`
        );
      }

      const { grandTotal: receiverGrantTotal } =
        await getUserDailyGrandTotalByEmail(
          Role.USER,
          transactionInfos.receiver.email
        );
      if (
        receiverGrantTotal + payload.amount >
        Number(envVars.USER_TRANSACTION_LIMIT)
      ) {
        throw new AppError(
          httpStatus.EXPECTATION_FAILED,
          `This Transaction crosses user's daily transaction limit.You can Cash in onle ${
            Number(envVars.USER_TRANSACTION_LIMIT) - receiverGrantTotal
          }`
        );
      }

      return next();
    }

    if (transactionInfos.transactionType === TransactionType.CASH_OUT) {
      const cashOutCharge = payload.amount * Number(envVars.CASH_OUT_CHARGE);
      if (senderWallet.amount < payload.amount + cashOutCharge) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          `Not available balance to Cash out. Cash out amount ${
            payload.amount
          }, Cash out charge ${cashOutCharge}. Make sure you have total ${
            payload.amount + cashOutCharge
          }. Oterwise reduce Cash out amount`
        );
      }
      const { grandTotal: senderGrantTotal } =
        await getUserDailyGrandTotalByEmail(
          Role.USER,
          transactionInfos.sender.email
        );
      if (
        senderGrantTotal + payload.amount + cashOutCharge >
        Number(envVars.USER_TRANSACTION_LIMIT)
      ) {
        throw new AppError(
          httpStatus.EXPECTATION_FAILED,
          `This Cash out crosses your daily transaction limit. With cash out charge You can transfer onlY ${
            Number(envVars.USER_TRANSACTION_LIMIT) - senderGrantTotal
          }`
        );
      }

      const { grandTotal: receiverGrantTotal } =
        await getUserDailyGrandTotalByEmail(
          Role.AGENT,
          transactionInfos.receiver.email
        );
      if (
        receiverGrantTotal + payload.amount >
        Number(envVars.AGENT_TRANSACTION_LIMIT)
      ) {
        throw new AppError(
          httpStatus.EXPECTATION_FAILED,
          `This Transaction crosses agent's daily transaction limit.Agent can cash out onlY ${
            Number(envVars.AGENT_TRANSACTION_LIMIT) - receiverGrantTotal
          } without cash out charge`
        );
      }

      return next();
    }

    if (transactionInfos.transactionType === TransactionType.SENT_MONEY) {
      // only agent and user have transaction limit
      if (
        transactionInfos.sender.role === Role.AGENT &&
        transactionInfos.receiver.role === Role.USER
      ) {
        // same as cash in
        const sentMoneyCharge =
          payload.amount * Number(envVars.SENT_MONEY_CHARGE);
        if (senderWallet.amount < payload.amount + sentMoneyCharge) {
          throw new AppError(
            httpStatus.BAD_REQUEST,
            `Not available balance to  transfer. Transfer amount ${
              payload.amount
            }, Sent money charge ${sentMoneyCharge}. Make sure agent have total ${
              payload.amount + sentMoneyCharge
            }. Otherwise reduce transfer amount`
          );
        }
        const { grandTotal: senderGrantTotal } =
          await getUserDailyGrandTotalByEmail(
            Role.AGENT,
            transactionInfos.sender.email
          );
        if (
          senderGrantTotal + payload.amount + sentMoneyCharge >
          Number(envVars.AGENT_TRANSACTION_LIMIT)
        ) {
          throw new AppError(
            httpStatus.EXPECTATION_FAILED,
            `This Transaction crosses agent's daily transaction limit.You can Sent Money only ${
              Number(envVars.AGENT_TRANSACTION_LIMIT) - senderGrantTotal
            }`
          );
        }

        const { grandTotal: receiverGrantTotal } =
          await getUserDailyGrandTotalByEmail(
            Role.USER,
            transactionInfos.receiver.email
          );
        if (
          receiverGrantTotal + payload.amount >
          Number(envVars.USER_TRANSACTION_LIMIT)
        ) {
          throw new AppError(
            httpStatus.EXPECTATION_FAILED,
            `This Transaction crosses user's daily transaction limit.You can receive onle ${
              Number(envVars.USER_TRANSACTION_LIMIT) - receiverGrantTotal
            } without send money charge`
          );
        }

        return next();
      }

      //   like as cash out
      if (
        transactionInfos.sender.role === Role.USER &&
        transactionInfos.receiver.role === Role.AGENT
      ) {
        const sentMoneyCharge =
          payload.amount * Number(envVars.SENT_MONEY_CHARGE);
        if (senderWallet.amount < payload.amount + sentMoneyCharge) {
          throw new AppError(
            httpStatus.BAD_REQUEST,
            `Not available balance to Send Money. Send money amount ${
              payload.amount
            }, Send Money charge ${sentMoneyCharge}. Make sure you have total ${
              payload.amount + sentMoneyCharge
            }. Oterwise reduce Sent Money amount`
          );
        }
        const { grandTotal: senderGrantTotal } =
          await getUserDailyGrandTotalByEmail(
            Role.USER,
            transactionInfos.sender.email
          );
        if (
          senderGrantTotal + payload.amount + sentMoneyCharge >
          Number(envVars.USER_TRANSACTION_LIMIT)
        ) {
          throw new AppError(
            httpStatus.EXPECTATION_FAILED,
            `This Send money crosses your daily transaction limit. With Send money charge You can transfer onlY ${
              Number(envVars.USER_TRANSACTION_LIMIT) - senderGrantTotal
            }`
          );
        }

        const { grandTotal: receiverGrantTotal } =
          await getUserDailyGrandTotalByEmail(
            Role.AGENT,
            transactionInfos.receiver.email
          );
        if (
          receiverGrantTotal + payload.amount >
          Number(envVars.AGENT_TRANSACTION_LIMIT)
        ) {
          throw new AppError(
            httpStatus.EXPECTATION_FAILED,
            `This Transaction crosses agent's daily transaction limit.Agent can receive onlY ${
              Number(envVars.AGENT_TRANSACTION_LIMIT) - receiverGrantTotal
            } without sent money charge`
          );
        }

        return next();
      }
      //   like between user to user
      if (
        transactionInfos.sender.role === Role.USER &&
        transactionInfos.receiver.role === Role.USER
      ) {
        // ---- also need to validate like above

        return next();
      }
      //   like between agent to agent
      if (
        transactionInfos.sender.role === Role.AGENT &&
        transactionInfos.receiver.role === Role.AGENT
      ) {
        // ---- also need to validate like above
        return next();
      }
      //   like between user to anyone
      if (transactionInfos.sender.role === Role.USER) {
        // ---- also need to validate like above
        return next();
      }
      //   like between agent to anyone
      if (transactionInfos.sender.role === Role.AGENT) {
        // ---- also need to validate like above
        return next();
      }
      //   like between anyone to user
      if (transactionInfos.receiver.role === Role.USER) {
        // ---- also need to validate like above
        return next();
      }
      //   like between anyone to agent,
      if (transactionInfos.receiver.role === Role.AGENT) {
        // ---- also need to validate like above
        return next();
      }

      return next();
    }
  } catch (error) {
    next(error);
  }
};
