import express from "express";
import {
  getPublications,
  getPublicationById,
  createPublication,
  updatePublication,
  deletePublication,
} from "../controllers/publications.controller.js";
import { protectRoute, authorizeAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protectRoute, authorizeAdmin);

router.get("/", getPublications);
router.get("/:id", getPublicationById);
router.post("/", createPublication);
router.put("/:id", updatePublication);
router.delete("/:id", deletePublication);

export default router;
