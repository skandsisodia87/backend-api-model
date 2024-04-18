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


export {
    toogleSubscription,
}