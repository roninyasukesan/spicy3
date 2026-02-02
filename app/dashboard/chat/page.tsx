"use client";

import ChatLayoutLite from "@/components/chat/chat-layout-lite";
import { Header } from "@/components/header";

export default function ChatPage() {
  return (
    <div className="flex flex-col h-screen bg-dark-950 overflow-hidden">
      <div className="flex-none z-50">
        <Header />
      </div>
      <div className="flex-1 overflow-hidden w-full max-w-7xl mx-auto p-0 md:p-4">
        <ChatLayoutLite />
      </div>
    </div>
  );
}
