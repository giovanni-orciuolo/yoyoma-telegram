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

This project also features [dotenv](https://github.com/motdotla/dotenv) to store private environment variables, you should create a .env file in the root directory and store there BOT_TOKEN and other vars.

## Deployment

This bot can be deployed to [now](https://zeit.co/now) by Zeit.
Assuming you've got `now` installed and set up:

```sh
$ now -e BOT_TOKEN='123:......' DoubleHub/yoyo-ma-telegram
```

Alternative, deploy right now without even leaving the browser by clicking the button above.
