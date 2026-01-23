FROM node:20-alpine AS build

WORKDIR /app

ARG PRERENDER_CATALOG_URL
ARG VITE_API_BASE_URL
ARG VITE_APP_NAME
ARG VITE_ENV
ARG CAPROVER_GIT_COMMIT_SHA

ENV PRERENDER_CATALOG_URL=${PRERENDER_CATALOG_URL}
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_APP_NAME=${VITE_APP_NAME}
ENV VITE_ENV=${VITE_ENV}
ENV BUILD_SHA=${CAPROVER_GIT_COMMIT_SHA}

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:stable-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
