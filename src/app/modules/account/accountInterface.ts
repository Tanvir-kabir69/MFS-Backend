// so before creating user, we have t0 create an wallet, then account by adding wallet_id, then user, then update wallet and account by adding user_id

import { Types } from "mongoose";

// blocked - management can block any account for any reason, and also cna unblock when reason is solved
// restricted - management can restrict an account for a particular period of time for violation of rules
// suspended - management can suspend an account for lifetime for violations of serious community standards

export enum AccountStatus {
  BLOCKED = "BLOCKED",
  RESTRICTED = "RESTRICTED",
  SUSPENDED = "SUSPENDED",
}

// all fields are optional, because an accoount will be created autimatically withouth any data before creating an user.
export interface IAccount {
  _id?: Types.ObjectId;
  user_id?: Types.ObjectId; // user_id is optional, means, an account will be created automatically before creating an user. after creating an user the account's user_id will be updated
  //   wallet_id?: Types.ObjectId;
  accountNumber?: string;
  accountAmount: number; // this will activate when sections are activated.
  accountSections?: {
    wallet: {
      wallet_id: Types.ObjectId;
      amount: number;
    };
    //   drawer: {
    //     isAvailable: boolean;
    //     amount: number;
    //   };
    //   vault: {
    //     isAvailable: boolean;
    //     amount: number;
    //   };
  };
  accountTransictions?: Types.ObjectId[]; // each transiction will contain sender and receiver account_id, amount,transaction_method, sendersFee, receiversFee, time, accountSection with its verification confirmation
  accountStatus?: AccountStatus; // later, it will be converted into an object having two fields, accountStatus and actions which is an array containing objects containint actions name and their occurance time
}
