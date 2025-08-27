import { IRouter, Router } from "express";
import { validateRequest } from "../../middlewares/validateRequest";
import { transactionZodSchema } from "./transactionZodValidation";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import checkAuthority from "./middlewares/checkAuthorityADV";
import { checkAvailability } from "./middlewares/checkAvailabilityADV";
import { distributeTransaction } from "./middlewares/distributeTransactionAVD";
import { transactionController } from "./transactionController";

const router: IRouter = Router();

router.post("/", validateRequest(transactionZodSchema), checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.AGENT, Role.USER), checkAuthority, checkAvailability, distributeTransaction, transactionController.handleTransactionResponse);

router.get("/my-transactions", checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.AGENT, Role.USER), transactionController.getMyTransactions)
router.get("/my-commissions", checkAuth(Role.AGENT, Role.USER), transactionController.getMyCommissionHistory)
router.get("/all-transactions", checkAuth(Role.SUPER_ADMIN, Role.ADMIN), transactionController.getAllTransactions)

export const transactionRouter = router;
