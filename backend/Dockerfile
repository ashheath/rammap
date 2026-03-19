FROM node:18-alpine AS build
WORKDIR /app

# install deps and build
COPY backend/package*.json ./
COPY backend/tsconfig*.json ./
COPY backend/ ./
RUN npm ci
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=build /app/package*.json ./
COPY --from=build /app/dist ./dist
RUN npm ci --production
EXPOSE 3000
CMD ["node", "dist/server.js"]
