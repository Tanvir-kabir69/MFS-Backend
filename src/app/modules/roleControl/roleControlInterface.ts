import { Types } from "mongoose";

export interface IRequestAdmin {
  _id?: Types.ObjectId;
  user_id: Types.ObjectId;
  approoval_id?: Types.ObjectId;
  isAccepted: boolean;
  isCancelled: boolean;
}

export interface IRequestAgent {
  _id?: Types.ObjectId;
  user_id: Types.ObjectId;
  approovar_id?: Types.ObjectId;
  isAccepted: boolean;
  isCancelled: boolean;
}

export interface IRequestHandler {
  request_id: Types.ObjectId;
//   approovar_id: Types.ObjectId;
}
