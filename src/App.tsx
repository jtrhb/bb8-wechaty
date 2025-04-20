tsx
import React, { useState, useEffect, useRef } from 'react';
import { Layout, List, Avatar, Input, Button, message, Spin, QRCode } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import io from 'socket.io-client';

const { Sider, Content, Footer } = Layout;
const { Search, TextArea } = Input;

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: number;
  isMe: boolean;
}

interface Conversation {
  id: string;
  name: string;
  avatar: string;
  unreadCount: number;
  lastMessage?: string;
  messages: Message[];
}

const App: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageInput, setMessageInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const socketRef = useRef<SocketIOClient.Socket | null>(null);
  const messageListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    socketRef.current = io('http://localhost:3000');

    socketRef.current.on('connect', () => {
      console.log('Connected to socket server');
    });
    
    socketRef.current.on('scan', (qrcode:string) => {
      console.log('scan qrcode:', qrcode)
      setQrCodeData(qrcode)
    });

    socketRef.current.on('message', (msg: Message) => {
      console.log('Received message:', msg);
        setConversations((prevConversations) => {
          const updatedConversations = prevConversations.map((conversation) => {
            if (conversation.id === msg.sender) {
              return {
                ...conversation,
                messages: [...conversation.messages, msg],
              };
            }
            return conversation;
          });
           return [...updatedConversations];
        });
    });
    
     socketRef.current.on('connect_error', (error: any) => {
        console.error('Socket connection error:', error);
      });
  
      socketRef.current.on('disconnect', (reason: any) => {
        console.warn('Socket disconnected:', reason);
      });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    // Mock data - Replace with real data from the server
    const mockConversation = {
      id: 'default',
      name: 'Default Chat',
      avatar: 'https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png',
      unreadCount: 0,
      messages: [],
    };

    setConversations([mockConversation]);
    setSelectedConversation(mockConversation);
  }, []);

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [selectedConversation?.messages]);

  const handleConversationClick = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversation) {
      return;
    }
    
    const newMessage: Message = {
      id: Math.random().toString(),
      sender: selectedConversation.id,
      content: messageInput,
      timestamp: Date.now(),
      isMe: true,
    };

    socketRef.current?.emit('message', newMessage);

    setMessageInput('');
    setConversations((prevConversations) => {
          const updatedConversations = prevConversations.map((conversation) => {
            if (conversation.id === selectedConversation.id) {
              return {
                ...conversation,
                messages: [...conversation.messages, newMessage],
              };
            }
            return conversation;
          });
           return [...updatedConversations];
        });
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={250} style={{ background: '#fff' }}>
        {
            qrCodeData?(
                <div style={{ display:'flex', justifyContent:'center', alignItems:'center', padding:'10px' }}>
                  <QRCode value={qrCodeData} size={200}/>
                </div>
              ):(<></>)
        }
        <List
          itemLayout="horizontal"
          dataSource={conversations}
          renderItem={(conversation) => (
            <List.Item
              key={conversation.id}
              onClick={() => handleConversationClick(conversation)}
              style={{ cursor: 'pointer', backgroundColor: selectedConversation?.id === conversation.id ? '#e6f7ff' : 'transparent' }}
            >
              <List.Item.Meta
                avatar={<Avatar src={conversation.avatar} />}
                title={conversation.name}
                description={conversation.lastMessage}
              />
              {conversation.unreadCount > 0 && (
                <div style={{ color: 'red', fontWeight: 'bold' }}>{conversation.unreadCount}</div>
              )}
            </List.Item>
          )}
        />
      </Sider>
      <Layout>
        <Content style={{ padding: '24px', overflow: 'auto', height: 'calc(100vh - 100px)' }} ref={messageListRef}>
          {selectedConversation ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {selectedConversation.messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    alignSelf: msg.isMe ? 'flex-end' : 'flex-start',
                    maxWidth: '70%',
                    padding: '10px',
                    borderRadius: '10px',
                    background: msg.isMe ? '#e6f7ff' : '#f0f0f0',
                  }}
                >
                  {msg.content}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', marginTop: '50px' }}>
              {loading ? (
                <Spin size="large" />
              ) : (
                <p>Select a conversation to start chatting.</p>
              )}
            </div>
          )}
        </Content>
        <Footer style={{ padding: '10px 24px', background: '#fafafa', display:'flex' }}>
          <TextArea
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onPressEnter={handleSendMessage}
            style={{flex:1}}
            autoSize={{ minRows: 1, maxRows: 6 }}
          />
          <Button
            type="primary"
            shape="circle"
            icon={<SendOutlined />}
            style={{marginLeft: 10}}
            onClick={handleSendMessage}
          />
        </Footer>
      </Layout>
    </Layout>
  );
};

export default App;