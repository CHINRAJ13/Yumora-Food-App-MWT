import express from "express";
import {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus
} from "../controllers/orderController.js";
import { protect } from "../middleware/auth.js";

import validate from "../middleware/validate.js";
import { createOrderSchema } from "../validators/orderValidator.js";

const router = express.Router();

router.post("/", protect, validate(createOrderSchema), createOrder);
router.get("/my-orders", protect, getUserOrders);
router.get("/single/:id", protect, getOrderById); // Specific ID route
router.get("/:userId", protect, getUserOrders); // Legacy support
router.patch("/update/:id", protect, updateOrderStatus); // Changed from PUT to PATCH

export default router;
