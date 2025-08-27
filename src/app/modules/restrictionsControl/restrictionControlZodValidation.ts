import z from "zod";
import { accountStatus } from "../user/user.interface";

export const restrictionControlZodValidationSchema = z.object({
  requestEmail: z.string().email({ message: "Invalid receiver email format" }),
  
  action: z.enum([accountStatus.BLOCKED, accountStatus.UNBLOCKED], {
    required_error: "Action is required",
    invalid_type_error: "Action must be ACTIVE or BLOCKED",
  }),
});

export const ActivityControllingZodValidationSchema = z.object({
  action: z.enum([accountStatus.INACTIVE, accountStatus.ACTIVE], {
    required_error: "Action is required",
    invalid_type_error: "Action must be ACTIVE or BLOCKED",
  }),
});
