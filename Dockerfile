FROM node:22-alpine AS build
WORKDIR /app

ARG VITE_OPEXNAL_API_URL=
ENV VITE_OPEXNAL_API_URL=${VITE_OPEXNAL_API_URL}

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/.output ./.output

USER node
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
