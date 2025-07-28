const throwError = (code, message, statusCode = 500) => {
    const error = new Error(message);
    error.code = code;
    error.statusCode = statusCode;
    throw error;
}

function resError(res, err, { defaultCode, defaultMessage }) {
    const status = err.statusCode || 500;
    const code = err.code || defaultCode;
    const message = err.message || defaultMessage;

    res.status(status).json({ code, message });
}

module.exports = {
    throwError,
    resError
};