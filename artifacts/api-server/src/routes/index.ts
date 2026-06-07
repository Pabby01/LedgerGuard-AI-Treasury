import { Router, type IRouter } from "express";
import authRouter from "./auth";
import healthRouter from "./health";
import walletsRouter from "./wallets";
import transactionsRouter from "./transactions";
import policiesRouter from "./policies";
import aiRouter from "./ai";
import auditRouter from "./audit";
import dashboardRouter from "./dashboard";
import analyticsRouter from "./analytics";

const router: IRouter = Router();

router.use(authRouter);
router.use(healthRouter);
router.use(walletsRouter);
router.use(transactionsRouter);
router.use(policiesRouter);
router.use(aiRouter);
router.use(auditRouter);
router.use(dashboardRouter);
router.use(analyticsRouter);

export default router;
