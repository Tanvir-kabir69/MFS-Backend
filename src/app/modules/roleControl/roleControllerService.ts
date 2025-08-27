import { JwtPayload } from "jsonwebtoken";
import {
  IRequestAdmin,
  IRequestAgent,
  IRequestHandler,
} from "./roleControlInterface";
import { User } from "../user/user.model";
import AppError from "../../errorHelpers/AppError";
import httpStatus from "http-status-codes";
import { RequestAdmin, RequestAgent } from "./roleControlSchemaModel";
import { Role } from "../user/user.interface";
import mongoose from "mongoose";

const handleAdminRequest = async (
  decodedToken: JwtPayload,
  payload: Partial<IRequestAdmin>
) => {
  if (!payload.user_id) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Missing user_id. Provide appropriate user_id"
    );
  }

  if (decodedToken.userId !== payload.user_id) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "You are not authorized to submit Admin Request. Try with valid user_id"
    );
  }

  const findAdminRequest = await RequestAdmin.findOne({
    user_id: payload.user_id,
    isAccepted: false,
    isCancelled: false,
  });
  if (findAdminRequest) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You have already requested for Admin role"
    );
  }

  const result = await RequestAdmin.create(payload);
  return result;
};

const handleAgentRequest = async (
  decodedToken: JwtPayload,
  payload: Partial<IRequestAdmin>
) => {
  if (!payload.user_id) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Missing user_id. Provide appropriate user_id"
    );
  }

  if (decodedToken.userId !== payload.user_id) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "You are not authorized to submit Admin Request. Try with valid user_id"
    );
  }

  const findAgentRequest = await RequestAgent.findOne({
    user_id: payload.user_id,
    isAccepted: false,
    isCancelled: false,
  });
  if (findAgentRequest) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You have already requested for Agent role"
    );
  }

  const result = await RequestAgent.create(payload);
  return result;
};

const getMyAdminRequestfromDB = async (decodedToken: JwtPayload) => {
  const result = await RequestAdmin.find({ user_id: decodedToken.userId });
  return result;
};

const getMyAgentRequestfromDB = async (decodedToken: JwtPayload) => {
  const result = await RequestAgent.find({ user_id: decodedToken.userId });
  return result;
};

const getAllAdminRequestFromDB = async () => {
  const result = await RequestAdmin.find({
    isAccepted: false,
    isCancelled: false,
  });
  return result;
};

const getAllAgentRequestFromDB = async () => {
  const result = await RequestAgent.find({
    isAccepted: false,
    isCancelled: false,
  });
  return result;
};

const handleApproovAdminRequest = async (
  decodedToken: JwtPayload,
  payload: IRequestHandler
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // ✅ Step 1: Validate request
    const adminRequest = await RequestAdmin.findById(
      payload.request_id
    ).session(session);

    if (
      !adminRequest ||
      adminRequest.isAccepted === true ||
      adminRequest.isCancelled === true
    ) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "This is not a valid admin request"
      );
    }

    // ✅ Step 2: Validate approver
    const approover = await User.findById(decodedToken.userId).session(session);
    if (!approover || approover.role !== Role.SUPER_ADMIN) {
      throw new AppError(httpStatus.BAD_REQUEST, "You are not authorized");
    }

    // ✅ Step 3: Get applicant
    const applicant = await User.findById(adminRequest.user_id).session(
      session
    );

    // 🚫 Applicant is already ADMIN or SUPER_ADMIN
    if (
      applicant?.role === Role.SUPER_ADMIN ||
      applicant?.role === Role.ADMIN
    ) {
      const cancelledAdminRequest = await RequestAdmin.findByIdAndUpdate(
        payload.request_id,
        {
          isCancelled: true,
          approoval_id: approover._id,
        },
        { new: true, runValidators: true, session }
      );

      if (!cancelledAdminRequest) {
        throw new AppError(
          httpStatus.NOT_FOUND,
          "Admin request not found or update failed"
        );
      }

      // ✅ Commit before throwing (to persist cancellation)
      await session.commitTransaction();

      // throw new AppError(
      //   httpStatus.BAD_REQUEST,
      //   `Applicant is already ${applicant.role}. Applicant need not to be an admin`
      // );
      return {
        success: false,
        message: `Applicant is already ${applicant.role}. Applicant need not to be an admin`,
        cancelledAdminRequest,
      };
    }

    // ✅ Step 4: Accept Admin request
    const updatedAdminRequest = await RequestAdmin.findByIdAndUpdate(
      payload.request_id,
      {
        isAccepted: true,
        approoval_id: approover._id,
      },
      { new: true, runValidators: true, session }
    );

    if (!updatedAdminRequest) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "Admin request not found or update failed"
      );
    }

    // ✅ Step 5: Update applicant's role
    const updatedUser = await User.findByIdAndUpdate(
      updatedAdminRequest.user_id,
      { role: Role.ADMIN },
      { new: true, session }
    );

    if (!updatedUser) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "User Role upgradation to Admin failed"
      );
    }

    // ✅ If everything is fine → commit
    await session.commitTransaction();

    updatedUser.password = "";

    return { success: true, updatedAdminRequest, updatedUser };
  } catch (error) {
    // ❌ Rollback if anything fails
    await session.abortTransaction();
    throw error;
  } finally {
    // ✅ Always close session
    session.endSession();
  }
};

