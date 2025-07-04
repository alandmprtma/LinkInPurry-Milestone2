import { createFileRoute} from '@tanstack/react-router';
import ChatMenu from './-components/chatmenu';
import Navbar from './-components/navbar';

export const Route = createFileRoute('/chat')({
  component: Chat,
});

// Komponen Chat
function Chat() {
  

  return (
    <div className="h-screen w-screen overflow-y-scroll flex flex-col">
      <Navbar inputString="chat" onSearchChange={() => {}} />
      <ChatMenu /> {/* Pass initialChatId ke ChatMenu */}
    </div>
  );
}

export default Chat;
