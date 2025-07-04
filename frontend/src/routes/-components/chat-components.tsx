import React from 'react';

// Struktur data untuk pesan (Message)
export interface Message {
  id: number;
  timestamp: Date | string;
  from_id: number;
  to_id: number;
  message: string;
}

// Struktur data untuk kontak (Contact)
export interface Contact {
  id: number;
  full_name: string;
  lastMessage: string;
  unreadCount: number;
}

// Komponen Bubble Chat
export const ChatBubble: React.FC<{ msg: Message; left: boolean }> = ({ msg, left }) => {
  const bubbleClasses = left
      ? 'bg-gray-300 text-black self-start rounded-tl-md rounded-tr-lg rounded-br-lg'
      : 'bg-blue-600 text-white self-end rounded-tl-lg rounded-tr-md rounded-bl-lg';

  const containerClasses = left ? 'justify-start' : 'justify-end';

  return (
      <div className={`flex ${containerClasses} my-2`}>
          <div className={`px-4 py-2 max-w-xs ${bubbleClasses}`}>
              <p>{msg.message}</p>
              {msg.id !== -1 && ( // Jangan tampilkan timestamp untuk bubble typing
                  <span className="text-xs text-gray-500 block mt-1">
                      {formatTimestamp(msg.timestamp)}
                  </span>
              )}
          </div>
      </div>
  );
};

// Komponen untuk Daftar Kontak
export const ContactItem: React.FC<{ contact: Contact; onclick: (id: number) => void }> = ({
  contact,
  onclick,
}) => {
  return (
    <div
      className="p-4 flex justify-between items-center border-b border-gray-300 hover:bg-gray-200 cursor-pointer"
      onClick={() => onclick(contact.id)}
    >
      <div>
        <p className="font-bold text-gray-800">{contact.full_name}</p>
        <p className="text-gray-500 text-sm truncate">{contact.lastMessage}</p>
      </div>
      {contact.unreadCount > 0 && (
        <span className="bg-red-500 text-white rounded-full px-2 text-xs">
          {contact.unreadCount}
        </span>
      )}
    </div>
  );
};

// Fungsi Format Waktu
function formatTimestamp(timestamp: string | Date): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} hrs ago`;
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
}

// Komponen untuk Input Pesan
export const ChatInput: React.FC<{ onSend: (message: string) => void; onTyping: () => void }> = ({
  onSend,
  onTyping,
}) => {
  const [message, setMessage] = React.useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    onTyping();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const handleSend = () => {
    if (message.trim()) {
      onSend(message.trim());
      setMessage('');
    }
  };

  return (
    <div className="flex items-center p-4 bg-gray-100 border-t border-gray-300">
      <input
        type="text"
        value={message}
        onChange={handleChange}
        onKeyDown={handleKeyPress}
        placeholder="Type a message..."
        className="flex-grow p-2 border bg-white border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-300"
      />
      <button
        onClick={handleSend}
        className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Send
      </button>
    </div>
  );
};


export default { ChatBubble, ContactItem, ChatInput };
