# ===== Build =====
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ===== Serve (Node HTML injector) =====
FROM node:20-alpine AS serve
WORKDIR /app

# deps del server solamente
COPY server/package.json ./server/package.json
RUN cd server && npm install --omit=dev

# dist del build
COPY --from=build /app/dist ./dist

# server code
COPY server/server.js ./server/server.js

ENV NODE_ENV=production
EXPOSE 80

CMD ["node", "server/server.js"]
