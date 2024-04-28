import mongoose, { isValidObjectId } from "mongoose";
import { Comment as commentModel } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { videoId } = req.query;
    const { content } = req.body;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video Id");
    }

    if (!content.trim('')) {
        throw new ApiError(400, "Content is required");
    }

    commentModel.create(
        {
            content,
            video: videoId,
            owner: req.user._id
        },
        (err, data) => {
            if (err) {
                throw new ApiError(500, "Something went wrong, please try again.")
            }

            return res.status(200).json(new ApiResponse(200, data, "Comment added successfully"));
        }
    )
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
        return res.status(200).json(new ApiResponse(200, {}, "Comment deleted successfully"));
    } else {
        throw new ApiError(401, "Unauthorised request");
    }
})

export {
    addComment,
    updateComment,
    deleteComment
}