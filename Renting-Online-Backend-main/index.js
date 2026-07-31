require('dotenv').config();

const express = require("express");
const path = require('path');
const cors = require("cors");
const cookieParser = require("cookie-parser");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");

const sql = require("./db");

const requestLogger = require("./middleware/requestLogger");

const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const cartRoutes = require("./routes/cartRoutes");
const reportRoutes = require("./routes/reportRoutes");
const orderRoutes = require("./routes/orderRoutes");
const uploadRoutes = require("./routes/uploadRoutes");

// Load OpenAPI specification
const swaggerDocument = YAML.load("./openapi.yaml");

const PORT = parseInt(process.env.PORT) || 3456;

// Keep DRAIN_DELAY_MS below the ALB target group's deregistration delay, and
// DRAIN_DELAY_MS + DRAIN_TIMEOUT_MS below the ECS task StopTimeout (30s default).
const DRAIN_DELAY_MS = parseInt(process.env.DRAIN_DELAY_MS) || 5000;
const DRAIN_TIMEOUT_MS = parseInt(process.env.DRAIN_TIMEOUT_MS) || 20000;

// Flipped by the shutdown handler so the readiness probe starts failing before
// we stop accepting connections.
let shuttingDown = false;

console.log(`Server will run on port: ${PORT}`);
console.log(`CORS: Allowing all origins`);

const app = express();

// Allow all CORS
app.use(
  cors({
    origin: true, // Allow all origins
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, // Allow cookies to be sent
  })
);
app.options('*', cors());

// Mounted before the parsers so the timing covers the whole request, and before
// the routes so 404s are logged too.
app.use(requestLogger);

app.use(express.json());
app.use(cookieParser()); // Add cookie parser middleware
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files from public directory
app.use(express.static('public'));

// Serve Order Details UI (static HTML) for deep links like /orders/:orderNumber
app.get('/orders/:orderNumber', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'order-details.html'));
});

// Expose minimal runtime config for static pages
app.get('/config.json', (req, res) => {
  res.json({
    frontendUrl: process.env.NEW_FRONTEND_URL || process.env.FRONTEND_URL || `http://localhost:${PORT}`,
  });
});

// Liveness: the process is up. The ECS container health check points here so a
// task is not killed just because the database is briefly unreachable.
app.get('/health/live', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Readiness: this task can actually serve traffic. The ALB target group points
// here, so a task whose database connection is dead gets pulled out of rotation
// instead of quietly returning 500s.
app.get('/health', async (req, res) => {
  if (shuttingDown) {
    return res.status(503).json({
      success: false,
      message: 'Server is shutting down',
      timestamp: new Date().toISOString()
    });
  }

  try {
    await sql`SELECT 1`;
    res.status(200).json({
      success: true,
      message: 'Server is running',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Readiness check failed:', err.message);
    res.status(503).json({
      success: false,
      message: 'Database unavailable',
      timestamp: new Date().toISOString()
    });
  }
});

// Swagger API Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "BorrowIt API Documentation"
}));

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/upload", uploadRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  // JSON so the failure arrives in CloudWatch with the route attached, rather
  // than as a bare stack trace that Insights cannot tie back to a request.
  // The stack stays multi-line inside the string field - Insights keeps it.
  console.error(
    JSON.stringify({
      level: 'error',
      type: 'exception',
      method: req.method,
      path: req.originalUrl.split('?')[0],
      message: err.message,
      stack: err.stack,
      traceId: req.headers['x-amzn-trace-id'],
    }),
  );
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const server = app.listen(PORT, () => {
  // No emoji here on purpose. These lines end up in CloudWatch, and `aws logs
  // tail` on a Windows console dies with a charmap encoding error the moment it
  // has to print one - which takes the whole tail down, not just that line.
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API Documentation: http://localhost:${PORT}/api-docs`);
});

// ECS sends SIGTERM, waits out StopTimeout, then SIGKILL.
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} received, draining connections`);

  // ALB deregistration races with SIGTERM, so keep answering for a moment while
  // the target group drains us. Requests already in flight finish either way.
  await new Promise((resolve) => setTimeout(resolve, DRAIN_DELAY_MS));

  const force = setTimeout(() => {
    console.error('Drain timed out, exiting anyway');
    process.exit(1);
  }, DRAIN_TIMEOUT_MS);

  server.close(async () => {
    clearTimeout(force);
    try {
      await sql.end({ timeout: 5 });
    } catch (err) {
      console.error('Error closing database pool:', err.message);
    }
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Log and keep serving. One route forgetting an await should not take down a
// task that is answering every other request correctly - ECS would restart it
// and the same bug would return on the next call, just with downtime attached.
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
});

// An uncaught exception is different: the process is now in an unknown state,
// so drain cleanly and let ECS start a replacement task.
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  shutdown('uncaughtException');
});
