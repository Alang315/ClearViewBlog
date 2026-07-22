import express from "express";
import {
  getPublications,
  getPublicationById,
  createPublication,
  updatePublication,
  deletePublication,
} from "../controllers/publications.controller.js";
import { protectRoute, optionalProtect, authorizeAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", optionalProtect, getPublications);
router.get("/:id", protectRoute, getPublicationById);
router.use(protectRoute, authorizeAdmin);

router.post("/", createPublication);
router.put("/:id", updatePublication);
router.delete("/:id", deletePublication);

export default router;
