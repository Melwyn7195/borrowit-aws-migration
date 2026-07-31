# syntax=docker/dockerfile:1

# Debian slim rather than Alpine: bcrypt 5.x publishes prebuilt binaries for
# glibc but not for musl, so an Alpine base would force a source build and drag
# in python3/make/g++ just to install dependencies.
FROM node:22-bookworm-slim AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force


FROM node:22-bookworm-slim AS runtime

ENV NODE_ENV=production \
    PORT=3456

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

# Everything .dockerignore does not exclude. index.js resolves ./openapi.yaml
# against the working directory, so the spec has to land here at /app.
COPY . .

# The node images ship an unprivileged `node` user (uid 1000). Nothing here
# needs root.
USER node

EXPOSE 3456

# ECS does not read this - put the same probe in the task definition's
# healthCheck field. It lives here so a local `docker run` behaves the same way.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||3456)+'/health/live',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "index.js"]