const handleApproovAgentRequest = async (
  decodedToken: JwtPayload,
  payload: IRequestHandler
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // ✅ Step 1: Validate request
    const agentRequest = await RequestAgent.findById(
      payload.request_id
    ).session(session);

    if (
      !agentRequest ||
      agentRequest.isAccepted === true ||
      agentRequest.isCancelled === true
    ) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "This is not a valid agent request"
      );
    }

    // ✅ Step 2: Validate approver
    const approover = await User.findById(decodedToken.userId).session(session);
    if (
      !approover ||
      !(approover.role === Role.SUPER_ADMIN || approover.role === Role.ADMIN)
    ) {
      throw new AppError(httpStatus.BAD_REQUEST, "You are not authorized");
    }

    // ✅ Step 3: Get applicant
    const applicant = await User.findById(agentRequest.user_id).session(
      session
    );

    // 🚫 Applicant is already ADMIN or SUPER_ADMIN
    if (
      applicant?.role === Role.SUPER_ADMIN ||
      applicant?.role === Role.ADMIN ||
      applicant?.role === Role.AGENT
    ) {
      const cancelledAgentRequest = await RequestAgent.findByIdAndUpdate(
        payload.request_id,
        {
          isCancelled: true,
          approoval_id: approover._id,
        },
        { new: true, runValidators: true, session }
      );

      if (!cancelledAgentRequest) {
        throw new AppError(
          httpStatus.NOT_FOUND,
          "Agent request not found or update failed"
        );
      }

      // ✅ Commit before throwing (to persist cancellation)
      await session.commitTransaction();

      // throw new AppError(
      //   httpStatus.BAD_REQUEST,
      //   `Applicant is already ${applicant.role}. Applicant need not to be an agent`
      // );

      return {
        success: false,
        message: `Applicant is already ${applicant.role}. Applicant need not to be an agent`,
        cancelledAgentRequest,
      };
    }

    // ✅ Step 4: Accept agent request
    const updatedAgentRequest = await RequestAgent.findByIdAndUpdate(
      payload.request_id,
      {
        isAccepted: true,
        approoval_id: approover._id,
      },
      { new: true, runValidators: true, session }
    );

    if (!updatedAgentRequest) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "Agent request not found or update failed"
      );
    }

    // ✅ Step 5: Update applicant's role
    const updatedUser = await User.findByIdAndUpdate(
      updatedAgentRequest.user_id,
      { role: Role.AGENT },
      { new: true, session }
    );

    if (!updatedUser) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "User Role upgradation to Agent failed"
      );
    }

    // ✅ If everything is fine → commit
    await session.commitTransaction();

    updatedUser.password = "";

    return { success: true, updatedAgentRequest, updatedUser };
  } catch (error) {
    // ❌ Rollback if anything fails
    await session.abortTransaction();
    throw error;
  } finally {
    // ✅ Always close session
    session.endSession();
  }
};

const handleCancellationAdminRequest = async (
  decodedToken: JwtPayload,
  payload: IRequestHandler
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // ✅ Step 1: Validate request
    const adminRequest = await RequestAdmin.findById(
      payload.request_id
    ).session(session);

    if (
      !adminRequest ||
      adminRequest.isAccepted === true ||
      adminRequest.isCancelled === true
    ) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "This is not a valid admin request"
      );
    }

    // ✅ Step 2: Validate approver
    const approover = await User.findById(decodedToken.userId).session(session);
    if (!approover || approover.role !== Role.SUPER_ADMIN) {
      throw new AppError(httpStatus.BAD_REQUEST, "You are not authorized");
    }

    // ✅ Step 3: Get applicant
    const applicant = await User.findById(adminRequest.user_id).session(
      session
    );

    // 🚫 Applicant is already ADMIN or SUPER_ADMIN
    if (
      applicant?.role === Role.SUPER_ADMIN ||
      applicant?.role === Role.ADMIN
    ) {
      const cancelledAdminRequest = await RequestAdmin.findByIdAndUpdate(
        payload.request_id,
        {
          isCancelled: true,
          approoval_id: approover._id,
        },
        { new: true, runValidators: true, session }
      );

      if (!cancelledAdminRequest) {
        throw new AppError(
          httpStatus.NOT_FOUND,
          "Admin request not found or update failed"
        );
      }

      // ✅ Commit before throwing (to persist cancellation)
      await session.commitTransaction();

      return cancelledAdminRequest;
    }

    // ✅ Step 4: cancel Admin request
    const cancelledAdminRequest = await RequestAdmin.findByIdAndUpdate(
      payload.request_id,
      {
        isCancelled: true,
        approoval_id: approover._id,
      },
      { new: true, runValidators: true, session }
    );

    if (!cancelledAdminRequest) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "Admin request not found or update failed"
      );
    }

    // ✅ If everything is fine → commit
    await session.commitTransaction();

    return cancelledAdminRequest;
  } catch (error) {
    // ❌ Rollback if anything fails
    await session.abortTransaction();
    throw error;
  } finally {
    // ✅ Always close session
    session.endSession();
  }
};

