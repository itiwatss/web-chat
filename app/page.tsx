import ChatBox from "@/components/ChatBox";
import ChatList from "@/components/ChatList";
import { InboxProvider } from "@/components/InboxContext";
import InboxShell from "@/components/InboxShell";

export default function Home() {
  return (
    <InboxProvider>
      <InboxShell>
        <ChatList />
        <ChatBox />
      </InboxShell>
    </InboxProvider>
  );
}
