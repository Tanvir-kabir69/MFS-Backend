import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status-codes";
import { roleControllerService } from "./roleControllerService";
import { JwtPayload } from "jsonwebtoken";

const adminRequestControl = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedToken = req.user;
    const payload = req.body;

    const result = await roleControllerService.handleAdminRequest(
      decodedToken as JwtPayload,
      payload
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Admin Request submitted successfully",
      data: result,
    });
  }
);

const agentRequestControl = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedToken = req.user;
    const payload = req.body;

    const result = await roleControllerService.handleAgentRequest(
      decodedToken as JwtPayload,
      payload
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Agent Request submitted successfully",
      data: result,
    });
  }
);

const getMyAdminRequest = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedToken = req.user;

    const result = await roleControllerService.getMyAdminRequestfromDB(
      decodedToken as JwtPayload
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Admin requests retrivevd successfully",
      data: result,
    });
  }
);

const getMyAgentRequest = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedToken = req.user;

    const result = await roleControllerService.getMyAgentRequestfromDB(
      decodedToken as JwtPayload
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Agent requests retrivevd successfully",
      data: result,
    });
  }
);

const getAllAdminRequest = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await roleControllerService.getAllAdminRequestFromDB();

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "All valid admin requests retrivevd successfully",
      data: result,
    });
  }
);

const getAllAgentRequest = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await roleControllerService.getAllAgentRequestFromDB();

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "All valid agent requests retrivevd successfully",
      data: result,
    });
  }
);

const approveAdminRequest = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedToken = req.user;
    const payload = req.body;
    const result = await roleControllerService.handleApproovAdminRequest(
      decodedToken as JwtPayload,
      payload
    );

    if (!result.success) {
      sendResponse(res, {
        success: false,
        statusCode: httpStatus.OK,
        message: result.message || " Applicant need not to be an admin",
        data: result.cancelledAdminRequest,
      });

      return;
    }

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Admin request approved successfully",
      data: result,
    });
  }
);

const approveAgentRequest = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedToken = req.user;
    const payload = req.body;
    const result = await roleControllerService.handleApproovAgentRequest(
      decodedToken as JwtPayload,
      payload
    );

    if (!result.success) {
      sendResponse(res, {
        success: false,
        statusCode: httpStatus.OK,
        message: result.message || " Applicant need not to be an agent",
        data: result.cancelledAgentRequest,
      });

      return;
    }

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Agent request approved successfully",
      data: result,
    });
  }
);

const cancelAdminRequest = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedToken = req.user;
    const payload = req.body;
    const result = await roleControllerService.handleCancellationAdminRequest(
      decodedToken as JwtPayload,
      payload
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Admin request cancelled",
      data: result,
    });
  }
);

const cancelAgentRequest = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedToken = req.user;
    const payload = req.body;
    const result = await roleControllerService.handleCancellationAgentRequest(
      decodedToken as JwtPayload,
      payload
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Agent request cancelled",
      data: result,
    });
  }
);

const getAllAdmins = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await roleControllerService.getAllAdminsFromDB();

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Admins Retrived successfully",
      data: result,
    });
  }
);

const getAllAgents = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await roleControllerService.getAllAgentsFromDB();

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Agents Retrived successfully",
      data: result,
    });
  }
);

const getAllUsers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await roleControllerService.getAllUsersFromDB();

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Users Retrived successfully",
      data: result,
    });
  }
);

const getAll = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await roleControllerService.getAllFromDB();

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "All Users Retrived successfully",
      data: result,
    });
  }
);

export const roleControllerController = {
  adminRequestControl,
  agentRequestControl,
  getMyAdminRequest,
  getMyAgentRequest,
  getAllAdminRequest,
  getAllAgentRequest,
  approveAdminRequest,
  approveAgentRequest,
  cancelAdminRequest,
  cancelAgentRequest,
  getAllAdmins,
  getAllAgents,
  getAllUsers,
  getAll,
};
