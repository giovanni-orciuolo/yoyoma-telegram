FROM keymetrics/pm2:latest-alpine
MAINTAINER Giovanni Orciuolo <giovanni.orciuolo1999@gmail.com>

# Installs latest Chromium package.
RUN echo @edge http://nl.alpinelinux.org/alpine/edge/community >> /etc/apk/repositories \
    && echo @edge http://nl.alpinelinux.org/alpine/edge/main >> /etc/apk/repositories \
    && apk add --no-cache \
    chromium@edge \
    harfbuzz@edge \
    nss@edge \
    freetype@edge \
    ttf-freefont@edge \
    && rm -rf /var/cache/* \
    && mkdir /var/cache/apk

ENV CHROME_BIN=/usr/bin/chromium-browser \
    CHROME_PATH=/usr/lib/chromium/

WORKDIR /home/app
COPY . /home/app

# Install needed packages
# RUN apk update && apk add ffmpeg already covered by Chromium?

# Install dependencies
RUN npm install

# Start application inside PM2
CMD [ "pm2-runtime", "start", "pm2.json" ]
