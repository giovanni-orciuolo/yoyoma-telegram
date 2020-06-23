# YoYo-Ma bot for Telegram

[![Telegram Chat](https://img.shields.io/badge/chat-t.me%2Fyoyoma__bot-blue.svg)](https://t.me/yoyoma_bot)

A basic bot that I made in Javascript ES6 for Telegram.

![YoYo-Ma Logo](https://i.imgur.com/Enx5DCz.png "YoYo-Ma Logo")

The name is inspired by JoJo Part 6: Stone Ocean's stand Yo-Yo Ma. Taken from JJBA wiki:

>Yo-Yo Ma is indestructible, and will even relish its pain in a masochistic fashion. It seems to have a fixation with 
eating things and can often be seen drooling excessively. When it is assigned a target by its user, Yo-Yo Ma will 
follow them and obsequiously assist them in any way possible. This is to make the target drop their guard.

## Commands

The bot runs the following commands:

```
config - Open config manager for this chat. Requires admin rights if issued in a group
lyrics - Search songs on Genius by lyrics
scp - Search a random SCP or pass a number to search exact SCP
rcg - Generate and send a random Cyanide and Happiness comic (taken from http://explosm.net/rcg)
coin - Just flips a coin
// ytaudio - Search a video on Youtube and download audio from it [Disabled due to high CPU usage]
// pokefusion - Generate a random Pokémon fusion and prints its Pokédex entry [Disabled because it's not working yet in production mode]
stickerid - Get a sticker id
tesseract - Tries to transcribe text from an image (it isn't really good at it)
cah - Sends a random Cards Against Humanity combination. It's fun sometimes... I swear!
ratecock - Rates the cock of whoever you mention
```

There are also some random hears just for the sake of it

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

[![Deploy to now](https://deploy.now.sh/static/button.svg)](https://deploy.now.sh/?repo=https://github.com/DoubleHub/yoyo-ma-telegram)

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
$ process.env.GOOGLE_API_TOKEN - Google API app token. It is needed for the Youtube Search to work
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

Made with :green_heart: using [telegraf](https://github.com/telegraf/telegraf)
