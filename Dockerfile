FROM node:latest

LABEL MComScience <m-com3@hotmail.com>

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
COPY ./static /usr/src/app/static
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]