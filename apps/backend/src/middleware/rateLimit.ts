import rateLimit from 'express-rate-limit';
import { RATE_LIMIT } from '../config/constants';
import { errorResponse } from '../utils/response';

export const apiLimiter = rateLimit({
  windowMs: RATE_LIMIT.windowMs,
  max: RATE_LIMIT.maxRequests,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    errorResponse(
      res,
      'Too many requests, please try again later.',
      429
    );
  },
});

export const authLimiter = rateLimit({
  windowMs: RATE_LIMIT.windowMs,
  max: RATE_LIMIT.authMax,
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    errorResponse(
      res,
      'Too many authentication attempts, please try again later.',
      429
    );
  },
});

export const strictLimiter = rateLimit({
  windowMs: RATE_LIMIT.windowMs,
  max: RATE_LIMIT.strictMax,
  message: 'Rate limit exceeded for this sensitive operation.',
  handler: (req, res) => {
    errorResponse(
      res,
      'Rate limit exceeded, please try again later.',
      429
    );
  },
});
