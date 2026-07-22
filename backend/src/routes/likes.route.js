import express from "express";
import { createLike, removeLike } from "../controllers/likes.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/:postId", protectRoute, createLike);
router.delete("/:postId", protectRoute, removeLike);

export default router;
