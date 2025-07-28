const { updateCloudinaryImage } = require('../services/cloudinaryService');
const throwError = require('./errorHelper')
const MIN_YEAR = 1900;

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
            throwError('Bad Request', 'Ngày sinh không hợp lệ', 400)
        }
        user.birthday = new Date(props.birthday);
    }
    if (image) user.avatar = await updateCloudinaryImage(user.avatar, image, 'Avatars');
    await user.save();
    return filterUserProfile(user);
};

const updateDefaultMark = (user, isDefault) => {
    if (isDefault) user.shippingAddresses.forEach(addr => addr.isDefault = false);
};

module.exports = {
    applyProfileUpdates,
    updateDefaultMark
}