import { Types } from "mongoose";

export enum Role {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  AGENT = "AGENT",
  USER = "USER",
}

export interface IAuthProvider {
  provider: "google" | "credentials";
  providerId: string;
}

export enum accountStatus {
  BLOCKED = "BLOCKED",
  UNBLOCKED = "UNBLOCKED",
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

export interface IUser {
  _id?: Types.ObjectId;

  email: string;
  password?: string;
  phone: string;

  role: Role;

  name: string;
  picture?: string;
  address?: string;

  auths?: IAuthProvider[];

  isDeleted?: boolean;
  isVerified?: boolean;
  accountStatus?: accountStatus;

  createdAt?: Date;

  // IP
  // face
  // finger
  // BC
  // NID
  // passport
}
