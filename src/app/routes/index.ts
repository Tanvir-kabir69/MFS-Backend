import { IRouter, Router } from "express";
import { AuthRoutes } from "../modules/auth/auth.route";
import { OtpRoutes } from "../modules/otp/otp.route";
import { UserRoutes } from "../modules/user/user.route";
import { roleControllerRouter } from "../modules/roleControl/roleControllerRoute";
import { transactionRouter } from "../modules/transaction/transactionRoute";
import { walletRouter } from "../modules/wallet/walletRouter";
import { restrictionControlRouter } from "../modules/restrictionsControl/restrictionControlRoute";

export const router: IRouter = Router();

const moduleRoutes = [
  {
    path: "/user",
    route: UserRoutes,
  },
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/otp",
    route: OtpRoutes,
  },
  {
    path: "/roleController",
    route: roleControllerRouter,
  },
  {
    path: "/transaction",
    route: transactionRouter,
  },
  {
    path: "/wallet",
    route: walletRouter,
  },
  {
    path: "/restriction",
    route: restrictionControlRouter,
  },
];

moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});
