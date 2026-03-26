/**
 * Standardised API response helpers
 * All responses follow the shape:
 * { success, message, data?, errors?, meta? }
 */

const sendSuccess = (res, data = {}, message = "Success", statusCode = 200, meta = null) => {
  const payload = { success: true, message, data };
  if (meta) payload.meta = meta;
  return res.status(statusCode).json(payload);
};

const sendCreated = (res, data = {}, message = "Created successfully") => {
  return sendSuccess(res, data, message, 201);
};

const sendError = (res, message = "Something went wrong", statusCode = 400, errors = null) => {
  const payload = { success: false, message };
  if (errors) payload.errors = errors;
  return res.status(statusCode).json(payload);
};

const sendNotFound = (res, message = "Resource not found") => {
  return sendError(res, message, 404);
};

const sendUnauthorized = (res, message = "Unauthorized") => {
  return sendError(res, message, 401);
};

const sendForbidden = (res, message = "Forbidden") => {
  return sendError(res, message, 403);
};

const sendPaginated = (res, data, total, page, limit, message = "Success") => {
  return sendSuccess(res, data, message, 200, {
    total,
    page: Number(page),
    limit: Number(limit),
    pages: Math.ceil(total / limit),
  });
};

module.exports = {
  sendSuccess,
  sendCreated,
  sendError,
  sendNotFound,
  sendUnauthorized,
  sendForbidden,
  sendPaginated,
};
