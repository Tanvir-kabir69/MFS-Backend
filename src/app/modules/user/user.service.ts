import bcryptjs from "bcryptjs";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { envVars } from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { userSearchableFields } from "./user.constant";
import { IAuthProvider, IUser, Role } from "./user.interface";
import { User } from "./user.model";
import mongoose from "mongoose";
import { Wallet } from "../wallet/walletSchemaModel";

export const createUser = async (payload: Partial<IUser>) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { email, password, ...rest } = payload;

    // Check if user exists
    const isUserExist = await User.findOne({ email }).session(session);
    if (isUserExist) {
      throw new AppError(httpStatus.BAD_REQUEST, "User Already Exist");
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(
      password as string,
      Number(envVars.BCRYPT_SALT_ROUND)
    );

    const authProvider: IAuthProvider = {
      provider: "credentials",
      providerId: email as string,
    };

    // Create user inside transaction
    const [user] = await User.create(
      [
        {
          email,
          password: hashedPassword,
          auths: [authProvider],
          ...rest,
        },
      ],
      { session }
    );

    // Create wallet linked to user
    const [userWallet] = await Wallet.create(
      [
        {
          user_id: user._id,
          amount: Number(envVars.WALLET_INITIAL_AMOUNT) || 0,
        },
      ],
      { session }
    );

    // ✅ Commit both
    await session.commitTransaction();
    session.endSession();

    // return { user, userWallet };
    user.password = "";
    return { user, walletAmount: userWallet.amount };
  } catch (error) {
    // ❌ Rollback if any fails
    await session.abortTransaction();
    session.endSession();
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "User and user wallet is not created successfully"
    );
  }
};

const updateUser = async (
  userId: string,
  payload: Partial<IUser>,
  decodedToken: JwtPayload
) => {
  if (userId !== decodedToken.userId) {
    throw new AppError(401, "You are not authorized");
  }

  const ifUserExist = await User.findById(userId);

  if (!ifUserExist) {
    throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
  }

  if (payload.accountStatus || payload.isDeleted || payload.isVerified) {
    if (decodedToken.role === Role.USER || decodedToken.role === Role.AGENT) {
      throw new AppError(httpStatus.FORBIDDEN, "You are not authorized");
    }
  }

  const newUpdatedUser = await User.findByIdAndUpdate(userId, payload, {
    new: true,
    runValidators: true,
  });
  if (!newUpdatedUser) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "User is not updated successfully."
    );
  }

  newUpdatedUser.password = "";
  return newUpdatedUser;
};

const getAllUsers = async (query: Record<string, string>) => {
  const queryBuilder = new QueryBuilder(User.find().select("-password"), query);
  const usersData = queryBuilder
    .filter()
    .search(userSearchableFields)
    .sort()
    .fields()
    .paginate();

  const [data, meta] = await Promise.all([
    usersData.build(),
    queryBuilder.getMeta(),
  ]);

  return {
    data,
    meta,
  };
};

const getMe = async (userId: string) => {
  const user = await User.findById(userId).select("-password");
  return {
    data: user,
  };
};

const getSingleUser = async (id: string) => {
  const user = await User.findById(id).select("-password");
  return {
    data: user,
  };
};

export const UserServices = {
  createUser,
  updateUser,
  getAllUsers,
  getMe,
  getSingleUser,
};
