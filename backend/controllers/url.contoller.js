import db from '../Db/db.js';
import { asyncHandler } from '../utils/asynHandler.js';
import { cacheUrl, getCachedUrl, deleteCachedUrl } from '../utils/redis.js';
import { validateUrlAndSsrf, isPhishingUrl, verifyCaptcha } from '../utils/security.js';
import analyticsQueue from '../utils/analyticsQueue.js';

const BASE62 = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

// Helper to generate a random 6-character Base62 string
const generateRandomCode = () => {
  let code = "";
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * 62);
    code += BASE62[randomIndex];
  }
  return code;
};

/**
 * Creates a shortened URL
 * POST /api/url/shorten
 */
export const shortenUrl = asyncHandler(async (req, res) => {
    console.log("Received URL shortening request:", req.body);
  const { url, alias, expiresAt, captchaToken, userId } = req.body;

  // 1. Verify Captcha (Security requirement)
  const isCaptchaValid = await verifyCaptcha(captchaToken);
  if (!isCaptchaValid) {
    return res.status(400).json({ error: "Security Check: Invalid Captcha token." });
  }

  // 2. Validate URL structure and verify it is not a private IP (SSRF protection)
  const urlCheck = validateUrlAndSsrf(url);
  if (!urlCheck.isValid) {
    return res.status(400).json({ error: urlCheck.error });
  }

  // 3. Phishing URL check (Security requirement)
  if (isPhishingUrl(urlCheck.parsedUrl)) {
    return res.status(400).json({ error: "Security block: This URL has been flagged as a security hazard (phishing)." });
  }

  const originalUrl = urlCheck.parsedUrl.href;
  let shortCode;

  // 4. Resolve short code (alias vs generated)
  if (alias) {
    // Validate alias format
    const aliasRegex = /^[a-zA-Z0-9_-]{3,10}$/;
    if (!aliasRegex.test(alias)) {
      return res.status(400).json({
        error: "Invalid alias format. Must be alphanumeric (plus underscores/dashes) and 3 to 10 characters long."
      });
    }

    // Check alias collision
    const existing = await db.query("SELECT id FROM urls WHERE short_code = $1", [alias]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Alias is already in use. Please select a different one." });
    }
    shortCode = alias;
  } else {
    // Generate code with collision handling loop (up to 5 retries)
    let retries = 0;
    let success = false;
    while (retries < 5 && !success) {
      shortCode = generateRandomCode();
      const existing = await db.query("SELECT id FROM urls WHERE short_code = $1", [shortCode]);
      if (existing.rows.length === 0) {
        success = true;
      }
      retries++;
    }

    if (!success) {
      return res.status(500).json({ error: "Failed to generate unique short URL code. Please try again." });
    }
  }

  // 5. Handle Expiry Time
  let expiresDate = null;
  if (expiresAt) {
    expiresDate = new Date(expiresAt);
    if (isNaN(expiresDate.getTime())) {
      return res.status(400).json({ error: "Invalid expiry date format" });
    }
    if (expiresDate < new Date()) {
      return res.status(400).json({ error: "Expiry time must be in the future" });
    }
  }

  // 6. Save URL mapping to Database
  const id = Date.now() * 1000 + Math.floor(Math.random() * 1000); // Unique 64-bit safe ID
  
  await db.query(
    "INSERT INTO urls (id, original_url, short_code, user_id, expires_at, click_count) VALUES ($1, $2, $3, $4, $5, 0)",
    [id, originalUrl, shortCode, userId || null, expiresDate]
  );

  // 7. Store in Redis Cache: initial TTL 24 Hours
  const cacheObj = {
    id: id.toString(),
    original_url: originalUrl,
    expires_at: expiresDate ? expiresDate.toISOString() : null
  };
  await cacheUrl(shortCode, JSON.stringify(cacheObj), true);

  // Construct response
  const domain = process.env.BASE_DOMAIN || `${req.protocol}://${req.get('host')}`;
  const shortUrl = `${domain}/api/url/${shortCode}`;

  return res.status(201).json({
    message: "Short URL created successfully",
    shortUrl,
    shortCode,
    originalUrl,
    expiresAt: expiresDate
  });
});