const handleCancellationAgentRequest = async (
  decodedToken: JwtPayload,
  payload: IRequestHandler
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // ✅ Step 1: Validate request
    const agentRequest = await RequestAgent.findById(
      payload.request_id
    ).session(session);

    if (
      !agentRequest ||
      agentRequest.isAccepted === true ||
      agentRequest.isCancelled === true
    ) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "This is not a valid agent request"
      );
    }

    // ✅ Step 2: Validate approver
    const approover = await User.findById(decodedToken.userId).session(session);
    if (!approover || approover.role !== Role.SUPER_ADMIN) {
      throw new AppError(httpStatus.BAD_REQUEST, "You are not authorized");
    }

    // ✅ Step 3: Get applicant
    const applicant = await User.findById(agentRequest.user_id).session(
      session
    );

    // 🚫 Applicant is already ADMIN or SUPER_ADMIN or AGENT
    if (
      applicant?.role === Role.SUPER_ADMIN ||
      applicant?.role === Role.ADMIN ||
      applicant?.role === Role.AGENT
    ) {
      const cancelledAgentRequest = await RequestAgent.findByIdAndUpdate(
        payload.request_id,
        {
          isCancelled: true,
          approoval_id: approover._id,
        },
        { new: true, runValidators: true, session }
      );

      if (!cancelledAgentRequest) {
        throw new AppError(
          httpStatus.NOT_FOUND,
          "Agent request not found or update failed"
        );
      }

      // ✅ Commit before throwing (to persist cancellation)
      await session.commitTransaction();

      return cancelledAgentRequest;
    }

    // ✅ Step 4: Cancel Agent request
    const cancelledAgentRequest = await RequestAgent.findByIdAndUpdate(
      payload.request_id,
      {
        isCancelled: true,
        approoval_id: approover._id,
      },
      { new: true, runValidators: true, session }
    );

    if (!cancelledAgentRequest) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "Agent request not found or update failed"
      );
    }

    // ✅ If everything is fine → commit
    await session.commitTransaction();

    return cancelledAgentRequest;
  } catch (error) {
    // ❌ Rollback if anything fails
    await session.abortTransaction();
    throw error;
  } finally {
    // ✅ Always close session
    session.endSession();
  }
};

// const handleRoleRequest = async (
//   decodedToken: JwtPayload,
//   payload: IRequestHandler,
//   action: "APPROVE" | "CANCEL"
// ) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const approver = await User.findById(decodedToken.userId).session(session);
//     if (!approver) {
//       throw new AppError(httpStatus.BAD_REQUEST, "You are not authorized");
//     }

//     // 🔹 Fetch the request (can be for Admin/Agent/Other role)
//     const request = await RoleRequest.findById(payload.request_id).session(session);
//     if (!request) {
//       throw new AppError(httpStatus.NOT_FOUND, "Request not found");
//     }

//     if (action === "APPROVE") {
//       request.isAccepted = true;
//       request.isCancelled = false;
//       request.approval_id = approver._id;
//       await request.save({ session });

//       // 🔹 Upgrade user role
//       const updatedUser = await User.findByIdAndUpdate(
//         request.user_id,
//         { role: request.requestedRole }, // role comes dynamically
//         { new: true, session }
//       );

//       if (!updatedUser) {
//         throw new AppError(httpStatus.NOT_FOUND, "User role upgrade failed");
//       }

//       await session.commitTransaction();
//       session.endSession();
//       return { request, updatedUser };
//     }

//     if (action === "CANCEL") {
//       request.isCancelled = true;
//       request.approval_id = approver._id;
//       await request.save({ session });

//       await session.commitTransaction();
//       session.endSession();
//       return request;
//     }
//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();
//     throw error;
//   }
// };

const getAllAdminsFromDB = async () => {
  const result = await User.find({ role: Role.ADMIN }).select("-password");
  return result;
};

const getAllAgentsFromDB = async () => {
  const result = await User.find({ role: Role.AGENT }).select("-password");
  return result;
};

const getAllUsersFromDB = async () => {
  const result = await User.find({ role: Role.USER }).select("-password");
  return result;
};

const getAllFromDB = async () => {
  const result = await User.find().select("-password");
  return result;
};

export const roleControllerService = {
  handleAdminRequest,
  handleAgentRequest,
  getMyAdminRequestfromDB,
  getMyAgentRequestfromDB,
  getAllAdminRequestFromDB,
  getAllAgentRequestFromDB,
  handleApproovAdminRequest,
  handleApproovAgentRequest,
  handleCancellationAdminRequest,
  handleCancellationAgentRequest,
  getAllAdminsFromDB,
  getAllAgentsFromDB,
  getAllUsersFromDB,
  getAllFromDB,
};
