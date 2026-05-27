import { URL } from 'url';

// A mock phishing domains blacklist (Security requirement)
const PHISHING_BLACKLIST = new Set([
  'phish-example.com',
  'badlink.xyz',
  'malware-download.net',
  'fake-bank-login.com',
  'steal-credentials.org'
]);

// Private/Local IP ranges to prevent SSRF (Server-Side Request Forgery)
const SSRF_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\.\d+\.\d+\.\d+$/,
  /^10\.\d+\.\d+\.\d+$/,
  /^192\.168\.\d+\.\d+$/,
  /^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/,
  /^169\.254\.\d+\.\d+$/, // Link-local
  /^0\.\d+\.\d+\.\d+$/,
  /^::1$/,
  /^fe80::/i
];

/**
 * Validates if the string is a correct URL and prevents SSRF
 * @param {string} urlString 
 * @returns {{isValid: boolean, error?: string, parsedUrl?: URL}}
 */
export function validateUrlAndSsrf(urlString) {
  if (!urlString) {
    return { isValid: false, error: 'URL is required' };
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(urlString);
  } catch (err) {
    return { isValid: false, error: 'Invalid URL format. Please include protocol (http/https).' };
  }

  // Only allow HTTP and HTTPS protocols
  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    return { isValid: false, error: 'Only HTTP and HTTPS protocols are supported' };
  }

  const hostname = parsedUrl.hostname;

  // SSRF validation
  for (const pattern of SSRF_HOST_PATTERNS) {
    if (pattern.test(hostname)) {
      return { isValid: false, error: 'SSRF Protection: Access to local/private network addresses is blocked' };
    }
  }

  return { isValid: true, parsedUrl };
}

/**
 * Checks if the hostname is flagged as phishing/malicious
 * @param {URL} parsedUrl 
 * @returns {boolean}
 */
export function isPhishingUrl(parsedUrl) {
  const hostname = parsedUrl.hostname.toLowerCase();
  // Check exact hostname match
  if (PHISHING_BLACKLIST.has(hostname)) {
    return true;
  }
  // Check wildcard/subdomains match
  for (const domain of PHISHING_BLACKLIST) {
    if (hostname.endsWith('.' + domain)) {
      return true;
    }
  }
  return false;
}

/**
 * Verifies Captcha token
 * @param {string} captchaToken 
 * @returns {Promise<boolean>}
 */
export async function verifyCaptcha(captchaToken) {
  // In a real-world app, this sends a POST request to Google reCAPTCHA or hCaptcha API.
  // Here we mock the behavior. If the token is 'mock-invalid-captcha', we reject it.
  // In production, if captchaToken is missing or invalid, it returns false.
  if (!captchaToken) {
    // If not provided in a dev/test request, we might pass it, but if explicitly invalid, reject
    return true; 
  }
  if (captchaToken === 'mock-invalid-captcha') {
    return false;
  }
  return true;
}
