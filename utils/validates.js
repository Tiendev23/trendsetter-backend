const mongoose = require('mongoose');
const throwError = require('../helpers/errorHelper');

const validateExistence = async (Model, id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throwError('Invalid', 'ID không hợp lệ', 400);
    }

    const exists = await Model.exists({ _id: id });
    if (!exists) {
        throwError('Not Found', `${Model.modelName} không tồn tại`, 404);
    }

    return true;
};

module.exports = validateExistence;