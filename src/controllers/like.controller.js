import mongoose, { isValidObjectId } from "mongoose";
import { Like as likeModel } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: toggle like on video

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video Id")
    }

    const alreadyLiked = await likeModel.findOne(
        {
            likedBy: req.user._id,
            video: videoId
        }
    )

    if (alreadyLiked) {
        await likeModel.findByIdAndDelete(
            alreadyLiked._id,
        )

        return res.status(200).json(new ApiResponse(200, { isLiked: false }));
    }

    const likedVideo = await likeModel.create(
        {
            video: videoId,
            likedBy: req.user._id
        }
    )

    if (!like) {
        throw new ApiError(500, "Something went wrong, please try again")
    }

    return res.status(200).json(new ApiResponse(200, { isLiked: true }))
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    //TODO: toggle like on comment

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment Id")
    }

    const alreadyLiked = await likeModel.findOne(
        {
            likedBy: req.user._id,
            comment: commentId
        }
    )

    if (alreadyLiked) {
        await likeModel.findByIdAndDelete(
            alreadyLiked._id,
        )

        return res.status(200).json(new ApiResponse(200, { isLiked: false }));
    }

    const likedComment = await likeModel.create(
        {
            comment: commentId,
            likedBy: req.user._id
        }
    )

    if (!likedComment) {
        throw new ApiError(500, "Something went wrong, please try again")
    }

    return res.status(200).json(new ApiResponse(200, { isLiked: true }))
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    //TODO: toggle like on tweet

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet Id")
    }

    const alreadyLiked = await likeModel.findOne(
        {
            likedBy: req.user._id,
            tweet: tweetId
        }
    )

    if (alreadyLiked) {
        await likeModel.findByIdAndDelete(
            alreadyLiked._id,
        )

        return res.status(200).json(new ApiResponse(200, { isLiked: false }));
    }

    const likedTweet = await likeModel.create(
        {
            tweet: tweetId,
            likedBy: req.user._id
        }
    )

    if (!likedTweet) {
        throw new ApiError(500, "Something went wrong, please try again")
    }

    return res.status(200).json(new ApiResponse(200, { isLiked: true }))
})

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos

    const likedVideo = await likeModel.aggregate([
        {
            $match: {
                likedBy: mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "likedVideo",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "ownerDetails"
                        }
                    },
                    {
                        $unwind: "$ownerDetails"
                    }
                ]
            }
        },
        {
            $unwind: "$likedVideo"
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $project: {
                _id: 0,
                likedVideo: {
                    "videoFile.url": 1,
                    "thumbnail.url": 1,
                    title: 1,
                    description: 1,
                    views: 1,
                    duration: 1,
                    createdAt: 1,
                    isPublished: 1,
                    ownerDetails: {
                        _id: 1,
                        username: 1,
                        fullName: 1,
                        "avatar.url": 1,
                    }
                }
            }
        }
    ])

    return res.status(200).json(new ApiResponse(200, likedVideo, "Videos fetched successfully"))
})

export {
    toggleCommentLike,
    toggleVideoLike,
    toggleTweetLike,
    getLikedVideos
}