import { Schema, model, Types } from "mongoose";
import { IWallet } from "./walletInterface";

const walletSchema = new Schema<IWallet>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    amount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    transictions: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "Transaction", // ✅ points to the base Transaction model
        },
      ],
      required: true,
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const Wallet = model<IWallet>("Wallet", walletSchema);
