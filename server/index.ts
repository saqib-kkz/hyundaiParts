import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import { handleDemo } from "./routes/demo";
import {
  createRequest,
  getRequests,
  updateRequest,
  getRequestById,
  deleteRequest,
  getDashboardStats
} from "./routes/requests";
import {
  sendWhatsAppMessage,
  generatePaymentLink,
  handlePaymentWebhook,
  uploadFile,
  exportRequestsCSV
} from "./routes/integrations";
import {
  clearSampleData,
  clearAllRequests,
  resetDatabase,
  exportAllData,
  getDataStats,
  bulkDeleteRequests,
  validateAndCleanData
} from "./routes/admin";
import {
  generateOttuPayment,
  verifyOttuPayment,
  handleOttuWebhook,
  sendWhatsAppNotification,
  getPaymentConfig
} from "./routes/ottu-payments";
import paymentsRouter from "./routes/payments";
import stripePaymentsRouter from "./routes/stripe-payments";
import databaseRequestsRouter from "./routes/database-requests";
import authRouter from "./routes/auth";

export function createServer() {
  const app = express();

  // Middleware - Ensure these are applied before routes
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  // Configure multer for FormData handling
  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
  });

  // Security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      version: "1.0.0"
    });
  });

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Enhanced payment routes (new sandbox gateway)
  app.use("/api/payments", paymentsRouter);
  
  // Stripe payment routes
  app.use("/api/stripe", stripePaymentsRouter);

  // Database routes (for dashboard and advanced features)
  app.use("/api/dashboard", databaseRequestsRouter);

  // Spare parts request endpoints (main API)
  app.post("/api/requests", upload.any(), createRequest);
  app.get("/api/requests", getRequests);
  app.patch("/api/requests/:requestId", updateRequest);
  app.get("/api/requests/:requestId", getRequestById);
  app.delete("/api/requests/:requestId", deleteRequest);

  // Dashboard endpoints
  app.get("/api/dashboard/stats", getDashboardStats);

  // Integration endpoints
  app.post("/api/whatsapp/send", sendWhatsAppMessage);
  app.post("/api/payments/generate", generatePaymentLink);
  app.post("/api/payments/webhook", handlePaymentWebhook);
  app.post("/api/upload", uploadFile);
  app.get("/api/exports/csv", exportRequestsCSV);

  // Authentication routes
  app.use("/api/auth", authRouter);

  // Admin data management endpoints
  app.delete("/api/admin/clear-sample-data", clearSampleData);
  app.delete("/api/admin/clear-all-requests", clearAllRequests);
  app.post("/api/admin/reset-database", resetDatabase);
  app.get("/api/admin/export-all", exportAllData);
  app.get("/api/admin/data-stats", getDataStats);
  app.delete("/api/admin/bulk-delete", bulkDeleteRequests);
  app.post("/api/admin/validate-data", validateAndCleanData);

  // Ottu payment endpoints (legacy)
  app.post("/api/payments/generate-ottu", generateOttuPayment);
  app.get("/api/payments/verify/:sessionId", verifyOttuPayment);
  app.post("/api/payments/ottu/webhook", handleOttuWebhook);
  app.post("/api/whatsapp/send-notification", sendWhatsAppNotification);
  app.get("/api/payments/config", getPaymentConfig);

  // Error handling middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('API Error:', err);
    res.status(err.status || 500).json({
      success: false,
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
      requestId: req.headers['x-request-id'] || 'unknown'
    });
  });

  // 404 handler - only for API routes
  app.use('/api', (req, res) => {
    res.status(404).json({
      success: false,
      error: 'API endpoint not found',
      path: req.path
    });
  });

  return app;
}
