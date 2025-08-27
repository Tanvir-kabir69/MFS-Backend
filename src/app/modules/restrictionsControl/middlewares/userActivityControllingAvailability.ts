import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status-codes";
import AppError from "../../../errorHelpers/AppError";
import { JwtPayload } from "jsonwebtoken";
import { User } from "../../user/user.model";
import { accountStatus } from "../../user/user.interface";

const userActivityControllingAvailability = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // when we bypass request throw checkAuth before this middleware->

    // 1. we can restrict SUPER ADMIN amd ADMIN to be inActived
    // 2. if the requesting user exists or not is satisfied by checkAuth
    // 3. if, someone is blocked, no matter he is active or inactive, he cannot access protected routes, as well as in this route, so this condition is satisfied by the checkAuth
    // 4. if, someone is already inActive, he dosent need to be inActive, this condition also satisfid by checkAuth

    // so we don't need to check anything in this middleware, just bypass it and inActivate throw controller

    const decodedToken = req.user as JwtPayload;
    console.log(decodedToken)
    const payload = req.body;
    if (!payload || !payload.action) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Required data is missing in payload"
      );
    }
    if (!decodedToken || !decodedToken.userId) {
    // if (!decodedToken) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Token or ToKen data is missing"
      );
    }

    const isUserExist = await User.findOne({ _id: decodedToken.userId });
    if (!isUserExist) {
      throw new AppError(httpStatus.BAD_REQUEST, "You are not authorized");
    }
    if (isUserExist.accountStatus === accountStatus.BLOCKED) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `You are already ${isUserExist.accountStatus}. You don't need to be ${payload.action} anymore`
      );
    }
    if (isUserExist.accountStatus === payload.action) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `You are already ${isUserExist.accountStatus}. You don't need to be ${payload.action} anymore`
      );
    }

    req.activityControlInfos = {
      activityControlType: payload.action,
      activityControllableUser: isUserExist,
    };
    next();
  } catch (err) {
    next(err);
  }
};

export default userActivityControllingAvailability;
