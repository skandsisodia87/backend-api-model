import { Video } from "../models/video.model.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/Cloudinary.js"
import mongoose from "mongoose"
import { ApiResponse } from "../utils/ApiResponse.js"

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    // TODO: get video, upload to cloudinary, create video

    if (!(title && description)) {
        throw new ApiError(400, "All Fields are required.");
    }

    const isExists = await Video.findOne({
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

    Video.create({
        videoFile: videoFile?.url,
        thumbnail: thumbnail?.url,
        title,
        description,
        owner: req.user._id,
        duration: videoFile?.duration
    }, (err, video) => {

        if (err) {
            throw new ApiError(500, "Failed to upload Video");
        }
        return res.status(201).json(new ApiResponse(201, video, "Video uploaded successfully."));
    })

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    if (!mongoose.Types.ObjectId(videoId)) {
        throw new ApiError(400, "Invalid video Id")
    }

    const video = await Video.findById(videoId)
        .populate(
            {
                path: "owner",
                select: ["userName", "fullName"]
            }
        )

    if (!video) {
        return res.status(404).json(new ApiResponse(404, {}, "No video found."))
    }

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video fetched successfully"));
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

    const updatedVideo = await Video.findByIdAndUpdate(videoId,
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

export {
    publishAVideo,
    getVideoById,
    updateVideo
}