import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null

        // upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto'
        });
        // File has been uploaded successfully 
        console.log("File is uploaded on cloudinary", response.url);
        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        // remove the locally saved temporary file as the upload operation got failed
        fs.unlinkSync(localFilePath);
        return null
    }
}

const deleteFromCloudinary = async (publicId) => {
    try {
        if (!publicId) return null; // Return null if publicId is missing

        // Delete from Cloudinary
        const response = await cloudinary.uploader.destroy(publicId, {
            resource_type: 'auto'
        });

        console.log("File deleted successfully from Cloudinary");
        return response;
    } catch (error) {
        console.error("Error deleting file from Cloudinary:", error);
        return null; // Return null if an error occurs
    }
};


export { uploadOnCloudinary, deleteFromCloudinary }