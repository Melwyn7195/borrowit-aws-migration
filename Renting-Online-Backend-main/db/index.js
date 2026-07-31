const fs = require("fs");
const postgres = require("postgres");

// Local development sets a full DATABASE_URL. On Fargate the RDS secret arrives
// as discrete fields instead, so build the URL from those when it is absent.
function resolveConnectionString() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

  if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME) {
    throw new Error(
      "Set DATABASE_URL, or all of DB_HOST / DB_USER / DB_PASSWORD / DB_NAME"
    );
  }

  // RDS generates passwords containing characters that are not URL safe.
  const user = encodeURIComponent(DB_USER);
  const password = encodeURIComponent(DB_PASSWORD);

  return `postgres://${user}:${password}@${DB_HOST}:${DB_PORT || 5432}/${DB_NAME}`;
}

function sslConfig() {
  if (process.env.DB_SSL === "disable") return false;

  // Pointing RDS_CA_CERT_PATH at the RDS regional CA bundle gives full
  // certificate verification. Without it the connection is still encrypted, we
  // just do not verify the server certificate.
  const caPath = process.env.RDS_CA_CERT_PATH;
  return caPath ? { ca: fs.readFileSync(caPath, "utf8") } : "require";
}

const sql = postgres(resolveConnectionString(), {
  ssl: sslConfig(),
  // db.t4g.micro tops out near 80 connections and every running task shares
  // that budget, so keep the per-task pool small.
  max: parseInt(process.env.DB_POOL_MAX) || 10,
  idle_timeout: 30,
  connect_timeout: 10,
});

module.exports = sql;
