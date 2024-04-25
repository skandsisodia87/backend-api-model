import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js"
import { deleteVideo, getVideoById, publishAVideo, updateVideo } from "../controllers/video.controller.js";
import { verifyJWt } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWt);

router.route("/").post(upload.fields([
    {
        name: "thumbnail",
        maxCount: 1
    },
    {
        name: "video",
        maxCount: 1
    }
]), publishAVideo);

router.route("/:videoId")
    .get(getVideoById)
    .patch(
        upload.single("thumbnail"),
        updateVideo
    )
    .delete(deleteVideo)

export default router;