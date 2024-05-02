import { Router } from "express";
import { verifyJWt } from "../middlewares/auth.middleware.js";
import { addVideoToPlaylist, createPlaylist, deletePlaylist, removeVideoFromPlaylist, updatePlaylist } from "../controllers/playlist.controller.js";

const router = Router();
router.use(verifyJWt);

router.route("/").post(createPlaylist);
router
    .route("/:playlistId")
    .patch(updatePlaylist)
    .delete(deletePlaylist)

router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist);
router.route("/remove/:videoId/:playlistId").patch(removeVideoFromPlaylist);

export default router;