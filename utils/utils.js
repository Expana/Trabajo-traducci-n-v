import { outro, text, isCancel, spinner } from '@clack/prompts'
import colors from 'picocolors'
import { mainSymbols } from 'figures'
import fetch from 'node-fetch'
import boxen from 'boxen'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

import { createRequire } from 'module'
import { API_URL } from './constants.js'
const __dirname = fileURLToPath(new URL('.', import.meta.url))
const require = createRequire(import.meta.url)
const pkg = require('../package.json')

const infoMsg = `${colors.magenta(mainSymbols.pointer)} ${colors.yellow('Tweet CLI V2 Version:')} ${colors.blue(pkg.version)}\n\n${colors.magenta(mainSymbols.pointer)} ${colors.yellow('Click here for additional information:')} ${colors.blue('https://github.com/EDUJOS/tweet-cli-v2')}`
const sp = spinner()

export const info = boxen(infoMsg, {
  title: 'Developed with love by @EdTkiere <3',
  titleAlignment: 'center',
  padding: 2,
  borderColor: 'yellow',
  borderStyle: 'round',
  width: 60,
  textAlignment: 'center'
})

export function exitProgram ({ code = 0, message = `${mainSymbols.cross} Vaya, parece que eres un completo estúpido` } = {}) {
  outro(colors.red(message))
  process.exit(code)
}

export const Tweet = async (body, token) => {
  try {
    const TweetBody = {
      TweetBody: body
    }
    // Api status: Off
    const results = await fetch(`${API_URL}/api/singletweet`, {
      method: 'POST',
      body: JSON.stringify(TweetBody),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    })
    const data = await results.json()
    return data
  } catch (err) {
    console.error(err)
    return err
  }
}

export const tweetInfo = async (url) => {
  sp.start('Procesando solicitud')
  const id = getTweetId(url)
  if (id === false) {
    sp.stop(`${colors.yellow('Ups...')}`)
    exitProgram({ message: 'La url es inválida' })
  } else {
    const results = await fetch(`${API_URL}/api/tweetinfo/${id}`)
    const {
      username,
      name,
      tweet_text,
      created_at,
      like_count,
      retweet_count,
      reply_count,
      quote_count,
      impression_count,
      error
    } = await results.json()
    if (error === 'Not Found') {
      sp.stop('Vaya! Parece que el Tweet del que quieres obtener información fue eliminado.')
      exitProgram({ message: 'Chauuu' })
    } else {
      sp.stop(`${colors.green(mainSymbols.tick)}`)
      console.clear()
      const newDate = new Date(created_at)
      const date = newDate.toLocaleString('en-US')
      const message = `${colors.blue('Usuario:')} ${name}\n${colors.blue('Tweet:')} ${tweet_text}\n${colors.blue('Likes:')} ${like_count} 💖\n${colors.blue('Retweets:')} ${retweet_count}\n${colors.blue('Respuestas:')} ${reply_count}\n${colors.blue('Tweets citados:')} ${quote_count}\n${colors.blue('Vistas:')} ${impression_count}\n${colors.blue('Publicado:')} ${date}`
      const TWEET_INFO = boxen(message, {
        title: `El Tweet de ${colors.magenta(username)} se ha recuperado con éxito`,
        titleAlignment: 'center',
        padding: 2,
        borderColor: 'magenta',
        borderStyle: 'round',
        width: 80,
        textAlignment: 'left'
      })
      outro(`\n${TWEET_INFO}`)
    }
  }
}

export const login = async () => {
  try {
    const folderPath = path.join(__dirname, '.././cli-config/credentials')
    const filePath = path.join(folderPath, 'user.json')
    if (!fs.existsSync(folderPath)) {
      const usernameCmd = await text({
        message: 'Parece que no te has logeado o tu sesión ha expirado, por favor inicia sesión... 🍟',
        placeholder: 'Ingresa tu Username aquí 👀',
        validate (value) {
          if (value === 0) return `${colors.yellow(`${mainSymbols.cross} Lo siento, no puedes enviar un string vacío`)}`
        }
      })
      if (isCancel(usernameCmd)) exitProgram()
      const passwordCmd = await text({
        message: 'Introduce tu contraseña 🔐',
        placeholder: 'Ingresa tu contraseña aquí 👀',
        validate (value) {
          if (value === 0) return `${colors.yellow(`${mainSymbols.cross} Lo siento, no puedes enviar un string vacío`)}`
        }
      })
      if (isCancel(passwordCmd)) exitProgram()
      const userBody = {
        username: usernameCmd,
        password: passwordCmd
      }
      sp.start(`${colors.yellow('Iniciando sesión')}`)
      const data = await getToken(userBody)
      if (data.error === 'Invalid user or password') {
        sp.stop(`${colors.red(`${mainSymbols.cross}`)} ${colors.yellow(`Ups... Parece que tus credenciales son inválidas.\nIntenta ejecutar: ${colors.magenta(`edtba ${mainSymbols.arrowRight} npx edtba`)} para intentarlo una vez más!`)} 😅`)
        exitProgram()
      } else {
        sp.stop(`${colors.green(`${mainSymbols.tick} Bienvenido de vuelta`)} ${colors.magenta(usernameCmd)}✨`)
        const UserCredentials = {
          username: data.username,
          password: passwordCmd,
          token: data.token
        }
        sp.start(`${colors.yellow('Guardando credenciales 📩')}`)
        fs.mkdirSync(folderPath)
        fs.writeFileSync(filePath, JSON.stringify(UserCredentials, null, '\t'))
        sp.stop(`${colors.green(`${mainSymbols.tick}`)} ${colors.magenta('Tus credenciales han sido guardadas con éxito')}🔐`)
      }
    }
  } catch (err) {
    console.log(err)
    sp.stop(`${colors.red('Vaya, parece que ha ocurrido un error inesperado...')}😅`)
    exitProgram()
  }
}

export const getToken = async (userBody) => {
  // Api status: Off
  const results = await fetch(`${API_URL}/api/login`, {
    method: 'POST',
    body: JSON.stringify(userBody),
    headers: { 'Content-Type': 'application/json' }
  })
  const data = await results.json()
  return data
}

const getTweetId = (tweetUrl) => {
  let tweetId
  if (tweetUrl.includes('https://twitter.com/') && tweetUrl.includes('status')) {
    let separada = tweetUrl.split('/')[5]
    if (tweetUrl.includes('?')) {
      tweetId = separada.split('?')[0]
      console.log(tweetId)
      return tweetId
    } else {
      tweetId = separada
      return tweetId
    }
  } else {
    return false
  }
}

export async function apiHealthCheck () {
  try {
    sp.start()
    await fetch(`${API_URL}/api/health`)
      .then(res => res.json())
    sp.stop()
  } catch (err) {
    sp.stop()
    exitProgram({ message: 'Vaya! Parece que la API está caída :(' })
  }
}
