import AppError from "../../errorHelpers/AppError";
import httpStatus from "http-status-codes";
import { User } from "../user/user.model";
import { Request } from "express";
import { accountStatus } from "../user/user.interface";

const handleActivityIntoDB = async (req: Request) => {
  const result = await User.findByIdAndUpdate(
    req.activityControlInfos.activityControllableUser._id,
    { accountStatus: req.activityControlInfos.activityControlType },
    { new: true }
  );
  if (!result) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `This user is not ${req.activityControlInfos.activityControlType} successfully.`
    );
  }

  result.password = "";
  return result;
};

const handleRestrictionIntoDB = async (req: Request) => {
  const result = await User.findByIdAndUpdate(
    req.restrictionInfos.restrictableUser._id,
    { accountStatus: req.restrictionInfos.restrictionType },
    { new: true }
  );

  if (!result) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `This user is not ${req.restrictionInfos.restrictionType} successfully.`
    );
  }

  result.password = "";
  return result;
};

const getInactiveUsersFromDB = async () => {
  const result = await User.find({
    accountStatus: accountStatus.INACTIVE,
  }).select("-password");
  return result;
};

const getBlockedUsersFromDB = async () => {
  const result = await User.find({
    accountStatus: accountStatus.BLOCKED,
  }).select("-password");
  return result;
};

export const restrictionControlService = {
  handleActivityIntoDB,
  handleRestrictionIntoDB,
  getInactiveUsersFromDB,
  getBlockedUsersFromDB,
};
