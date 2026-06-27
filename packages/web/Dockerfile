FROM node:20-slim AS base
WORKDIR /app

FROM base AS deps
COPY package.json turbo.json ./
COPY packages/web/package.json packages/web/
RUN npm install --workspace=packages/web

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/web/node_modules packages/web/node_modules
COPY packages/web packages/web
RUN cd packages/web && npm run build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/packages/web/.next/standalone ./
COPY --from=builder /app/packages/web/.next/static packages/web/.next/static
COPY --from=builder /app/packages/web/public packages/web/public
EXPOSE 3000
CMD ["node", "packages/web/server.js"]
