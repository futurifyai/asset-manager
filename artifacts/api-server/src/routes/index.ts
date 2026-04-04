import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import tasksRouter from "./tasks";
import dashboardRouter from "./dashboard";
import reportsRouter from "./reports";
import aiRouter from "./ai";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(tasksRouter);
router.use(dashboardRouter);
router.use(reportsRouter);
router.use(aiRouter);

export default router;
