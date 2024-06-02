FROM node:16.15.0-alpine3.15


WORKDIR /app
COPY package*.json ./

RUN yarn add nodemon
RUN yarn
COPY . .

EXPOSE 3000 

CMD ["yarn", "dev"]