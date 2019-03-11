FROM node:8.15.1-alpine

WORKDIR /home/app
COPY . /home/app

# Install dependencies
RUN npm install

# Run start command
CMD npm run start
