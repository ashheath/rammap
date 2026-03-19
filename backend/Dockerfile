FROM node:18-alpine AS build
WORKDIR /app

# install deps and build
COPY backend/package*.json ./
COPY backend/tsconfig*.json ./
COPY backend/ ./
# Install build tools needed for native modules on Alpine, then install deps and build
RUN apk add --no-cache python3 make g++ \
	&& npm ci \
	&& npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=build /app/package*.json ./
COPY --from=build /app/dist ./dist
# Reuse built node_modules from the build stage to avoid rebuilding native modules
COPY --from=build /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/server.js"]
