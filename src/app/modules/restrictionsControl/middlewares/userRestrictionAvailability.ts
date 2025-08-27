import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status-codes";
import AppError from "../../../errorHelpers/AppError";
import { User } from "../../user/user.model";
import { accountStatus, Role } from "../../user/user.interface";

const userRestrictionAvailability =
  // (restrictionType: accountStatus) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = req.body;
      if (!payload || !payload.requestEmail || !payload.action) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "Required data is missing in payload"
        );
      }
      const isUserExist = await User.findOne({ email : payload.requestEmail });
      if (!isUserExist) {
        throw new AppError(httpStatus.BAD_REQUEST, "Required User is missing");
      }

      if (isUserExist.accountStatus === accountStatus.INACTIVE) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          `Required User is already ${isUserExist.accountStatus}. You cann't ${payload.action} anymore`
        );
      }
      if (isUserExist.accountStatus === payload.action) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          `Required User is already ${isUserExist.accountStatus}. You cann't ${payload.action} anymore`
        );
      }
      if ((isUserExist.accountStatus !== accountStatus.BLOCKED) && (payload.action === accountStatus.UNBLOCKED)) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          `Required User is not ${accountStatus.BLOCKED}. You cann't ${payload.action} an USER who is not BLOCKED`
        );
      }

      // FORBIDDING SUPER USER TO BE BLOCKED / UNBLOCKED
      if (isUserExist.role === Role.SUPER_ADMIN) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          `Required User is ${isUserExist.role}. ${isUserExist.role} is not BLOCK/UNBLOCK able.`
        );
      }

      req.restrictionInfos = { restrictableUser: isUserExist, restrictionType: payload.action };
      next();
    } catch (err) {
      next(err);
    }
  };

export default userRestrictionAvailability;
