FROM keymetrics/pm2:latest-alpine
MAINTAINER Giovanni Orciuolo <giovanni.orciuolo1999@gmail.com>

# Installs latest Chromium package and ffmpeg
RUN echo @edge http://nl.alpinelinux.org/alpine/edge/community >> /etc/apk/repositories \
    && echo @edge http://nl.alpinelinux.org/alpine/edge/main >> /etc/apk/repositories \
    && apk add --no-cache \
    ffmpeg@edge \
    chromium@edge \
    && rm -rf /var/cache/* \
    && mkdir /var/cache/apk

# Setup Chrome environment variables to point to Chromium bin
ENV CHROME_BIN=/usr/bin/chromium-browser \
    CHROME_PATH=/usr/lib/chromium/

WORKDIR /home/app

# Copy package.json
COPY package.json /home/app/package.json
COPY yarn.lock /home/app/yarn.lock

# Install dependencies
RUN yarn --prod --ignore-engines

# Copy project source files
COPY . /home/app

# Start application inside PM2
CMD [ "pm2-runtime", "start", "pm2.json" ]
