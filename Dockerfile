FROM node:8.15.1-alpine
WORKDIR /home/app
COPY . /home/app
RUN npm install
CMD npm run start
