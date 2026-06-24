# ============================================================
# HORIZON CORE – Backend Docker Build
# Multi-stage build for Go API server
# ============================================================

# ============================================================
# STAGE 1: Build the Go binary
# ============================================================
FROM golang:1.22-alpine AS builder

# Set working directory
WORKDIR /app

# Copy go.mod and go.sum first for better caching
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of the source code
COPY . .

# Build the binary with optimizations
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o horizon-api ./cmd/api/main.go

# ============================================================
# STAGE 2: Create a minimal runtime image
# ============================================================
FROM alpine:latest

# Install ca-certificates for HTTPS requests
RUN apk --no-cache add ca-certificates

# Set working directory
WORKDIR /root/

# Copy the binary from the builder stage
COPY --from=builder /app/horizon-api .

# Copy .env.example as a reference (user must provide .env)
COPY --from=builder /app/.env.example .env.example

# Expose the API port
EXPOSE 8080

# Run the binary
CMD ["./horizon-api"]
