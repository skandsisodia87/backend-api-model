import { Router } from "express";
import { verifyJWt } from "../middlewares/auth.middleware.js"
import { getSubscribedChannels, getUserChannelSubscribers, toogleSubscription } from "../controllers/subscription.controller.js";

const router = Router();
router.use(verifyJWt);   // Apply verifyJWT middleware to all routes in this file

router
    .route("/c/:channelId")
    .post(toogleSubscription)
    .get(getUserChannelSubscribers)


router.route("/c/:subscriberId").get(getSubscribedChannels);


export default router;