'use strict';

const httpStatus = require('http-status-codes');

class ApiError extends Error {
  constructor (name, httpStatus, message) {
    super(message);
    this.name = name;
    this.httpStatus = httpStatus;
    this.message = {message: message};
    Error.captureStackTrace(this);
  }
}

class UnknownServerError extends ApiError {
  constructor (message) {
    super ('UnknownServerError', httpStatus.INTERNAL_SERVER_ERROR, message);
  }
}

class NotFoundError extends ApiError {
  constructor (message) {
    super ('NotFoundError', httpStatus.NOT_FOUND, message);
  }
}

class FoundError extends ApiError {
  constructor (message) {
    super ('FoundError', httpStatus.CONFLICT, message);
  }
}

class ConditionError extends ApiError {
  constructor (message) {
    super ('ConditionError', httpStatus.NOT_FOUND, message);
  }
}

function PromptStandardError(error, moduleTitle, displayMsg) {
  if (error.statusCode == httpStatus.NOT_FOUND) {
    return new NotFoundError(displayMsg ? displayMsg : 'No ' + moduleTitle + ' for the given Id was found.');
  }
  return error;
}

function ErrorBuilder(errorCode, customMessage){
  if(!errorCode){errorCode=500;}
  if(!customMessage){customMessage='Could not obtain Object Fields Info';}

  let err = {};
  switch(errorCode){
    case 400: err.message = 'Bad Request';
      break;
    case 401: err.message = 'Unauthorized';
      break;
    case 403: err.message = 'Forbidden';
      break;
    case 404: err.message = 'Not Found';
      break;
    case 405: err.message = 'MethodNot Allowed';
      break;
    case 406: err.message = 'Not Acceptable';
      break;
    case 408: err.message = 'Request Timeout';
      break;
    case 409: err.message = 'Conflict';
      break;
    case 413: err.message = 'Payload TooLarge';
      break;
    case 414: err.message = 'URI TooLong';
      break;
    case 429: err.message = 'Too Many Requests';
      break;
    case 431: err.message = 'Request Header Fields Too Large';
      break;
    case 451: err.message = 'Unavailable For Legal Reasons';
      break;
    case 500: err.message = 'Internal Server Error';
      break;
    case 501: err.message = 'Not Implemented';
      break;
    case 502: err.message = 'Bad Gateway';
      break;
    case 503: err.message = 'Service Unavailable';
      break;
    case 504: err.message = 'Gateway Timeout';
      break;
    case 505: err.message = 'HTTP Version Not Supported';
      break;
    case 507: err.message = 'Insufficient Storage';
      break;
    case 508: err.message = 'Loop Detected';
      break;
    case 509: err.message = 'Bandwidth Limit Exceeded';
      break;
    case 511: err.message = 'Network Authentication Required';
      break;

    default: err.message = 'Internal Server Error';
  }

  return {status:errorCode, message:err.message, developerMessage:customMessage};
}

function ErrorGenerator(error){
  const createError = require('http-errors');

  if(!error.status){error.status=500;}
  if(!error.message){error.message='Error';}
  if(!error.developerMessage){error.developerMessage='Could not obtain Object Fields Info';}

  let errMessage = `${error.message} : ${error.developerMessage}`;

  switch(error.status){
    case 400: return createError.BadRequest(errMessage);
    case 401: return createError.Unauthorized(errMessage);
    case 403: return createError.Forbidden(errMessage);
    case 404: return createError.NotFound(errMessage);
    case 405: return createError.MethodNotAllowed(errMessage);
    case 406: return createError.NotAcceptable(errMessage);
    case 408: return createError.RequestTimeout(errMessage);
    case 409: return createError.Conflict(errMessage);
    case 413: return createError.PayloadTooLarge(errMessage);
    case 414: return createError.URITooLong(errMessage);
    case 429: return createError.TooManyRequests(errMessage);
    case 431: return createError.RequestHeaderFieldsTooLarge(errMessage);
    case 451: return createError.UnavailableForLegalReasons(errMessage);
    case 500: return createError.InternalServerError(errMessage);
    case 501: return createError.NotImplemented(errMessage);
    case 502: return createError.BadGateway(errMessage);
    case 503: return createError.ServiceUnavailable(errMessage);
    case 504: return createError.GatewayTimeout(errMessage);
    case 505: return createError.HTTPVersionNotSupported(errMessage);
    case 507: return createError.InsufficientStorage(errMessage);
    case 508: return createError.LoopDetected(errMessage);
    case 509: return createError.BandwidthLimitExceeded(errMessage);
    case 511: return createError.NetworkAuthenticationRequired(errMessage);

    default : return createError.InternalServerError('Could not obtain Object Fields Info'); 
  }
}


module.exports = {
  UnknownServerError, 
  NotFoundError, 
  FoundError, 
  ConditionError,
  ApiError,
  PromptStandardError,
  ErrorGenerator,
  ErrorBuilder
};