# Railway Root Directory must stay tracebud-backend (see railway.toml).
# Workspace package @tracebud/import-v1-canonical is vendored under vendor/ for Docker.
FROM node:20-alpine AS builder

WORKDIR /app

# package.json pins @tracebud/import-v1-canonical to file:./vendor/import-v1-canonical
COPY vendor/import-v1-canonical ./vendor/import-v1-canonical
COPY package.json package-lock.json* ./

RUN npm install

COPY . .

RUN npm run build && npm prune --production

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/vendor ./vendor
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/email-templates ./email-templates

EXPOSE 4001

CMD ["node", "dist/main.js"]
