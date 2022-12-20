FROM node:16-alpine
WORKDIR /usr/src/app

COPY . ./
RUN npm install

COPY . ./
COPY .env.example .env
EXPOSE 3000

CMD ["node", "server.js"]