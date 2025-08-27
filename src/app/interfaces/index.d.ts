import { JwtPayload } from "jsonwebtoken";
import { accountStatus, IUser } from "../modules/user/user.interface";
import {
  ITransaction,
  TransactionType,
} from "../modules/transaction/transactionInterface";

declare global {
  namespace Express {
    interface Request {
      user: JwtPayload;
      transactionInfos: {
        payload: Partial<ITransaction>;
        sender: IUser;
        receiver: IUser;
        transactionType: TransactionType;
        chargeTransaction?: ITransaction;
        commissionTransaction?: ITransaction;
        mainTransaction?: ITransaction;
      };
      restrictionInfos: {
        restrictionType: accountStatus;
        restrictableUser: IUser;
        restrictingUser?: IUser;
      };
      activityControlInfos: {
        activityControlType: accountStatus;
        activityControllableUser: IUser;
      };
    }
  }
}
