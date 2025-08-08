const mongoose = require('mongoose');
const { throwError } = require('../helpers/errorHelper');

const validateExistence = async (Model, id) => {
    const modelName = String(Model.modelName).toUpperCase();
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throwError('INVALID_ID', `ID ${modelName} không hợp lệ`, 400);
    }
    const exists = await Model.exists({ _id: id });
    if (!exists) {
        throwError(`${modelName}.NOT_FOUND`, `${modelName} không tồn tại`, 404);
    }

    return exists;
};

module.exports = {
    validateExistence,
};