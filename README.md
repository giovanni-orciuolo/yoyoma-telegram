# YoYo-Ma bot for Telegram

[![Deploy to now](https://deploy.now.sh/static/button.svg)](https://deploy.now.sh/?repo=https://github.com/DoubleHub/yoyo-ma-telegram)

A basic bot that I made in Javascript ES6 for Telegram.

![YoYo-Ma Logo](https://i.imgur.com/Enx5DCz.png "YoYo-Ma Logo")

The name is inspired by JoJo Part 6: Stone Ocean's stand Yo-Yo Ma. Taken from JJBA wiki:

>Yo-Yo Ma is indestructible, and will even relish its pain in a masochistic fashion. It seems to have a fixation with 
eating things and can often be seen drooling excessively. When it is assigned a target by its user, Yo-Yo Ma will 
follow them and obsequiously assist them in any way possible. This is to make the target drop their guard.

## Commands

The bot runs the following commands:

```
lyrics - Search songs on Genius by lyrics
language - Set language (pass a valid locale)
scp - Search a random SCP or pass a number to search exact SCP
cyanide - Generate and send a random Cyanide and Happiness comic
coin - Just flips a coin
```

There are also some random hears just for the sake of it, and the special
Crunchyroll command to dump my Crunchyroll credentials into a specific server.

Don't even bother searching, you won't find them in this repository...

## Run for development

```sh
$ npm install
$ npm run dev
```

```sh
$ yarn
$ yarn dev
```

Create a .env file with all the variables needed during development! (see below for more)

## Deploying with Docker like a boss

Yeah so you are one of the cool guys and you want to deploy on your own VPS or PC? No problem, this bot has got you covered.
Using Docker, you can simply run:

```sh
$ docker build -t yoyo-telegram-image .
$ docker run -d --name yoyo-telegram-app yoyo-telegram-image
```

Boom! YoYo-Ma is running on Docker.

### (Optional) Deploy with Now by Zeit

This bot can be deployed to [now](https://zeit.co/now) by Zeit.
Assuming you've got `now` installed and set up:

```sh
$ now DoubleHub/yoyo-ma-telegram
```

But you will need to manually setup secrets and environment variables still.

## Secrets

This bot needs a token to run. You can provide the token directly in the terminal like above, or you can store the
secrets in now-secrets.json. Now will use that file when deploying to fill the secrets in the environment.
Alternatively, you can provide a .env file to store the variables.

## Environment Variables needed

If you want every feature of the bot to work you need to provide these variables in the environment:

```
$ process.env.BOT_TOKEN - Needed for the bot to work on Telegram
$ process.env.GENIUS_TOKEN - Genius API token. It is needed for the /lyrics command to work
$ process.env.WITAI_TOKEN - Wit.ai API app token. It is needed for the speech to text parser to work
```

### Optional Environment Variables

This bot features a crunchyroll command, which outputs the email and password of a Crunchyroll account in a specific
group id. You can use the command to store different credentials, if you want.

```
$ process.env.CR_EMAIL - Crunchyroll email. It is needed for the crunchyroll command to work
$ process.env.CR_PASS - Crunchyroll password. It is needed for the crunchyroll command to work
$ process.env.CR_GROUP_ID - Group ID for the crunchyroll command.
```

### Internazionalization (i18n)
    
I'm currently using [telegraf-i18n](https://github.com/telegraf/telegraf-i18n) to implement i18n in this bot. Any support with the translation of this bot in other
languages will be kindly appreciated! All you have to do is create a new .yaml file in the i18n directory and
translate all the keys in your language of choice. Thank you in advance!

### Speech To Text (needs ffmpeg!)

This bot also implements a Speech To Text transcriber. In order to work, it needs ffmpeg to be installed on your system
and defined in your PATH env variable, so ensure that you have it! If you host the bot on Docker you won't have problems,
the Dockerfile will install it for you! :)

That's all folks!

---

Made with :green_heart: using [micro-bot](https://github.com/telegraf/micro-bot)
