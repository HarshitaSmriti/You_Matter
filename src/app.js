import express from 'express';
import cors from 'cors';
import morgan from "morgan";

import userRoutes from './routes/userRoutes.js';
import { apiLimiter } from "./middleware/rateLimiter.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use(apiLimiter);

// base route
app.get('/', (req, res) => {
    res.send("API running");
});

// add THIS (missing piece)
app.get('/api/v1', (req, res) => {
    res.json({
        message: "MindMate API v1 is running"
    });
});

// main routes
app.use('/api/v1', userRoutes);

// 404 handler (recommended)
app.use((req, res) => {
    res.status(404).json({ error: "Route not found" });
});

// error handler
app.use(errorHandler);

export default app;