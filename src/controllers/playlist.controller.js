import { isValidObjectId } from "mongoose";
import { Playlist as playListModel } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body

    if (!name || !description) {
        throw new ApiError(400, "All fields are required.");
    }

    playListModel.create(
        {
            name,
            description,
            owner: req.user._id
        },
        (err, data) => {
            if (err) {
                throw new ApiError(500, "Something went wrong while creating playlist")
            }

            return res.status(200).json(new ApiResponse(200, data, "Playlist created successfully"))
        }
    )
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

    const playList = await playListModel.findById(playListModel);

    if (!playList) {
        throw new ApiError(404, "No Playlist found");
    }

    if (req.user._id.toString() !== playList.owner.toString()) {
        throw new ApiError(401, "Unauthorised request")
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

    if (!playlist) {
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
        throw new ApiError(401, "Unauthorised request")
    }

    await playListModel.findByIdAndDelete(playlistId);

    return res.status(200).json(new ApiResponse(200, {}, "Deleted successfully"))
})




export {
    createPlaylist,
    updatePlaylist,
    deletePlaylist
}