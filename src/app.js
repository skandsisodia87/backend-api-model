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


export { app };