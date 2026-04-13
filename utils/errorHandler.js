// Custom error class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Handle MongoDB CastError
  if (err.name === 'CastError') {
    const message = `Invalid ${err.path}: ${err.value}`;
    err = new AppError(message, 400);
  }

  // Handle MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    const message = `Duplicate value for field: ${field}`;
    err = new AppError(message, 409);
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    err = new AppError(message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token has expired';
    err = new AppError(message, 401);
  }

  // Development error response
  if (process.env.NODE_ENV === 'development') {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: {
        status: err.status,
        isOperational: err.isOperational,
        stack: err.stack,
      },
    });
  }

  // Production error response - only send operational errors
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Programming or unknown error: don't leak details
  console.error('PROGRAMMING OR UNKNOWN ERROR:', err);
  res.status(500).json({
    success: false,
    message: 'Something went very wrong',
  });
};

module.exports = { AppError, errorHandler };
