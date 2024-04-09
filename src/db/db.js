import mongoose from "mongoose";
import constants from "../constants.js";


const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.DATABASE_URI}/${constants.DB_NAME}`);
        console.log(`DB connected!! DB Host ${connectionInstance.connection.host}`)
    } catch (error) {
        console.log("MongoDB connection failed", error);
        process.exit(1);
    }
}


export default connectDB;