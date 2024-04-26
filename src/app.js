import express from "express";
import cors from "cors";
import constants from "./constants.js";
import cookieParser from "cookie-parser";

const app = express();
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));
app.use(express.json({ limit: constants.LIMIT }));
app.use(express.urlencoded({ extended: true, limit: constants.LIMIT }));
app.use(express.static("public"));
app.use(cookieParser());

// Import routes
import userRoutes from "./routes/user.routes.js";
import subscriptionRoutes from "./routes/subscription.routes.js";
import videoRoutes from "./routes/video.routes.js";
import tweetRoutes from "./routes/tweet.routes.js";

// routes declaration
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/subscriptions', subscriptionRoutes);
app.use('/api/v1/videos', videoRoutes);
app.use('/api/v1/tweet', tweetRoutes);

export { app };