/**
 * Redirects to the original URL
 * GET /api/url/:shortCode
 */
export const redirection = asyncHandler(async (req, res) => {
    console.log(`Received redirection request for shortCode: ${req.params.shortCode}`);
  const { shortCode } = req.params;

  try {
    let urlRecord = null;

    // 1. Try fetching from Redis (instant read, non-blocking DB)
    const cachedData = await getCachedUrl(shortCode);

    if (cachedData) {
      try {
        urlRecord = JSON.parse(cachedData);
      } catch (err) {
        console.error("Redis parsing error:", err.message);
      }
    }

    // 2. Database Fallback (Cache Miss)
    if (!urlRecord) {
      console.log(`🔍 Cache Miss for shortCode "${shortCode}". Fetching from database.`);
      const dbResult = await db.query(
        "SELECT id, original_url, expires_at FROM urls WHERE short_code = $1",
        [shortCode]
      );

      if (dbResult.rows.length === 0) {
        return res.status(404).json({ error: "Short URL not found" });
      }

      const row = dbResult.rows[0];
      urlRecord = {
        id: row.id.toString(),
        original_url: row.original_url,
        expires_at: row.expires_at ? new Date(row.expires_at).toISOString() : null
      };

      // Set back to cache
      await cacheUrl(shortCode, JSON.stringify(urlRecord), true);
    }

    // 3. Expiry check
    if (urlRecord.expires_at && new Date(urlRecord.expires_at) < new Date()) {
      // Expiration cleanups can be run periodically, but reject immediate requests
      await deleteCachedUrl(shortCode);
      return res.status(410).json({ error: "Short URL has expired" });
    }

    // 4. Update dynamic Redis TTL (100click/hour -> 12Hrs cache TTL)
    await cacheUrl(shortCode, JSON.stringify(urlRecord), false);

    // 5. Asynchronously track click analytics (await in serverless mode to prevent data loss)
    const analyticsPayload = {
      urlId: urlRecord.id,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
      userAgent: req.get('user-agent') || 'unknown'
    };
    if (process.env.VERCEL || process.env.SERVERLESS === 'true') {
      await analyticsQueue.enqueue(analyticsPayload);
    } else {
      analyticsQueue.enqueue(analyticsPayload);
    }

    // 6. Perform redirection (target: original_url)
    return res.redirect(urlRecord.original_url);
  } catch (err) {
    console.error("Redirection failure:", err.message);
    return res.status(500).json({ error: "Internal Server Error during redirection" });
  }
});

/**
 * Retrieves Analytics for a short code
 * GET /api/url/analytics/:shortCode
 */
export const getUrlAnalytics = asyncHandler(async (req, res) => {
    console.log(`Received analytics request for shortCode: ${req.params.shortCode}`);
  const { shortCode } = req.params;

  // Retrieve URL info
  const dbResult = await db.query(
    "SELECT id, original_url, created_at, click_count, expires_at FROM urls WHERE short_code = $1",
    [shortCode]
  );

  if (dbResult.rows.length === 0) {
    return res.status(404).json({ error: "Short URL not found" });
  }

  const url = dbResult.rows[0];

  // Retrieve recent click locations/devices
  const clicksResult = await db.query(
    "SELECT ip_address, user_agent, clicked_at FROM user_clicks WHERE url_id = $1 ORDER BY clicked_at DESC LIMIT 100",
    [url.id]
  );

  return res.status(200).json({
    shortCode,
    originalUrl: url.original_url,
    createdAt: url.created_at,
    expiresAt: url.expires_at,
    totalClicks: url.click_count,
    recentClicks: clicksResult.rows
  });
});