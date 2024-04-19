import { Video } from "../models/video.model.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { uploadOnCloudinary } from "../utils/Cloudinary.js"

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

export {
    publishAVideo
}