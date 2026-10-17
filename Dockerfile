# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim AS build
WORKDIR /app
ARG VITE_OPEXNAL_API_URL=http://localhost:4000
ENV VITE_OPEXNAL_API_URL=${VITE_OPEXNAL_API_URL}
COPY package.json ./
RUN npm install --no-audit --no-fund
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY --from=build /app/.output ./.output
COPY --from=build /app/backend ./backend
USER node
EXPOSE 3000 4000
CMD ["node", ".output/server/index.mjs"]
