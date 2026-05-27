import { Router } from 'express';
import { shortenUrl, redirection, getUrlAnalytics } from '../controllers/url.contoller.js';
import { tokenBucketRateLimiter, leakyBucketRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Endpoint to shorten a URL - Rate-limited by Token Bucket (daily limits)
router.route('/shorten').post(tokenBucketRateLimiter({ capacity: 100 }), shortenUrl);

// Endpoint to redirect from short code - Rate-limited by Leaky Bucket (traffic smoothing)
router.route('/:shortCode').get(leakyBucketRateLimiter({ capacity: 20, leakRate: 5 }), redirection);

// Endpoint to view URL analytics
router.route('/analytics/:shortCode').get(getUrlAnalytics);

export default router;
