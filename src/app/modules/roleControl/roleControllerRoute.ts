import { IRouter, Router } from "express";
import { validateRequest } from "../../middlewares/validateRequest";
import { requestAdminZodSchema, requestAgentZodSchema, requestHandlerZodSchema } from "./roleControlZodValidation";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { roleControllerController } from "./roleControllerController";
import { forbidUnnecessaryRequest } from "./middlewares/forbidUnnecessaryRequest";

const router: IRouter = Router()

router.post("/request-admin",forbidUnnecessaryRequest(Role.ADMIN, Role.USER, Role.AGENT), validateRequest(requestAdminZodSchema), roleControllerController.adminRequestControl) // admin and super admin need not to be admin anymore
router.post("/request-agent",forbidUnnecessaryRequest(Role.AGENT, Role.USER), validateRequest(requestAgentZodSchema), roleControllerController.agentRequestControl) // agent, admin and super admin need not to be agent anymore

router.get("/admin-requests/me", checkAuth(Role.USER, Role.AGENT, Role.ADMIN), roleControllerController.getMyAdminRequest) // as only user and agent can request adsmin so only they can see
router.get("/agent-requests/me", checkAuth(Role.USER, Role.AGENT, Role.ADMIN), roleControllerController.getMyAgentRequest) // as only user can rewuest agent so they can see

router.get("/all-valid-admin-requests", checkAuth(Role.SUPER_ADMIN), roleControllerController.getAllAdminRequest)
router.get("/all-valid-agent-requests", checkAuth(Role.SUPER_ADMIN, Role.ADMIN), roleControllerController.getAllAgentRequest)

router.post("/admin-request-approve", checkAuth(Role.SUPER_ADMIN), validateRequest(requestHandlerZodSchema), roleControllerController.approveAdminRequest)
router.post("/admin-request-cancel", checkAuth(Role.SUPER_ADMIN), validateRequest(requestHandlerZodSchema), roleControllerController.cancelAdminRequest)

router.post("/agent-request-approve", checkAuth(Role.SUPER_ADMIN, Role.ADMIN), validateRequest(requestHandlerZodSchema), roleControllerController.approveAgentRequest)
router.post("/agent-request-cancel", checkAuth(Role.SUPER_ADMIN, Role.ADMIN), validateRequest(requestHandlerZodSchema), roleControllerController.cancelAgentRequest)

router.get("/all-admins", checkAuth(Role.SUPER_ADMIN), roleControllerController.getAllAdmins)
router.get("/all-agents", checkAuth(Role.SUPER_ADMIN, Role.ADMIN), roleControllerController.getAllAgents)
router.get("/all-users", checkAuth(Role.SUPER_ADMIN, Role.ADMIN), roleControllerController.getAllUsers)
router.get("/all", checkAuth(Role.SUPER_ADMIN), roleControllerController.getAll)

export const roleControllerRouter = router