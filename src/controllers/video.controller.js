import { Video as videoModel } from "../models/video.model.js"
import { User as userModel } from "../models/user.model.js"
import { Like as likeModel } from "../models/like.model.js"
import { Comment as commentModel } from "../models/comment.model.js"
import { Playlist as playlistModel } from "../models/playlist.model.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/Cloudinary.js"
import mongoose, { isValidObjectId } from "mongoose"
import { ApiResponse } from "../utils/ApiResponse.js"

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    // TODO: get video, upload to cloudinary, create video

    if (!(title && description)) {
        throw new ApiError(400, "All Fields are required.");
    }

    const isExists = await videoModel.findOne({
        title,
        description
    });

    if (isExists) {
        throw new ApiError(409, "Title and description allrealy taken.")
    }

    const thumbnailLocalPath = req?.files?.thumbnail[0]?.path;
    const videoLocalPath = req?.files?.video[0]?.path;

    if (!videoLocalPath) {
        throw new ApiError(400, "Video is missing.")
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    const videoFile = await uploadOnCloudinary(videoLocalPath);

    if (!thumbnail) {
        throw new ApiError(400, "Thumbnail is missing");
    }

    if (!videoFile) {
        throw new ApiError(400, "Video is missing.")
    }

    const video = await videoModel.create({
        videoFile: {
            url: videoFile?.url,
            public_id: videoFile?.public_id
        },
        thumbnail: {
            url: thumbnail?.url,
            public_id: thumbnail?.public_id
        },
        title,
        description,
        owner: req.user._id,
        duration: videoFile?.duration
    })

    if (!video) {
        throw new ApiError(500, "Failed to upload Video");
    }

    return res.status(201).json(new ApiResponse(201, video, "Video uploaded successfully."));
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video Id")
    }

    const video = await videoModel.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "video",
                as: "comments"
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $lookup: {
                            from: "subscriptions",
                            localField: "_id",
                            foreignField: "channel",
                            as: "subscribers"
                        }
                    },
                    {
                        $addFields: {
                            subscribersCount: {
                                $size: "$subscribers"
                            },
                            isSubscribed: {
                                $cond: {
                                    if: {
                                        $in: [req.user?._id, "$subscribers.subscriber"]
                                    },
                                    then: true,
                                    else: false
                                }
                            },
                        }
                    },
                    {
                        $project: {
                            userName: 1,
                            isSubscribed: 1,
                            subscribersCount: 1,
                            "avatar.url": 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                likesCount: {
                    $size: "$likes"
                },
                owner: {
                    $first: "$owner"
                },
                isLiked: {
                    $cond: {
                        if: { $in: [req.user._id, "$likes.likedBy"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                "videoFile.url": 1,
                title: 1,
                description: 1,
                "thumbnail.url": 1,
                likesCount: 1,
                owner: 1,
                isLiked: 1,
                duration: 1,
                comments: 1,
                createdAt: 1,
                views: 1,
            }
        }
    ])

    if (!video) {
        throw new ApiError(500, "failed to fetch video");
    }

    // increment views on the video
    await videoModel.findByIdAndUpdate(videoId, {
        $inc: {
            views: 1
        }
    })

    // add this video to user watch history
    await userModel.findByIdAndUpdate(req.user?._id,
        {
            $addToSet: { watchHistory: videoId }
        }
    )

    return res
        .status(200)
        .json(
            new ApiResponse(200, video[0], "video details fetched successfully")
        );
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    const { title, description } = req.body;

    if (!mongoose.Types.ObjectId(videoId)) {
        throw new ApiError(400, "Invalid video Id")
    }

    if (!(title && description)) {
        throw new ApiError(400, "Title and description is required.")
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "No video found");
    }

    if (video?.owner?.toString() !== req.user._id.toString()) {
        throw new ApiError(401, "Unauthorised request.")
    }

    const thumbnailToBeDeleted = video?.thumbnail?.public_id;

    if (req.file) {
        const thumbnailLocalPath = req?.file?.thumbnail?.path;

        if (!thumbnailLocalPath) {
            throw new ApiError(500, "Failed to upload thumbnail.")
        }
        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

        if (!thumbnail) {
            throw new ApiError(500, "Something went wrong while uploading thumbnail.");
        }

        await deleteFromCloudinary(thumbnailToBeDeleted);
    }

    const updatedVideo = await videoModel.findByIdAndUpdate(videoId,
        {
            $set: {
                title,
                description,
                thumbnail: {
                    url: thumbnail?.url,
                    public_id: thumbnail?.public_id
                }
            },
        },
        { new: true }
    )

    if (!updatedVideo) {
        throw new ApiError(500, "Failed to update video please try again");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updatedVideo, "Video updated successfully."))

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    if (!mongoose.Types.ObjectId(videoId)) {
        throw new ApiError(400, "Invalid video Id")
    }

    const video = await videoModel.findById(videoId);

    if (!video) {
        throw new ApiError(404, "No video found with given ID");
    }

    if (video?.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(401, "Unauthorised request.");
    }

    // Delete video
    await videoModel.findByIdAndDelete(videoId);

    if (!videoDeleted) {
        throw new ApiError(500, "Failed to delete the video please try again");
    }

    // Delete from cloudinary
    await deleteFromCloudinary(video.thumbnail.public_id);
    await deleteFromCloudinary(video.videoFile.public_id);

    // Remove video from watch history
    await userModel.findByIdAndUpdate(
        owner,
        {
            $pull: { watchHistory: videoId }
        }
    )

    // Delete Likes
    await likeModel.deleteMany({ video: videoId });

    // Delete Comments
    await commentModel.deleteMany({ video: videoId });

    // Remove from playlist if
    await playlistModel.updateMany(
        {
            owner: video.owner
        },
        {
            $pull: { videos: videoId }
        }
    )

    return res
        .status(200)
        .json(200, {}, "Video delete successfully")
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video Id");
    }

    const video = await videoModel.findById(videoId);

    if (!video) {
        throw new ApiError(404, "No video found");
    }

    if (video?.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(401, "Unauthorised request");
    }

    const toggledVideoPublish = await videoModel.findByIdAndUpdate(
        videoId,
        {
            $set: {
                isPublished: !video?.isPublished
            }
        },
        { new: true }
    )

    if (!toggledVideoPublish) {
        throw new ApiError(500, "Failed to toogle video publish status");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { isPublished: toggledVideoPublish?.isPublished }, "video publish toggle successfully"));
})

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType } = req.query
    const { userId } = req.params
    let pipeline = [];

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    if (query) {
        pipeline.push(
            {
                $search: {
                    index: "search-videos",
                    text: {
                        query: query,
                        path: ["title", "description"]
                    }
                }
            }
        )
    }

    if (userId) {
        pipeline.push(
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(userId),
                    isPublished: true
                }
            }
        )
    }

    if (sortBy && sortType) {
        pipeline.push({
            $sort: {
                [sortBy]: sortType === "asc" ? 1 : -1
            }
        });
    } else {
        pipeline.push({ $sort: { createdAt: -1 } });
    }

    pipeline.push(
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
            $unwind: "$ownerDetails"
        }
    )

    const tempData = await videoModel.aggregate(pipeline);

    const options = {
        page: parseInt(page, 1),
        limit: parseInt(limit, 10)
    };

    const video = await videoModel.aggregatePaginate(tempData, options);

    return res.status(200).json(new ApiResponse(200, video.docs, "Videos fetched successfully"));
})

export {
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    getAllVideos
}