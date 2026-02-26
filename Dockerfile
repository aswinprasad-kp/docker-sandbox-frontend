# STAGE 1: Build the React App using Bun
FROM oven/bun:1 AS builder
WORKDIR /app

# Copy dependency files and install
COPY package.json bun.lockb* ./
RUN bun install

# Copy all source code and compile the React app
COPY . .
RUN bun run build

# STAGE 2: Serve with Nginx
FROM nginx:alpine

# Remove the default Nginx config and copy ours
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/

# Pull ONLY the compiled frontend code (the 'dist' folder) from Stage 1
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]