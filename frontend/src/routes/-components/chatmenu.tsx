import React, { useState, useEffect, useRef } from 'react';
import useWebSocket from 'react-use-websocket';
import { ChatBubble, ContactItem, Message, Contact, ChatInput } from './chat-components';
import { getToken } from '../../api/auth';
import { useNavigate } from '@tanstack/react-router';
import { useMediaQuery } from 'react-responsive';

const CHAT_WS = 'ws://localhost:3000';

function getTokenPayload() {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch (error) {
    console.error('Invalid token:', error);
    return null;
  }
}

const ChatMenu: React.FC = () => {
  const tokenPayload = getTokenPayload();
  const userId = tokenPayload?.userId || 0;

  const navigate = useNavigate();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [typingBubble, setTypingBubble] = useState<Message | null>(null);

  const isLargeScreen = useMediaQuery({ query: '(min-width: 1024px)' });
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { sendMessage, lastMessage } = useWebSocket(CHAT_WS, {
    protocols: getToken() || '',
    onOpen: () => {
      sendMessage(JSON.stringify({ type: 'get_contacts' }));
    },
    onClose: () => console.log('WebSocket disconnected'),
    onError: (event) => console.error('WebSocket error:', event),
    shouldReconnect: () => true,
  });

  const scrollToBottom = () => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (lastMessage) {
      const receivedMessage = JSON.parse(lastMessage.data);
      if (receivedMessage.type === 'contacts') {
        setContacts(receivedMessage.contacts);
      } else if (receivedMessage.type === 'chat') {
        if (
          receivedMessage.from_id === activeChatId ||
          receivedMessage.to_id === activeChatId
        ) {
          const newMessage: Message = {
            id: receivedMessage.id,
            from_id: receivedMessage.from_id,
            to_id: receivedMessage.to_id,
            message: receivedMessage.message,
            timestamp: new Date(receivedMessage.timestamp),
          };
          setChatMessages((prev) => [...prev, newMessage]);
        }
      } else if (receivedMessage.type === 'history') {
        if (receivedMessage.chatWith === activeChatId) {
          const history: Message[] = receivedMessage.messages.map((msg: Message) => ({
            id: msg.id,
            from_id: msg.from_id,
            to_id: msg.to_id,
            message: msg.message,
            timestamp: new Date(msg.timestamp),
          }));
          setChatMessages(history);
        }
      } else if (receivedMessage.type === 'typing') {
        const typingBubble: Message = {
          id: -1,
          from_id: receivedMessage.from_id,
          to_id: activeChatId!,
          message: 'is typing...',
          timestamp: new Date(),
        };
        setTypingBubble(typingBubble);
        setTimeout(() => setTypingBubble(null), 2000);
      }
    }
  }, [lastMessage, activeChatId]);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, typingBubble]);

  const handleContactClick = (contactId: number) => {
    setActiveChatId(contactId);
    setChatMessages([]);
    sendMessage(JSON.stringify({ type: 'get_history', toId: contactId }));
  };

    // Kirim event mengetik tanpa debounce
  const handleTyping = () => {
    if (activeChatId) {
      sendMessage(JSON.stringify({ type: 'typing', toId: activeChatId }));
    }
  };

  const handleSendMessage = (message: string) => {
    if (message.trim() && activeChatId) {
      const newMessage: Message = {
        id: Date.now(),
        from_id: userId,
        to_id: activeChatId,
        message,
        timestamp: new Date(),
      };
      sendMessage(
        JSON.stringify({
          type: 'chat',
          toId: activeChatId,
          message,
        })
      );
      setChatMessages((prev) => [...prev, newMessage]);
      setTypingBubble(null);
    }
  };

  const handleBackToContacts = () => {
    setActiveChatId(null);
  };

  if (!userId) {
    console.error('User is not logged in.');
    return <p>User is not logged in.</p>;
  }

  return (
    <div className="chat-menu flex h-screen">
      {/* Contact List */}
      {(isLargeScreen || !activeChatId) && (
        <div className="contacts-list w-full lg:w-1/4 h-full overflow-y-auto border-r border-gray-300 bg-gray-100">
          {contacts.length > 0 ? (
            contacts.map((contact) => (
              <ContactItem
                key={contact.id}
                contact={contact}
                onclick={() => handleContactClick(contact.id)}
              />
            ))
          ) : (
            <p className="text-gray-500 p-4">No contacts available.</p>
          )}
        </div>
      )}

      {/* Chat Box */}
      {(isLargeScreen || activeChatId) && (
        <div className="chat-box flex flex-col w-full lg:w-3/4 h-full bg-white">
          {activeChatId ? (
            <>
              {/* Header with back button on small screens */}
              <div className="chat-header bg-gray-200 p-4 border-b border-gray-300 flex items-center">
                {!isLargeScreen && (
                  <button
                    className="text-blue-500 font-bold mr-4"
                    onClick={handleBackToContacts}
                  >
                    Back
                  </button>
                )}
                <p className="font-bold text-gray-800">
                  {contacts.find((c) => c.id === activeChatId)?.full_name || 'Chat'}
                </p>
              </div>

              {/* Chat Content */}
              <div className="chat-content flex-grow overflow-y-auto p-4 bg-gray-50">
                {chatMessages.map((msg, index) => (
                  <ChatBubble
                    key={msg.id || index}
                    msg={msg}
                    left={msg.from_id !== userId}
                  />
                ))}
                {typingBubble && (
                  <ChatBubble msg={typingBubble} left={true} />
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <ChatInput onSend={handleSendMessage} onTyping={handleTyping}/>
            </>
          ) : (
            <div className="flex-grow flex items-center justify-center">``
              <p className="text-gray-500 text-center">Select a contact to start chatting</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatMenu;
