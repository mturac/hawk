FROM node:20-slim AS base
WORKDIR /app

FROM base AS deps
COPY package.json turbo.json ./
COPY packages/core/package.json packages/core/
COPY packages/api/package.json packages/api/
RUN npm install --workspace=packages/api

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/core/node_modules packages/core/node_modules
COPY --from=deps /app/packages/api/node_modules packages/api/node_modules
COPY packages/core packages/core
COPY packages/api packages/api
RUN cd packages/core && npm run build
RUN cd packages/api && npm run build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/packages/core/dist packages/core/dist
COPY --from=builder /app/packages/core/package.json packages/core/package.json
COPY --from=builder /app/packages/api/dist packages/api/dist
COPY --from=builder /app/packages/api/package.json packages/api/package.json
COPY --from=deps /app/node_modules node_modules
RUN mkdir -p /data
EXPOSE 4000
CMD ["node", "packages/api/dist/index.js"]
