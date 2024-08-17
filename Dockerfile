FROM node:16.15.0-alpine3.15


WORKDIR /app

COPY ./package.json .
RUN npm install
 COPY . .
RUN npm dev build

CMD ["node", "dist/main.js"]