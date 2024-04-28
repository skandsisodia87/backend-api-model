import { Router } from "express";
import { verifyJWt } from "../middlewares/auth.middleware.js";
import { addComment, deleteComment, getVideoComments, updateComment } from "../controllers/comment.controller.js";

const router = Router();
router.use(verifyJWt);

router
    .route('/:videoId')
    .post(addComment)
    .get(getVideoComments)
    
router
    .route('/:commentId')
    .patch(updateComment)
    .delete(deleteComment)

export default router;