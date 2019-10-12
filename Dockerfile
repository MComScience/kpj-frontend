FROM node:latest

LABEL MComScience <m-com3@hotmail.com>

ENV PORT 3000

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json /usr/src/app/
RUN npm install

# Bundle app source
COPY . /usr/src/app

#RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]