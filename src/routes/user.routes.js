import { Router } from "express";
import { getCurrentUser, logInUser, logOutUser, refreshAccessToken, updateAccountDetails, updateAvatarImage, updateCoverImage, updatePassword, userRegistration } from "../controllers/user.controllers.js";
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
router.route("/currentUser").get(verifyJWt, getCurrentUser);
router.route("/update-password").post(verifyJWt, updatePassword);
router.route("/update-details").post(verifyJWt, updateAccountDetails);
router.route("/update-avatar").post(verifyJWt, upload.single("avatar"), updateAvatarImage);
router.route("/update-coverImage").post(verifyJWt, upload.single("coverImage"), updateCoverImage);

export default router;