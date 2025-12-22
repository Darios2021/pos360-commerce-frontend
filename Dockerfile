# --------- BUILD STAGE ----------
FROM node:20-alpine AS build
WORKDIR /app

# Instala deps
COPY package*.json ./
RUN npm ci

# Copia código
COPY . .

# Build (VITE_ env se inyecta en build)
RUN npm run build


# --------- RUN STAGE (NGINX) ----------
FROM nginx:1.27-alpine

# Config Nginx para SPA + cache
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia el build
COPY --from=build /app/dist /usr/share/nginx/html

# Healthcheck simple (opcional)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
