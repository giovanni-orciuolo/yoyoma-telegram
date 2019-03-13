FROM node:8.15.1-alpine

WORKDIR /home/app
COPY . /home/app
RUN mkdir audio/

# Install needed packages
RUN apk update && apk add ffmpeg

# Install dependencies
RUN npm install

# Run start command
CMD npm run start
