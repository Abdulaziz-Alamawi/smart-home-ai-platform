FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl

# ---- deps ----
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm install

# ---- build ----
FROM deps AS build
COPY . .
RUN npx prisma generate
RUN npm run build

# ---- production ----
FROM base AS production
ENV NODE_ENV=production
COPY package.json package-lock.json* ./
RUN npm install --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY prisma ./prisma

ENV PORT=4010
EXPOSE 4010
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
