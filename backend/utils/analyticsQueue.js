import db from '../Db/db.js';

class AnalyticsQueue {
  /**
   * Enqueues click details and writes them immediately to PostgreSQL.
   * By writing immediately, this is 100% safe for serverless/Vercel environments
   * where background timers are frozen, while remaining extremely simple to read.
   */
  async enqueue(clickEvent) {
    const { urlId, ipAddress, userAgent } = clickEvent;

    try {
      // 1. Log click details
      await db.query(
        "INSERT INTO user_clicks (url_id, ip_address, user_agent) VALUES ($1, $2, $3)",
        [urlId, ipAddress || 'unknown', userAgent || 'unknown']
      );

      // 2. Increment click count in urls table
      await db.query(
        "UPDATE urls SET click_count = click_count + 1 WHERE id = $1",
        [parseInt(urlId)]
      );
      
      console.log(`📊 Analytics: Logged click for URL ID ${urlId}`);
    } catch (err) {
      console.error('❌ Analytics: Failed to log click:', err.message);
    }
  }

  // Dummy methods for backward compatibility with persistent test scripts
  startScheduler() {}
  stopScheduler() {}
}

const analyticsQueue = new AnalyticsQueue();

export default analyticsQueue;
