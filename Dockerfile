# ===== Build =====
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build Vite (usa variables VITE_* en build-time)
RUN npm run build

# ===== Serve =====
FROM nginx:1.27-alpine

# SPA fallback (Vue Router history mode)
RUN rm -rf /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiamos el dist al docroot
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
