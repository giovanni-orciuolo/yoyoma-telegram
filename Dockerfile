FROM keymetrics/pm2:latest-alpine
MAINTAINER Giovanni Orciuolo <giovanni.orciuolo1999@gmail.com>

# Install Google Chrome
RUN wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
RUN dpkg -i google-chrome-stable_current_amd64.deb; apt-get -fy install
ENV CHROME_BIN=/usr/bin/google-chrome

WORKDIR /home/app
COPY . /home/app

# Install needed packages
RUN apk update && apk add ffmpeg

# Install dependencies
RUN npm install

# Start application inside PM2
CMD [ "pm2-runtime", "start", "pm2.json" ]
