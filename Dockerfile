FROM keymetrics/pm2:latest-alpine

WORKDIR /home/app
COPY . /home/app
RUN mkdir audio/

# Install needed packages
RUN apk update && apk add ffmpeg

# Install dependencies
RUN npm install
RUN pm2 install pm2-server-monit

# Start application inside PM2
CMD [ "pm2-runtime", "start", "pm2.json"]
