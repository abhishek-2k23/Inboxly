import { Router } from "express";
import { createOrder, verifyPayment } from "../controllers/payment.controller.js";
import { attachUser, requireAuthenticated } from "../middleware/auth.js";

export const paymentRouter = Router();

paymentRouter.use(requireAuthenticated, attachUser);

paymentRouter.post("/create-order", createOrder);
paymentRouter.post("/verify", verifyPayment);
