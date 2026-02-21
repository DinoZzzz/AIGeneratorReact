FROM node:20-alpine

WORKDIR /app

COPY push-worker/package*.json ./
RUN npm ci --omit=dev

COPY push-worker/src ./src

ENV NODE_ENV=production

CMD ["npm", "start"]
