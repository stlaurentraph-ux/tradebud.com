# RDS global CA bundle (public)

Used by `resolvePgSslConfig()` for Supabase Postgres TLS verification in production.

Source: https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem

Refresh when AWS rotates RDS CA roots (see AWS RDS documentation).
