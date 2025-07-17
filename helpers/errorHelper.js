const throwError = (name, message, statusCode = 500) => {
    const error = new Error(message);
    error.name = name;
    error.statusCode = statusCode;
    throw error;
}

module.exports = throwError;