# YoYo-Ma for Telegram

[![Deploy to now](https://deploy.now.sh/static/button.svg)](https://deploy.now.sh/?repo=https://github.com/DoubleHub/yoyo-ma-telegram)

## Usage

```sh
$ npm install
$ BOT_TOKEN='123:......' npm run dev
```

```sh
$ yarn
$ BOT_TOKEN='123:......' yarn dev
```

## Deployment

This bot can be deployed to [now](https://zeit.co/now) by Zeit.
Assuming you've got `now` installed and set up:

```sh
$ now -e BOT_TOKEN='123:......' DoubleHub/yoyo-ma-telegram
```

Alternative, deploy right now without even leaving the browser by clicking the button above.

## Using Docker like a boss

Yeah you want to deploy on your own VPS or PC? No problem, this bot has got you covered.
Using Docker, you can simply run:

```sh
$ docker build -t yoyoma-telegram .
$ docker run -d -it --rm --name yoyoma-telegram-app yoyoma-telegram
```

Boom! Bot is running on Docker.

## Secrets

This bot needs a token to run. You can provide the token directly in the terminal like above, or you can store the
secrets in now-secrets.json. Now will use that file when deploying to fill the secrets in the environment.
