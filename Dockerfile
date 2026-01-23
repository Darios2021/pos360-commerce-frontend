# =========================
# BUILD
# =========================
FROM node:22-alpine AS build

WORKDIR /app

RUN apk add --no-cache \
  chromium \
  nss \
  freetype \
  harfbuzz \
  ca-certificates \
  ttf-freefont

ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# =========================
# BUILD ARGS (CapRover)
# =========================
ARG VITE_API_BASE_URL
ARG VITE_APP_NAME
ARG VITE_ENV
ARG API_BASE_URL
ARG CAPROVER_GIT_COMMIT_SHA

# =========================
# BUILD ENVS
# =========================
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_APP_NAME=${VITE_APP_NAME}
ENV VITE_ENV=${VITE_ENV}
ENV API_BASE_URL=${API_BASE_URL}
ENV BUILD_SHA=${CAPROVER_GIT_COMMIT_SHA}

COPY package*.json ./
RUN npm ci

COPY . .

# build con prerender
RUN npm run build:prerender


# =========================
# RUNTIME
# =========================
FROM nginx:stable-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
