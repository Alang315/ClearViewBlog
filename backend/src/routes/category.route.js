import express from "express";
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categories.controller.js";
import { protectRoute, authorizeAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protectRoute, authorizeAdmin);

router.get("/", getCategories);
router.get("/:id", getCategoryById);
router.post("/", createCategory);
router.put("/:id", updateCategory);
router.delete("/:id", deleteCategory);

export default router;
