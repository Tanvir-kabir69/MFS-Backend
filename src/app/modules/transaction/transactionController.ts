import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import AppError from "../../errorHelpers/AppError";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { transactionServices } from "./transactionServices";

const handleTransactionResponse = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const mainTransaction = req.transactionInfos.mainTransaction;
    if (!mainTransaction) {
      throw new AppError(httpStatus.EXPECTATION_FAILED, "Transaction Failed.");
    }
    console.log(mainTransaction)

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Transaction Successful.",
      data: {
        mainTransaction,
        chargeTransaction: req.transactionInfos.chargeTransaction,
        commissionTransaction: req.transactionInfos.commissionTransaction,
      },
    });
  }
);

const getMyTransactions = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const query = req.query;
    const decodedToken = req.user as JwtPayload;
    if (!decodedToken) {
      throw new AppError(httpStatus.BAD_REQUEST, "No Token Received");
    }

    const result = await transactionServices.getMyTransactionFromDB(
      query as Record<string, string>,
      decodedToken
    );
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Transactions Retrived successfully.",
      data: result.data,
    });
  }
);

const getAllTransactions = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await transactionServices.getAllTransactionsFromDB();

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "All Transactions Retrived successfully.",
      data: result,
    });
  }
);

const getMyCommissionHistory = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedToken = req.user as JwtPayload;
    if (!decodedToken) {
      throw new AppError(httpStatus.BAD_REQUEST, "No Token Received");
    }

    const result = await transactionServices.getMyCommissionHistoryFromDB(
      decodedToken.email
    );
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Commission Histories Retrived successfully.",
      data: result,
    });
  }
);

export const transactionController = {
  handleTransactionResponse,
  getMyTransactions,
  getAllTransactions,
  getMyCommissionHistory,
};
