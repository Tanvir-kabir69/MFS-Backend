import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status-codes";
import { restrictionControlService } from "./restrictionControlService";

const handleActivity = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await restrictionControlService.handleActivityIntoDB(req);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: `You are ${req.activityControlInfos.activityControlType} successfully`,
      data: result,
    });
  }
);

const handleRestriction = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await restrictionControlService.handleRestrictionIntoDB(req);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: `This user ${req.restrictionInfos.restrictionType} successfully.`,
      data: result,
    });
  }
);

const getInactiveUsers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await restrictionControlService.getInactiveUsersFromDB();

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: `Inactive Users retrived successfully.`,
      data: result,
    });
  }
);

const getBlockedUsers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await restrictionControlService.getBlockedUsersFromDB();

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: `Blocked Users retrived successfully.`,
      data: result,
    });
  }
);

export const restrictionControlController = {
  handleActivity,
  handleRestriction,
  getInactiveUsers,
  getBlockedUsers,
};
