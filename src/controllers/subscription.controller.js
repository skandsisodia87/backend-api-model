import mongoose from "mongoose";
import { Subscription } from "../models/subscription.model.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const toogleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!mongoose.Types.ObjectId(channelId)) {
        throw new ApiError(400, "Invalid Channel Id.")
    }

    const isSubscribed = await Subscription.findOne({
        subscriber: req.user?._id,
        channel: channelId
    });

    if (isSubscribed) {
        await Subscription.findByIdAndDelete(isSubscribed?._id);

        return res.status(200).json(new ApiResponse(200, {}, "Unsubscribed successfully."))
    }

    await Subscription.create({
        channel: channelId,
        subscriber: req.user?._id
    })

    return res.status(200).ApiResponse(200, {}, "Subscribed successfully.")

})

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    if (!mongoose.Types.ObjectId(channelId)) {
        throw new ApiError(400, "Invalid Channel Id.")
    }

    const subscribersList = await Subscription.find({
        channel: channelId
    }).populate({
        path: "subscriber",
        select: ["fullName", "userName", "email"]
    }).select("-channel");

    if (!subscribersList.length) {
        throw new ApiError(404, "No Subscriber found.")
    }

    return res.status(200).json(new ApiResponse(200, subscribersList, "Subscribers fetched successfully."))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if (!mongoose.Types.ObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid Subscriber Id.")
    }

    const channels = await Subscription.aggregate([
        {
            $match: {
                subscriber: mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "subscribedChannel",
                pipeline: [
                    {
                        $project: {
                            fullName: 1,
                            userName: 1,
                            avatar: 1,
                            coverImage: 1
                        }
                    }
                ]
            }
        },
        {
            $project: {
                _id: 0,
                subscribedChannel: 1
            }
        }
    ])

    return res.status(200).json(new ApiResponse(200, channels, "Channel list to which user subscribed."))
})


export {
    toogleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}