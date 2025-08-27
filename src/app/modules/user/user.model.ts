import { model, Schema } from "mongoose";
import { IAuthProvider, accountStatus, IUser, Role } from "./user.interface";

const authProviderSchema = new Schema<IAuthProvider>(
  {
    provider: { type: String, required: true },
    providerId: { type: String, required: true },
  },
  {
    versionKey: false,
    _id: false,
  }
);

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String },
    phone: { type: String, required: true },
    // phone: { type: String, required: true, unique: true },

    role: {
      type: String,
      enum: Object.values(Role),
      default: Role.USER,
    },

    name: { type: String, required: true },
    picture: { type: String },
    address: { type: String },

    auths: { type: [authProviderSchema], default: [] },

    isDeleted: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    accountStatus: {
      type: String,
      enum: Object.values(accountStatus),
      default: accountStatus.ACTIVE,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const User = model<IUser>("User", userSchema);
