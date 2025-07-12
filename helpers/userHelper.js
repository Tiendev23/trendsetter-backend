const { uploadToCloudinary, deleteCloudinaryImage } = require('../services/cloudinaryService');
const { throwError } = require('./errorHelper')
const MIN_YEAR = 1900;

const updateAvatar = async (file, imageUrl) => {
    await deleteCloudinaryImage(imageUrl);
    return await uploadToCloudinary(file, 'avatars');
}

const validateBirthday = (value) => {
    if (!value) return true;
    const now = new Date();
    const minDate = new Date(`${MIN_YEAR}-01-01`);
    return value <= now && value >= minDate;
};

const filterUserProfile = (user) => {
    const { _id, username, fullName, gender, birthday, avatar } = user.toObject();
    return { _id, username, fullName, avatar, gender, birthday };
};

const applyProfileUpdates = async (user, props, image) => {
    if (props.username) user.username = props.username;
    if (props.fullName) user.fullName = props.fullName;
    if (props.gender) user.gender = props.gender;
    if (props.birthday) {
        if (!validateBirthday(new Date(props.birthday))) {
            throwError('ValidationError', 'Ngày sinh không hợp lệ', 400)
        }
        user.birthday = new Date(props.birthday);
    }
    if (image) user.avatar = await updateAvatar(image, user.avatar);
    await user.save();
    return filterUserProfile(user);
};

module.exports = {
    updateAvatar,
    applyProfileUpdates
}