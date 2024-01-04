import express from 'express';
import cors from 'cors';
import { Request, Response, NextFunction } from 'express';
import { replicateResend } from './controllers/replicateController';
import authMiddleware from './middleware/authMiddleware';

import { notFound, errorHandler } from './middleware/errorMiddleware';
import * as dotenv from 'dotenv';
dotenv.config();

const app = express();
const PLATFORM_URL = process.env.PLATFORM_URL as string;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ credentials: true, origin: PLATFORM_URL }));

app.use('/api/replicate', replicateResend);

app.use(notFound);
app.use(errorHandler);

app.listen(5000, () => console.log("Server running on port 5000"));

export default app;
