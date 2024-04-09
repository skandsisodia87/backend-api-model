import "dotenv/config"
import connectDB from "./db/db.js";
import { app } from "./app.js";

connectDB()
    .then(() => {
        app.on("error", (error) => {
            console.log("Error", error);
            throw error
        })
        app.listen(process.env.PORT, () => {
            console.log(`Server is ruunig at port ${process.env.PORT}`)
        })
    }

    )
    .catch((error) => {
        console.log("DataBase connection failed!", error);
        process.exit(1);
    })