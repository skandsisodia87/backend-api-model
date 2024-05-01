import mongoose, { isValidObjectId } from "mongoose";
import { Comment as commentModel } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Like as likeModel } from "../models/like.model.js";
import { Video as videoModel } from "../models/video.model.js";

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { videoId } = req.params;
    const { content } = req.body;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video Id");
    }

    if (!content.trim('')) {
        throw new ApiError(400, "Content is required");
    }

    const comment = await commentModel.create(
        {
            content,
            video: videoId,
            owner: req.user._id
        }
    )

    if (!comment) {
        throw new ApiError(500, "Something went wrong, please try again.")
    }

    return res.status(200).json(new ApiResponse(200, comment, "Comment added successfully"));
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { commentId } = req.params;
    const { content } = req.body;

    if (!content) {
        throw new ApiError(400, "Content is required");
    }

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment Id");
    }

    const comment = await commentModel.findById(commentId);

    if (comment?.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(401, "Unauthoeised request")
    }

    const updateComment = await commentModel.findByIdAndUpdate(
        commentId,
        {
            $set: {
                content
            }
        },
        { new: true }
    )

    if (!updateComment) {
        throw new ApiError(500, "Failed to update comment.")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updateComment, "Comment updated successfully"));
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment Id");
    }

    const comment = await commentModel.aggregate([
        {
            $match: {
                _id: mongoose.Types.ObjectId(commentId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video",
            }
        },
        {
            $unwind: "$video"
        }
    ])

    if (!comment.length) {
        throw new ApiError(404, "No comment found");
    }

    if (req.user._id.toString() === comment[0]?.owner?.toString() || req.user._id?.toString() === comment[0]?.video?.owner?.toString()) {
        await commentModel.findByIdAndDelete(commentId);
        await likeModel.deleteMany({
            comment: commentId,
            likedBy: req.user._id
        })
        return res.status(200).json(new ApiResponse(200, {}, "Comment deleted successfully"));
    } else {
        throw new ApiError(401, "Unauthorised request");
    }
})

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

    const options = {
        page: +page ?? 1,
        limit: +limit ?? 10
    }

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video Id");
    }

    const video = await videoModel.findById(videoId);

    if (!video) {
        throw new ApiError(404, "No video found");
    }

    const commentsAggregate = await commentModel.aggregate([
        {
            $match: {
                video: mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails"
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "comment",
                as: "likes"
            }
        },
        {
            $addFields: {
                likes: {
                    $size: "$likes"
                },
                isLiked: {
                    $cond: {
                        if: { $in: [req.user._id, "$likes.likedBy"] },
                        then: true,
                        else: false
                    }
                },
                owner: {
                    $first: "$ownerDetails"
                }
            }
        },
        {
            $project: {
                content: 1,
                owner: {
                    userName: 1,
                    "avatar.url": 1,
                },
                likedBy: 1,
                isLiked: 1,
                createdAt: 1,
            }
        }
    ])

    if (!commentsAggregate.length) {
        throw new ApiError(500, "Something went wrong while fetching comments")
    }

    const comments = commentModel.aggregatePaginate(commentsAggregate, options);

    return res
        .status(200)
        .json(new ApiResponse(200, comments, "Comments fetched successfully"));

})


export {
    addComment,
    updateComment,
    deleteComment,
    getVideoComments
}