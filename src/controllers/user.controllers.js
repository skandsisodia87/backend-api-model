import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const options = {
    httpOnly: true,
    secure: true
}

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh token.")
    }
}

const userRegistration = asyncHandler(async (req, res) => {
    const { userName, email, fullName, password } = req.body;

    if ([userName, email, fullName, password].some((field) => field?.trim() === "" || field === undefined)) {
        throw new ApiError(400, "All fields are required!");
    }

    const existedUser = await User.findOne({
        $or: [{ userName }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists.")
    }

    const avatarLocalPath = req?.files?.avatar[0]?.path;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required.")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(400, "Avatar is required.")
    }

    const user = await User.create({
        userName,
        email,
        fullName,
        avatar: avatar?.url,
        coverImage: coverImage?.url || "",
        password
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user.")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully.")
    )
})

const logInUser = asyncHandler(async (req, res) => {
    const { userNameOrEmail, password } = req.body;

    if (!userNameOrEmail) {
        throw new ApiError(400, "User name or email is required!");
    }

    const user = await User.findOne({
        $or: [
            { email: userNameOrEmail },
            { userName: userNameOrEmail }
        ]
    });

    if (!user) {
        throw new ApiError(404, "User does not exists.")
    }

    const isValidPassword = await user?.isPasswordCorrect(password);
    if (!isValidPassword) {
        throw new ApiError(401, "Invalid login Credentails!")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    const loggedInuser = await User.findById(user._id).select("-password -refreshToken");

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInuser, accessToken, refreshToken
                },
                "User logged In Successfully"
            )
        )


})

const logOutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: { refreshToken: 1 }
        }
    )

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User has been logged out!"));
})

const refreshAccessToken = asyncHandler(async (req, res) => {

    const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request!");
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_KEY);

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalid Refresh token!");
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used");
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(new ApiResponse(200, { accessToken, refreshToken }, "Access token refreshed."));
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req?.user, "User details fetched  successfully."))
})

const updatePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        throw new ApiError(400, "All fields are required.");
    }

    const user = await User.findById(req.user._id);

    console.log(user)
    const isCorrectPassword = await user?.isPasswordCorrect(oldPassword);

    if (!isCorrectPassword) {
        throw new ApiError(400, "Invalid Old Password");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully."))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { userName, fullName, email } = req.body;

    if (!userName || !fullName || !email) {
        throw new ApiError(400, "All fields are required.")
    }
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                email,
                userName,
                fullName
            }
        },
        { new: true }
    ).select("-password -refreshToken");

    return res
        .status(200)
        .json(new ApiResponse(200, user, "User Details updated successfully."))
})

const updateAvatarImage = asyncHandler(async (req, res) => {
    let avatarLocalPath;
    if (req.file && req.file.avatar) {
        avatarLocalPath = req.file.avatar?.path;
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing.")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }
    )

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Avatar updated successfully."))
})

const updateCoverImage = asyncHandler(async (req, res) => {
    let coverImageLocalPath;
    if (req.file && req.file.coverImage) {
        coverImageLocalPath = req.file.coverImage?.path;
    }

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Avatar file is missing.")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        { new: true }
    )

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Cover image updated successfully."))
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { userName } = req.params;

    if (!userName?.trim()) {
        throw new ApiError(400, "UserName is missing!");
    }

    const channel = await User.aggregate([
        {
            $match: {
                userName: userName?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "Subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "SubscribeTo"
            }
        },
        {
            $addFields: {
                SubscribersCount: {
                    $size: "$Subscribers"
                },
                channelsSubscribedTo: {
                    $size: "$SubscribeTo"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$Subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                emial: 1,
                fullName: 1,
                channelsSubscribedTo: 1,
                SubscribersCount,
                isSubscribed,
                avatar: 1,
                coverImage: 1,
            }
        }
    ])

    if (!channel?.length) {
        throw new ApiError("Channel does not exists.")
    }
    return res
        .status(200)
        .json(new ApiResponse(200, channel[0], "User channel fetched successfully."))
})

export {
    userRegistration,
    logInUser,
    logOutUser,
    refreshAccessToken,
    getCurrentUser,
    updatePassword,
    updateAccountDetails,
    updateAvatarImage,
    updateCoverImage,
    getUserChannelProfile
}