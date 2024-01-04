import { Request, Response, NextFunction } from 'express';

// Middleware for unsupported (404) routes
const notFound = (req: Request, res: Response, next: NextFunction) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

// Middleware to handle errors
const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
        return next(error);
    }

    const statusCode = 'code' in error ? (error as any).code : 500;
    const message = error.message || "An unknown error occurred";

    res.status(statusCode).json({ message });
};

export { notFound, errorHandler };
