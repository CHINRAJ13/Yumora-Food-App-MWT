/**
 * Standard API Response Formatter
 * @param {Response} res Express response object
 * @param {number} statusCode HTTP status code
 * @param {string} message Success message
 * @param {any} data Data to send in response
 * @param {object} meta Optional metadata (pagination, etc.)
 */
export const sendResponse = (res, statusCode, message, data = null, meta = null) => {
  const response = {
    status: 'success',
    message,
  };

  if (data !== null) {
    response.data = data;
  }

  if (meta !== null) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
};

export default sendResponse;
