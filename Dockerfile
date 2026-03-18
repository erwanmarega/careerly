FROM node:22-alpine

RUN apk add --no-cache openssl

RUN npm install -g pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

RUN pnpm install --frozen-lockfile

RUN pnpm --filter @postulo/api exec prisma generate

RUN pnpm --filter @postulo/api build

WORKDIR /app/apps/api

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
