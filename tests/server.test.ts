process.env.NODE_ENV = 'test'

jest.mock('../src/main', () => {
  return {
    bot: { start: jest.fn(), Room: { find: jest.fn() } },
    sendText: jest.fn(),
    sendImage: jest.fn(),
    createRoom: jest.fn(),
  }
})

import request from 'supertest'
import { app } from '../src/server'
import { sendText } from '../src/main'

describe('POST /send/text', () => {
  it('should call sendText with correct parameters', async () => {
    await request(app)
      .post('/send/text')
      .send({ chatId: '123', text: 'hello' })
      .expect(200)

    expect(sendText).toHaveBeenCalledWith('123', 'hello')
  })
})
