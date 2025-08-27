import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import AppError from "../../../errorHelpers/AppError";
import { verifyToken } from "../../../utils/jwt";
import { envVars } from "../../../config/env";
import { User } from "../../user/user.model";
import { accountStatus } from "../../user/user.interface";

export const forbidUnnecessaryRequest =
  (reQuiredRole: string, ...permittedRoles: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accessToken = req.headers.authorization || req.cookies.accessToken;

      if (!accessToken) {
        throw new AppError(403, "No Token Recieved");
      }

      const verifiedToken = verifyToken(
        accessToken,
        envVars.JWT_ACCESS_SECRET
      ) as JwtPayload;

      console.log(verifiedToken)

      const isUserExist = await User.findOne({ _id: verifiedToken.userId });

      if (!isUserExist) {
        throw new AppError(httpStatus.BAD_REQUEST, "User does not exist");
      }
      // if (!isUserExist.isVerified) {
      //     throw new AppError(httpStatus.BAD_REQUEST, "User is not verified")
      // }
      if (
        isUserExist.accountStatus === accountStatus.BLOCKED ||
        isUserExist.accountStatus === accountStatus.INACTIVE
      ) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          `User is ${isUserExist.accountStatus}`
        );
      }
      if (isUserExist.isDeleted) {
        throw new AppError(httpStatus.BAD_REQUEST, "User is deleted");
      }

      if (!permittedRoles.includes(verifiedToken.role)) {
        throw new AppError(
          403,
          `You are already ${isUserExist.role}. You dont need to be ${reQuiredRole}`
        );
      }
      req.user = verifiedToken;
      next();
    } catch (error) {
      console.log("jwt error", error);
      next(error);
    }
  };
