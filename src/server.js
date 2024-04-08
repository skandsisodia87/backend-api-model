import express from "express"
import connectDB from "./db/db.js";
import 'dotenv/config'

const app = express();
const port = process.env.PORT || 3000;


connectDB()

app.listen(process.env.PORT, () => {
    console.log(`Server is running at port: ${port}`)
})