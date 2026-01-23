# ✅ Node 20.19+ para Vite 7.x
FROM node:20.19-alpine AS build

WORKDIR /app

ARG VITE_API_BASE_URL
ARG VITE_APP_NAME
ARG VITE_ENV
ARG CAPROVER_GIT_COMMIT_SHA

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
