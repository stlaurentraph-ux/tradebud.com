# Build context must be the monorepo root (Railway Root Directory = `.`).
# The backend depends on the workspace package @tracebud/import-v1-canonical.
FROM node:20-alpine AS builder

WORKDIR /app

COPY packages/tracebud-import-v1-canonical ./packages/tracebud-import-v1-canonical
COPY tracebud-backend/package.json ./tracebud-backend/

WORKDIR /app/tracebud-backend
RUN npm pkg set dependencies.@tracebud/import-v1-canonical=file:../packages/tracebud-import-v1-canonical \
  && npm install

COPY tracebud-backend/ ./

RUN npm run build && npm prune --production

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/tracebud-backend/package.json ./package.json
COPY --from=builder /app/tracebud-backend/node_modules ./node_modules
COPY --from=builder /app/packages/tracebud-import-v1-canonical ./packages/tracebud-import-v1-canonical
COPY --from=builder /app/tracebud-backend/dist ./dist
COPY --from=builder /app/tracebud-backend/email-templates ./email-templates

EXPOSE 4001

CMD ["node", "dist/main.js"]
