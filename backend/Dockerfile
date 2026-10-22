FROM node:22-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY backend ./backend
RUN mkdir -p /app/media && chown -R node:node /app
USER node
EXPOSE 4000
CMD ["node", "backend/server.js"]
