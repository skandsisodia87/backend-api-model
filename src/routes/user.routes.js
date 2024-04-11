import { Router } from "express";
import { userRegistration } from "../controllers/user.controllers.js";

const router = Router();

router.route('/register').post(userRegistration)

export default router;