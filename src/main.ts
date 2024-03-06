import {log, ScanStatus, WechatyBuilder, Message} from "wechaty"
import {PuppetPadlocal} from "wechaty-puppet-padlocal"
import * as PUPPET from "wechaty-puppet"
import { FileBox }  from 'file-box'
import {dingDongBot, getMessagePayload, LOGPRE} from "./helper"
import Redis from 'ioredis'
import { v4 as uuidv4 } from 'uuid'

/****************************************
 * 去掉注释，可以完全打开调试日志
 ****************************************/
// log.level("silly");
const axios = require('axios')

const redisClient = new Redis()
const chatId2contact = {}
const contactId2chatId = {}

const puppet = new PuppetPadlocal({
    token: "puppet_padlocal_a6cf8740af134364818e9bbbc6877213"
})

export const bot = WechatyBuilder.build({
  name: "PadLocalDemo",
  puppet,
})
  .on("scan", (qrcode, status) => {
    if (status === ScanStatus.Waiting && qrcode) {
      const qrcodeImageUrl = [
        'https://wechaty.js.org/qrcode/',
        encodeURIComponent(qrcode),
      ].join('')

      log.info(LOGPRE, `onScan: ${ScanStatus[status]}(${status})`);

      console.log("\n==================================================================");
      console.log("\n* Two ways to sign on with qr code");
      console.log("\n1. Scan following QR code:\n");

      require('qrcode-terminal').generate(qrcode, {small: true})  // show qrcode on console

      console.log(`\n2. Or open the link in your browser: ${qrcodeImageUrl}`);
      console.log("\n==================================================================\n");
    } else {
      log.info(LOGPRE, `onScan: ${ScanStatus[status]}(${status})`);
    }
  })

  .on("login", (user) => {
    log.info(LOGPRE, `${user} login`);
  })

  .on("logout", (user, reason) => {
    log.info(LOGPRE, `${user} logout, reason: ${reason}`);
  })

  .on("message", handleMessage)

  .on("room-invite", async (roomInvitation) => {
    log.info(LOGPRE, `on room-invite: ${roomInvitation}`);
  })

  .on("room-join", (room, inviteeList, inviter, date) => {
    log.info(LOGPRE, `on room-join, room:${room}, inviteeList:${inviteeList}, inviter:${inviter}, date:${date}`);
  })

  .on("room-leave", (room, leaverList, remover, date) => {
    log.info(LOGPRE, `on room-leave, room:${room}, leaverList:${leaverList}, remover:${remover}, date:${date}`);
  })

  .on("room-topic", (room, newTopic, oldTopic, changer, date) => {
    log.info(LOGPRE, `on room-topic, room:${room}, newTopic:${newTopic}, oldTopic:${oldTopic}, changer:${changer}, date:${date}`);
  })

  .on("friendship", async (friendship) => {
    log.info(LOGPRE, `on friendship: ${friendship}`)
    try {
      if (friendship.type() === bot.Friendship.Type.Receive) {
        await friendship.accept()
        const contact = friendship.contact()
        if (contact && !contactId2chatId[contact.id]) {
          const chatId = uuidv4()
          contactId2chatId[contact.id] = chatId
          chatId2contact[chatId] = contact
        }
        axios.post('http://127.0.0.1:8080/message/', {
          "data": {
            "botWeixin": "hongkongBot",
            "chatId": contactId2chatId[contact!.id],
            "payload": {"text": '我已经添加了你，现在我们可以开始聊天了。'},
            "roomWecomChatId": null,
            "contactName": contact.name()
          }
        })
      }
    } catch (e) {
      console.error(e)
    }
  })

  .on("error", (error) => {
    log.error(LOGPRE, `on error: ${error}`);
  })

async function handleMessage(message: Message) {
  if (message.self()) return
  if (message.type() !== PUPPET.types.Message.Text) return
  try {
    const contact = message.talker()
    if (contact && !contactId2chatId[contact.id]) {
      const chatId = uuidv4()
      contactId2chatId[contact.id] = chatId
      chatId2contact[chatId] = contact
    }
    await axios.post('http://127.0.0.1:8080/message/', {
      "data": {
        "botWeixin": "hongkongBot",
        "chatId": contactId2chatId[contact!.id],
        "payload": {"text": message.text()},
        "roomWecomChatId": null,
        "contactName": contact.name()
      }
    })
  } catch (error) {
    console.log(error)
  }
}

export async function sendText(chatId, text) {
  const contact = chatId2contact[chatId]
  await contact.say(text)
}

export async function sendImage(chatId, imageUrl) {
  const contact = chatId2contact[chatId]
  const image = FileBox.fromUrl(imageUrl)
  await contact.say(image)
}

export async function createRoom(chatId, salesName, greeting) {
  const helperContactA = chatId2contact[chatId]
  const helperContactB = await bot.Contact.find({ name: salesName })
  const contactList = [helperContactA, helperContactB]
  console.log('Bot', 'contactList: %s', contactList.join(','))
  const room = await bot.Room.create(contactList, `${helperContactA.name()}的专属服务群`)
  console.log('Bot', 'createRoom() new room created: %s', room)
  await room.say(greeting)
}