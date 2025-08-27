import { IRouter, Router } from "express";
import { walletController } from "./walletControllers";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";

const router: IRouter = Router();

router.get("/my-balance",checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.AGENT, Role.USER), walletController.getMyWalletBalance);

export const walletRouter = router;
