import { IRouter, Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { validateRequest } from "../../middlewares/validateRequest";
import { ActivityControllingZodValidationSchema, restrictionControlZodValidationSchema } from "./restrictionControlZodValidation";
import { restrictionControlController } from "./restrictionControlController";
import userRestrictionAvailability from "./middlewares/userRestrictionAvailability";
import userInactivitingAvailability from "./middlewares/userActivityControllingAvailability";
import { checkRole } from "./middlewares/checkRole";
import userRestrictionPermission from "./middlewares/userRestrictionPermission";

const router: IRouter = Router()

router.post("/activity-control", checkRole(Role.AGENT, Role.USER), validateRequest(ActivityControllingZodValidationSchema), userInactivitingAvailability, restrictionControlController.handleActivity)

router.post("/blocking-control", checkAuth(Role.SUPER_ADMIN, Role.ADMIN), validateRequest(restrictionControlZodValidationSchema), userRestrictionAvailability, userRestrictionPermission, restrictionControlController.handleRestriction)

router.get("/inactive-users", checkAuth(Role.SUPER_ADMIN, Role.ADMIN), restrictionControlController.getInactiveUsers)
router.get("/blocked-users", checkAuth(Role.SUPER_ADMIN, Role.ADMIN), restrictionControlController.getBlockedUsers)

export const restrictionControlRouter = router 

// you (user and agent) cannot active or inactive if you are blocked by authority
// authority can not block or unblock you if you are inactive
