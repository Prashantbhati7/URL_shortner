import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import urlRoutes from './routes/url.routes.js';

dotenv.config();

const app = express();

// Standard middlewares
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger
app.use((req, res, next) => {
  console.log(`📩 ${req.method} ${req.url} - IP: ${req.ip} - Agent: ${req.get('user-agent')}`);
  next();
});

app.get('/', (req, res) => {
  res.send('Welcome to the URL Shortener API! 🚀');
});
// Routes
app.use('/api/url', urlRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('💥 Global Error Handler:', err.stack);
  res.status(err.status || 500).json({
    error: err.name || 'InternalServerError',
    message: err.message || 'An unexpected error occurred'
  });
});

const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
  });
}

export default app;