import logger from "../utils/logger.js";

export const errorHandler = (err, req, res, next) => {
    logger.error({
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method
    });

    if (err.errors) {
        return res.status(400).json({
            error: err.errors[0].message
        });
    }

    return res.status(err.status || 500).json({
        error: err.message || "Internal Server Error"
    });
};