const { cloudinary } = require('../config');
const DEFAULT_AVATAR_PUBLIC_ID = 'v1752307340/default-avatar';

const uploadToCloudinary = async (file, folder) => {
    if (!file) return null;
    const uniqueFilename = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { resource_type: "image", folder, public_id: uniqueFilename },
            (error, result) => {
                if (error) return reject(error);
                resolve(result.secure_url);
            }
        );
        stream.end(file.buffer);
    });
};
// v1752307340/default-avatar
const deleteCloudinaryImage = async (imageUrl) => {
    if (!imageUrl) return;

    const publicId = imageUrl.split('/').slice(-2).join('/').replace(/\.[^.]+$/, '');
    console.log('Deleting Cloudinary image:', publicId);

    if (publicId === DEFAULT_AVATAR_PUBLIC_ID) {
        console.log('Skipping deletion of default avatar:', publicId);
        return;
    }

    try {
        await cloudinary.uploader.destroy(publicId);
        console.log('Deleted successfully:', publicId);
    } catch (error) {
        console.error('Error deleting image:', error);
    }
};

const updateCloudinaryImage = async (imageUrl, file, folder) => {
    await deleteCloudinaryImage(imageUrl);
    return await uploadToCloudinary(file, folder);
}

module.exports = {
    uploadToCloudinary,
    deleteCloudinaryImage,
    updateCloudinaryImage
};