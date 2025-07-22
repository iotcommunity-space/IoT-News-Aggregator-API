# Dashboard Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --only=production && npm cache clean --force

# Copy dashboard application
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S dashboard && \
    adduser -S dashboard -u 1001

RUN chown -R dashboard:dashboard /app
USER dashboard

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1

CMD ["npm", "start"]
