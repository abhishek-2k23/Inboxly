import { Router } from "express";
import { accountRouter } from "./account.route.js";
import { authRouter } from "./auth.route.js";
import { calendarRouter } from "./calendar.route.js";
import { chatRouter } from "./chat.route.js";
import { emailRouter } from "./email.route.js";
import { healthRouter } from "./health.route.js";
import { integrationRouter } from "./integration.route.js";
import { itemRouter } from "./item.route.js";
import { paymentRouter } from "./payment.route.js";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/account", accountRouter);
apiRouter.use("/chat", chatRouter);
apiRouter.use("/items", itemRouter);
apiRouter.use("/emails", emailRouter);
apiRouter.use("/calendar", calendarRouter);
apiRouter.use("/integrations", integrationRouter);
apiRouter.use("/payment", paymentRouter);
