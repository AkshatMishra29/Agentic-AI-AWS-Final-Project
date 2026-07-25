# ---------------------------------------------------
# Stage 1: Build the React + Vite application
# ---------------------------------------------------
FROM node:20-alpine AS build-stage

WORKDIR /app

# Copy package files first for efficient caching
COPY package*.json ./

# Install npm dependencies
RUN npm ci

# Copy the rest of the frontend source code
COPY . .

# Build static assets (outputs to /app/dist)
RUN npm run build

# ---------------------------------------------------
# Stage 2: Serve static files with Nginx
# ---------------------------------------------------
FROM nginx:alpine AS serve-stage

# Copy static build artifacts from build-stage to Nginx public html folder
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Custom nginx config to support React SPA HTML5 routing
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf


# Expose HTTP port 80
EXPOSE 80

# Start Nginx in foreground mode
CMD ["nginx", "-g", "daemon off;"]
