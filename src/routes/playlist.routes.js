import { Router } from "express";
import { verifyJWt } from "../middlewares/auth.middleware.js";
import { createPlaylist, deletePlaylist, updatePlaylist } from "../controllers/playlist.controller.js";

const router = Router();
router.use(verifyJWt);

router.route("/").post(createPlaylist);
router
    .route("/:playlistId")
    .patch(updatePlaylist)
    .delete(deletePlaylist)

export default router;