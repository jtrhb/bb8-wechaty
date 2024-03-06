import express, {Express, Request, Response} from 'express'
import timeout from 'connect-timeout'
import path from 'path'
import { bot, sendText, sendImage, createRoom } from './main'


const bodyParser = require('body-parser')
require('body-parser-xml')(bodyParser)

const app: Express = express()

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.use(bodyParser.json({ limit: '200mb' }))
app.use(bodyParser.xml())
app.use(bodyParser.urlencoded({ extended: true, limit: '200mb' }))
app.use(timeout('30s'))

const port: number = 9000

app.post('/send/text', async (req, res) => {
  res.end()
  const data = req.body
  console.log(data)
  await sendImage(data.chatId, data.text)
  console.log(`message sent: ${data.text}`)
})

app.post('/send/image', async (req, res) => {
  res.end()
  const data = req.body
  console.log(data)
  await sendText(data.chatId, data.text)
  console.log(`message sent: ${data.text}`)
})

app.post('/room/notify', async (req, res) => {
  res.end()
  const data = req.body
  console.log(data)
  const room = await bot.Room.find({topic: '测试群'})
  await room?.say(data.text)
  console.log(`message sent: ${data.text}`)
})

app.post('/room/create', async (req, res) => {
  res.end()
  const data = req.body
  console.log(data)
  await createRoom(data.chatId, '陈维', data.text)
})

const httpServer = app.listen(port, async () => {
  bot.start()
  .then(() => console.log('StarterBot', 'Starter Bot Started.'))
  .catch(e => console.log('StarterBot', e))
})