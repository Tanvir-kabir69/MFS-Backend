import { z } from "zod";

// ----------------------
// Admin Request Validation
// ----------------------
export const requestAdminZodSchema = z.object({
  user_id: z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
    message: "Invalid user_id (must be a valid Mongo ObjectId)",
  }),
//   approoval_id: z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
//     message: "Invalid approoval_id (must be a valid Mongo ObjectId)",
//   }),
//   isAccepted: z.boolean().optional(), // default handled in DB
});

// ----------------------
// Agent Request Validation
// ----------------------
export const requestAgentZodSchema = z.object({
  user_id: z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
    message: "Invalid user_id (must be a valid Mongo ObjectId)",
  }),
//   approovar_id: z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
//     message: "Invalid approovar_id (must be a valid Mongo ObjectId)",
//   }),
//   isAccepted: z.boolean().optional(),
});

// ----------------------
// Request Approoval Validation
// ----------------------
export const requestHandlerZodSchema = z.object({
  request_id: z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
    message: "Invalid request_id (must be a valid Mongo ObjectId)",
  }),
//   approovar_id: z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
//     message: "Invalid approovar_id (must be a valid Mongo ObjectId)",
//   }),
});

// ----------------------
// Types from Zod
// Type inference
// ----------------------
export type RequestHandlerInput = z.infer<typeof requestHandlerZodSchema>;
export type RequestAdminInput = z.infer<typeof requestAdminZodSchema>;
export type RequestAgentInput = z.infer<typeof requestAgentZodSchema>;
