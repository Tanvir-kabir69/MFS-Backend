import z from "zod";
import { accountStatus, Role } from "./user.interface";

export const createUserZodSchema = z.object({
  email: z
    .string({ invalid_type_error: "Email must be string" })
    .email({ message: "Invalid email address format." })
    .min(5, { message: "Email must be at least 5 characters long." })
    .max(100, { message: "Email cannot exceed 100 characters." }),
  password: z
    .string({ invalid_type_error: "Password must be string" })
    .min(8, { message: "Password must be at least 8 characters long." })
    .regex(/^(?=.*[A-Z])/, {
      message: "Password must contain at least 1 uppercase letter.",
    })
    .regex(/^(?=.*[!@#$%^&*])/, {
      message: "Password must contain at least 1 special character.",
    })
    .regex(/^(?=.*\d)/, {
      message: "Password must contain at least 1 number.",
    }),
  phone: z
    .string({ invalid_type_error: "Phone Number must be string" })
    .regex(/^(?:\+8801\d{9}|01\d{9})$/, {
      message:
        "Phone number must be valid for Bangladesh. Format: +8801XXXXXXXXX or 01XXXXXXXXX",
    }),

  name: z
    .string({ invalid_type_error: "Name must be string" })
    .min(2, { message: "Name must be at least 2 characters long." })
    .max(50, { message: "Name cannot exceed 50 characters." }),
  address: z
    .string({ invalid_type_error: "Address must be string" })
    .max(200, { message: "Address cannot exceed 200 characters." })
    .optional(),
});

//
//
//

export const updateUserZodSchema = z.object({
  phone: z
    .string({ invalid_type_error: "Phone Number must be string" })
    .regex(/^(?:\+8801\d{9}|01\d{9})$/, {
      message:
        "Phone number must be valid for Bangladesh. Format: +8801XXXXXXXXX or 01XXXXXXXXX",
    })
    .optional(),

  // role: z.enum(Object.values(Role) as [string]).optional(),

  name: z
    .string({ invalid_type_error: "Name must be string" })
    .min(2, { message: "Name must be at least 2 characters long." })
    .max(50, { message: "Name cannot exceed 50 characters." })
    .optional(),
  address: z
    .string({ invalid_type_error: "Address must be string" })
    .max(200, { message: "Address cannot exceed 200 characters." })
    .optional(),

  isDeleted: z
    .boolean({ invalid_type_error: "isDeleted must be true or false" })
    .optional(),
  isVerified: z
    .boolean({ invalid_type_error: "isVerified must be true or false" })
    .optional(),
  accountStatus: z.enum(Object.values(accountStatus) as [string]).optional(),
});
