import { Router } from "express";
import { logInUser, logOutUser, refreshAccessToken, userRegistration } from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWt } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(upload.fields(
    [
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]
), userRegistration)

router.route("/login").post(logInUser);
router.route("/logout").post(verifyJWt, logOutUser);
router.route("/refresh-token").post(refreshAccessToken);

export default router;