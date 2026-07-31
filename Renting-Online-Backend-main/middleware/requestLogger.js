// One JSON line per request, written straight to stdout.
//
// The awslogs driver on the Fargate task ships stdout to CloudWatch verbatim, and
// Logs Insights auto-discovers fields from JSON. That is the whole reason this is
// hand-rolled instead of morgan: morgan's formats are formatted text, so every
// Insights query against them has to regex the message apart. With JSON you get
// `stats avg(durationMs) by path` for free.
//
// No dependency, and nothing here can throw into the request path.
function requestLogger(req, res, next) {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const path = req.originalUrl.split('?')[0];

    // The ALB target group and the container health check both poll every 30s.
    // Left in, those two would be the bulk of the log volume, and ingestion is
    // exactly what CloudWatch Logs bills for.
    if (path === '/health' || path === '/health/live') return;

    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;

    // req.ip would be the load balancer's address - Express is not behind
    // `trust proxy`, and turning that on globally changes more than logging.
    // The first hop in X-Forwarded-For is the real client.
    const forwarded = req.headers['x-forwarded-for'];

    process.stdout.write(
      JSON.stringify({
        level: res.statusCode >= 500 ? 'error' : 'info',
        type: 'request',
        method: req.method,
        path,
        status: res.statusCode,
        durationMs: Math.round(durationMs * 10) / 10,
        ip: forwarded ? forwarded.split(',')[0].trim() : req.socket.remoteAddress,
        // Set by the ALB. Ties a log line to a specific inbound request.
        traceId: req.headers['x-amzn-trace-id'],
      }) + '\n',
    );
  });

  next();
}

module.exports = requestLogger;
