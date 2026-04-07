FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

COPY . .

RUN pnpm install --no-frozen-lockfile --reporter=verbose 2>&1 || (cat /root/.local/share/pnpm/store/v3/tmp/*/debug.log 2>/dev/null; exit 1)

RUN pnpm --filter @workspace/api-server run build

EXPOSE 3001

CMD ["node", "--enable-source-maps", "./artifacts/api-server/dist/index.mjs"]