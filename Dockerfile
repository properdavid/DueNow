# Build stage
FROM node:22-slim AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# The build context excludes .git, so the version identity cannot be read from
# the commit SHA here. Inject it explicitly
# (e.g. --build-arg DUENOW_APP_VERSION=$(git rev-parse --short=12 HEAD)).
ARG DUENOW_APP_VERSION
ENV DUENOW_APP_VERSION=${DUENOW_APP_VERSION}
RUN npm run build

# Production stage
FROM node:22-slim AS production
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/build ./build
# The server reads migrations from disk beside its own bundle.
COPY --from=builder /app/app/db/migrations ./build/server/migrations

ENV NODE_ENV=production
ENV PORT=3000
ENV DUENOW_DATABASE_PATH=/app/data/duenow.sqlite
EXPOSE 3000

# Data directory for SQLite (bind mount in production)
VOLUME ["/app/data"]

CMD ["npm", "start"]
