import httpStatus from "http-status-codes";
import { sendResponse } from "../../utils/sendResponse";
import { catchAsync } from "../../utils/catchAsync";
import { NextFunction, Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import { walletServices } from "./walletServices";

const getMyWalletBalance = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedToken = req.user as JwtPayload;
    const result = await walletServices.getMyWalletBalanceFromDB(decodedToken);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Wallet Amount Retrieved Successfully",
      data: { walletAmount: result?.amount },
    });
  }
);

export const walletController = { getMyWalletBalance };
