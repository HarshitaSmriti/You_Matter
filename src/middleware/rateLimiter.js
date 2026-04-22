import rateLimit from "express-rate-limit";

//  General limiter (for all APIs)
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 mins
    max: 100, // max 100 requests per IP
    message: {
        error: "Too many requests, please try again later"
    }
});

//  Strict limiter (for sensitive routes like crisis)
export const strictLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 mins
    max: 10,
    message: {
        error: "Too many requests (sensitive route)"
    }
});