import { Schema, model, Document } from "mongoose";
import { IRequestAdmin, IRequestAgent } from "./roleControlInterface";

// ----------------------
// Admin Request Schema
// ----------------------
const requestAdminSchema = new Schema<IRequestAdmin & Document>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    approoval_id: {
      type: Schema.Types.ObjectId,
      ref: "User", // you can change this ref if needed
      //   required: true,
      default: null,
    },
    isAccepted: {
      type: Boolean,
      required: true,
      default: false,
    },
    isCancelled: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  { timestamps: true, versionKey: false }
);

export const RequestAdmin = model<IRequestAdmin & Document>(
  "RequestAdmin",
  requestAdminSchema
);

// ----------------------
// Agent Request Schema
// ----------------------
const requestAgentSchema = new Schema<IRequestAgent & Document>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    approovar_id: {
      type: Schema.Types.ObjectId,
      ref: "Agent", // change ref if needed
      //   required: true,
      default: null,
    },
    isAccepted: {
      type: Boolean,
      required: true,
      default: false,
    },
    isCancelled: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  { timestamps: true, versionKey: false }
);

export const RequestAgent = model<IRequestAgent & Document>(
  "RequestAgent",
  requestAgentSchema
);
