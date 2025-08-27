import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status-codes";
import AppError from "../../../errorHelpers/AppError";
import { Role } from "../../user/user.interface";
import { JwtPayload } from "jsonwebtoken";

const userRestrictionPermission = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const decodedToken = req.user as JwtPayload;
    if (!decodedToken || !decodedToken.userId || !decodedToken.role) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Token or Tolen data is missing"
      );
    }
    if (
      decodedToken.role === Role.ADMIN &&
      req.restrictionInfos.restrictableUser.role === Role.ADMIN
    ) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `You are unauthorized. Only SUPER ADMIN can perform ADMIN BLOCKING/UNBLOCKING`
      );
    }

    next();
  } catch (err) {
    next(err);
  }
};

export default userRestrictionPermission;
