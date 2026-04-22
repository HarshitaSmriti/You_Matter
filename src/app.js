import express from 'express';
import cors from 'cors';
import morgan from "morgan";

import userRoutes from './routes/userRoutes.js';
import { apiLimiter } from "./middleware/rateLimiter.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));        // logging
app.use(apiLimiter);           // rate limit

// ✅ ONLY ONE ROUTE PREFIX
app.use('/api/v1', userRoutes);

// optional test route
app.get('/', (req, res) => {
    res.send("API running");
});

// ✅ ERROR HANDLER MUST BE LAST
app.use(errorHandler);

export default app;