FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm@9

COPY . .

RUN pnpm install --no-frozen-lockfile

RUN pnpm --filter @workspace/api-server run build

EXPOSE 3001

CMD ["node", "--enable-source-maps", "./artifacts/api-server/dist/index.mjs"]