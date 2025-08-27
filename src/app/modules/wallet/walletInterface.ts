import { Types } from "mongoose";

export interface IWallet {
    _id?: Types.ObjectId;
    user_id: Types.ObjectId;
    amount: number
    transictions: Types.ObjectId[]
}