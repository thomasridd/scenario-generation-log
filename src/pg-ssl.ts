// Heroku Postgres requires SSL and uses certificates that aren't in Node's
// default trust store, so verification is disabled rather than skipping TLS.
export const pgSslConfig =
  process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : undefined;
