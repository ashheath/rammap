FROM node:18-alpine AS build
WORKDIR /app

COPY frontend/package*.json ./
COPY frontend/ ./
# Install build tools for native modules on Alpine, then install deps and build
RUN apk add --no-cache python3 make g++ build-base \
	&& if [ -f package-lock.json ]; then npm ci; else npm install; fi \
	&& npm run build

FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
