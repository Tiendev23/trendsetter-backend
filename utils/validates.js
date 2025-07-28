const mongoose = require('mongoose');
const { throwError } = require('../helpers/errorHelper');

const validateExistence = async (Model, id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throwError('INVALID_ID', `ID ${Model.modelName} không hợp lệ`, 400);
    }
    const exists = await Model.exists({ _id: id });
    if (!exists) {
        throwError('ID_NOT_FOUND', `${Model.modelName} không tồn tại`, 404);
    }

    return exists;
};

module.exports = {
    validateExistence,
};