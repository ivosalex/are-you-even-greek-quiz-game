# syntax=docker/dockerfile:1
FROM node:22-slim

RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y ca-certificates && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

ENV NODE_ENV=production
CMD ["node", "dist/main.js", "start"]
