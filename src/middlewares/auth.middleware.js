import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js"


export const verifyJWt = asyncHandler(async (req, res, next) => {
    const token = req.cookie?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
        throw new ApiError(401, "Unauthorized token");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);

    if (!decodedToken) {
        throw new ApiError(401, "Invalid access token.");
    }

    const user = await User.find(decodedToken._id).select("-password -refreshToken");

    if (!user) {
        throw new ApiError(401, "Invalid access token.");
    }

    req.user = user;
    next();
})