import { JwtPayload } from "jsonwebtoken";
import { Wallet } from "./walletSchemaModel";

const getMyWalletBalanceFromDB = async (decodedToken: JwtPayload) => {
  const result = await Wallet.findOne({ user_id: decodedToken.userId });
  return result;
};

export const walletServices = {
  getMyWalletBalanceFromDB,
};
