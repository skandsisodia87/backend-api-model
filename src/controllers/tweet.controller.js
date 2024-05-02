import mongoose, { isValidObjectId } from "mongoose";
import { Tweet as tweetModel } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;

    if (!content) {
        throw new ApiError(400, "Content is required");
    }

    const tweet = await tweetModel.create(
        {
            owner: req.user._id,
            content
        }
    )

    if (!tweet) {
        throw new ApiError(500, "Something went wrong, please try again")
    }

    return res.status(201).json(new ApiResponse(201, tweet, "Tweet created successfully"))
})

const getUserTweets = asyncHandler(async (req, res) => {

    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid userId");
    }

    const tweet = await tweetModel.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "tweet",
                as: "likes"
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        $project: {
                            userName: 1,
                            "avatar.url": 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: {
                    $first: "$ownerDetails",
                },
                likedCount: {
                    $size: "$likes"
                },
                isliked: {
                    $cond: {
                        if: { $in: [req.user._id, "$likes.likedBy"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $sort: {
                createdAt: -1,
            }
        },
        {
            $project: {
                content: 1,
                owner: 1,
                isliked: 1,
                likedCount: 1,
                createdAt: 1,
            }
        }
    ])

    if (!tweet?.length) {
        throw new ApiError(404, "No tweet found")
    }

    return res.status(200).json(new ApiResponse(200, tweet, "Tweets fetched successfully"));
})

const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const { content } = req.body;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet Id");
    }

    const tweet = await tweetModel.findById(tweetId);

    if (!tweet) {
        throw new ApiError(404, "No tweet found");
    }

    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(401, "Unauthorized request")
    }

    const updatedTweet = await tweetModel.findByIdAndUpdate(
        tweetId,
        {
            $set: {
                content
            }
        },
        { new: true }
    )

    if (!updatedTweet) {
        throw new ApiError(500, "Something went wrong while updating tweet.")
    }

    return res.status(200).json(new ApiResponse(200, updatedTweet, "Tweet updated successfully"));
})

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet Id");
    }

    const tweet = await tweetModel.findById(tweetId);

    if (!tweet) {
        throw new ApiError(404, "No tweet found");
    }

    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(401, "Unauthorized request")
    }

    await tweetModel.findByIdAndDelete(tweetId);

    return res.status(200).json(new ApiResponse(200, {}, "Tweet deleted successfully"));
})


export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}