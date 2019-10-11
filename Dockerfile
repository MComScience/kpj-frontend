FROM node:latest

LABEL MComScience <m-com3@hotmail.com>

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY ./ /usr/src/app/
RUN npm install && npm run build && npm run export
EXPOSE 5000
CMD ["npm", "start"]