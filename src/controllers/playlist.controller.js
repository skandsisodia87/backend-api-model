import mongoose, { isValidObjectId } from "mongoose";
import { Playlist as playListModel } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video as videoModel } from "../models/video.model.js"

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body

    if (!name || !description) {
        throw new ApiError(400, "All fields are required.");
    }

    const playList = await playListModel.create(
        {
            name,
            description,
            owner: req.user._id
        }
    )

    if (!playList) {
        throw new ApiError(500, "Something went wrong while creating playlist")
    }

    return res.status(200).json(new ApiResponse(200, playList, "Playlist created successfully"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist Id")
    }

    if (!name || !description) {
        throw new ApiResponse(400, "Fields are required");
    }

    const playList = await playListModel.findById(playlistId);

    if (!playList) {
        throw new ApiError(404, "No Playlist found");
    }

    if (req.user._id.toString() !== playList.owner.toString()) {
        throw new ApiError(401, "Unauthorized request")
    }

    const updatedPlaylist = await playListModel.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                name,
                description
            }
        },
        { new: true }
    )

    if (!updatedPlaylist) {
        throw new ApiError(404, "No playlist found")
    }

    return res.status(200).json(new ApiResponse(200, updatedPlaylist, "Updated Successfully"))
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist Id")
    }

    const playList = await playListModel.findById(playlistId);

    if (!playList) {
        throw new ApiError(404, "No Playlist found");
    }

    if (req.user._id.toString() !== playList.owner.toString()) {
        throw new ApiError(401, "Unauthorized request")
    }

    await playListModel.findByIdAndDelete(playlistId);

    return res.status(200).json(new ApiResponse(200, {}, "Deleted successfully"))
})


const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist Id");
    }

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video Id")
    }

    const playlist = await playListModel.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "No playlist found");
    }

    const video = await videoModel.findById(videoId);

    if (!video) {
        throw new ApiError(404, "No video found");
    }

    if (playlist?.owner?.toString() !== req.user._id.toString() || video?.owner?.toString() !== req.user._id.toString()) {
        throw new ApiError(401, "Unauthorized request");
    }

    const updatedList = await playListModel.findByIdAndUpdate(
        playlistId,
        {
            $addToSet: {
                videos: videoId
            }
        },
        {
            new: true
        }
    )

    if (!updatedList) {
        throw new ApiError(500, "Something went wrong, please try again.");
    }

    return res.status(200).json(new ApiResponse(200, updatedList, "PlayList updated successfully"));
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist Id");
    }

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video Id")
    }

    const playlist = await playListModel.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "No playlist found");
    }

    const video = await videoModel.findById(videoId);

    if (!video) {
        throw new ApiError(404, "No video found");
    }

    if (playlist?.owner?.toString() !== req.user._id.toString() || video?.owner?.toString() !== req.user._id.toString()) {
        throw new ApiError(401, "Unauthorized request");
    }

    const updatedList = await playListModel.findByIdAndUpdate(
        playlistId,
        {
            $pull: {
                videos: videoId
            }
        },
        {
            new: true
        }
    )

    return res.status(200).json(new ApiResponse(200, updatedList, "PlayList updateds successfully"));

})


const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user Id");
    }

    const userPlaylist = await playListModel.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            avatar: "$avatar.url",
                            userName: 1
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
                pipeline: [
                    {
                        $project: {
                            video: "$videoFile.url",
                            thumbnail: "$thumbnail.url",
                            title: 1,
                            description: 1,
                            duration: 1,
                            createdAt: 1,
                            views: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: {
                    $first: "$owner"
                }
            }
        },
        {
            $project: {
                __v: 0,
                updatedAt: 0,
                createdAt: 0
            }
        }
    ])

    if (!userPlaylist) throw new ApiError(404, "Playlist not found");

    return res.status(200)
        .json(
            new ApiResponse(
                200,
                userPlaylist,
                "Playlist fetched successfully"
            )
        )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    //TODO: get playlist by id
})




export {
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist
}