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

# Add chromium user
RUN mkdir -p /usr/src/app \
    && adduser -D chromium \
    && chown -R chromium:chromium /usr/src/app

# Run Chrome as non-privileged
USER chromium
WORKDIR /usr/src/app

ENV CHROME_BIN=/usr/bin/chromium-browser \
    CHROME_PATH=/usr/lib/chromium/

COPY . /usr/src/app

# Install dependencies
RUN npm install

# Start application inside PM2
CMD [ "pm2-runtime", "start", "pm2.json" ]
