FROM node:lts-bullseye-slim@sha256:eb53400d495d33c3b9ba9c625960e1c9c25f991961562606d111f0bceb89de56

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .
RUN chown -R node:node /app

ENV PORT \
	NODE_ENV \
	JWT_SECRET \
	JWT_EXPIRES_IN \
	LOG_LEVEL \
	BASE_URL

USER node
EXPOSE 3000

CMD ["node", "server.js"]
