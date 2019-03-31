FROM keymetrics/pm2:latest-alpine
MAINTAINER Giovanni Orciuolo <giovanni.orciuolo1999@gmail.com>

WORKDIR /home/app
COPY . /home/app
RUN mkdir audio/

# Install needed packages
RUN apk update && apk add ffmpeg

# Install dependencies
RUN npm install

# Start application inside PM2
CMD [ "pm2-runtime", "start", "pm2.json" ]
