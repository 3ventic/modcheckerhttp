FROM node:12-slim

WORKDIR /app
COPY . .

EXPOSE 8080
ENTRYPOINT ["node", "index.js"]
