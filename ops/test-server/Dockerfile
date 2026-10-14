FROM node:24-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/server/package.json apps/server/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/mobile/package.json apps/mobile/package.json
COPY packages/game/package.json packages/game/package.json
COPY packages/protocol/package.json packages/protocol/package.json
RUN npm ci --workspace @sporeward/server --workspace @sporeward/protocol --workspace @sporeward/game --include-workspace-root=false
COPY apps/server/src apps/server/src
COPY packages/protocol/src packages/protocol/src
COPY packages/game/src packages/game/src
RUN mkdir /data && chown node:node /data
USER node
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3001
EXPOSE 3001
CMD ["node", "--import", "tsx", "apps/server/src/main.ts"]
