/**
 * Response Formatter Utilities
 * Standardized response formatting for consistency across all endpoints
 */

class ResponseFormatter {
  static success(
    res,
    message = "Operation successful",
    data = null,
    statusCode = 200,
  ) {
    const response = {
      success: true,
      message,
    };
    if (data !== null && data !== undefined) {
      response.data = data;
    }
    return res.status(statusCode).json(response);
  }

  static error(
    res,
    message = "An error occurred",
    statusCode = 400,
    error = null,
  ) {
    const response = {
      success: false,
      message,
    };

    // Include error details in development mode
    if (process.env.NODE_ENV === "development" && error) {
      response.error = error;
    }

    return res.status(statusCode).json(response);
  }

  static paginated(
    res,
    message = "Data retrieved successfully",
    data = [],
    total = 0,
    page = 1,
    limit = 10,
    statusCode = 200,
  ) {
    const pages = Math.ceil(total / limit);

    return res.status(statusCode).json({
      success: true,
      message,
      pagination: {
        total,
        count: data.length,
        page,
        pages,
        perPage: limit,
      },
      data,
    });
  }
  static created(res, message = "Resource created successfully", data) {
    return this.success(res, message, data, 201);
  }
  static validationError(res, errors) {
    const errorArray = Array.isArray(errors) ? errors : [errors];

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errorArray,
    });
  }
  static unauthorized(res, message = "Not authorized to access this route") {
    return this.error(res, message, 401);
  }
  static forbidden(res, message = "Access forbidden") {
    return this.error(res, message, 403);
  }
  static notFound(res, message = "Resource not found") {
    return this.error(res, message, 404);
  }
  static conflict(res, message = "Resource already exists") {
    return this.error(res, message, 409);
  }

  static serverError(res, message = "Server error", error = null) {
    return this.error(res, message, 500, error);
  }
}

module.exports = ResponseFormatter;
