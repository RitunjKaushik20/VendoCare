
const sendResponse = (res, options) => {
  const {
    success = true,
    message = 'Success',
    data = null,
    meta = null,
    code = 'SUCCESS',
    statusCode = 200,
  } = options;

  res.status(statusCode).json({
    success,
    message,
    ...(data !== null && { data }),
    ...(meta !== null && { meta }),
    code,
  });
};


const ok = (res, data, message = 'Success') => 
  sendResponse(res, { data, message, statusCode: 200 });

const created = (res, data, message = 'Created successfully') => 
  sendResponse(res, { data, message, statusCode: 201 });

const noContent = (res) => 
  res.status(204).send();


const badRequest = (res, message = 'Bad request', code = 'BAD_REQUEST') => 
  sendResponse(res, { success: false, message, code, statusCode: 400 });

const unauthorized = (res, message = 'Unauthorized', code = 'UNAUTHORIZED') => 
  sendResponse(res, { success: false, message, code, statusCode: 401 });

const forbidden = (res, message = 'Forbidden', code = 'FORBIDDEN') => 
  sendResponse(res, { success: false, message, code, statusCode: 403 });

const notFound = (res, message = 'Not found', code = 'NOT_FOUND') => 
  sendResponse(res, { success: false, message, code, statusCode: 404 });

const conflict = (res, message = 'Conflict', code = 'CONFLICT') => 
  sendResponse(res, { success: false, message, code, statusCode: 409 });

const serverError = (res, message = 'Internal server error', code = 'SERVER_ERROR') => 
  sendResponse(res, { success: false, message, code, statusCode: 500 });

module.exports = {
  sendResponse,
  ok,
  created,
  noContent,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  serverError,
};
