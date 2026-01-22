# Canvas MCP Server - Multi-arch Dockerfile
# Supports amd64 and arm64 (for Raspberry Pi)

FROM denoland/deno:alpine-2.1.4

WORKDIR /app

# Copy dependency files first for better caching
COPY deno.json deno.lock* ./

# Cache dependencies
RUN deno cache --reload deno.json || true

# Copy source code
COPY . .

# Cache the main entry points
RUN deno cache api-server.ts main.ts

# Default to REST API server for remote deployment
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Use REST API server (works with ChatGPT Actions, any HTTP client)
CMD ["deno", "run", "--allow-net", "--allow-env", "--allow-read", "api-server.ts"]
