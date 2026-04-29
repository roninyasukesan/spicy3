
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, X } from "lucide-react";
import ChatLayoutLite from "@/components/chat/chat-layout-lite";
import { localGetUser } from "@/lib/local-auth";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

export function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Check login status
    const checkLogin = () => {
      const user = localGetUser();
      setIsLoggedIn(!!user);
    };

    checkLogin();
    window.addEventListener("storage", checkLogin);
    window.addEventListener("spicy-auth-change", checkLogin);
    
    return () => {
      window.removeEventListener("storage", checkLogin);
      window.removeEventListener("spicy-auth-change", checkLogin);
    };
  }, []);

  // Don't show on login/register pages or chat page
  if (pathname === "/login" || pathname === "/cadastro" || pathname === "/cadastro/modelo" || pathname === "/dashboard/chat" || pathname?.startsWith("/dashboard/chat")) {
    return null;
  }

  if (!isLoggedIn) return null;

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-[100] rounded-full h-14 w-14 shadow-lg transition-all duration-300",
          isOpen ? "bg-red-600 hover:bg-red-700 rotate-90" : "bg-primary-600 hover:bg-primary-700"
        )}
      >
        {isOpen ? <X className="h-6 w-6 text-white" /> : <MessageCircle className="h-6 w-6 text-white" />}
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 left-4 md:left-auto md:right-6 z-[100] md:w-[450px] h-[600px] max-h-[calc(100vh-10rem)] bg-dark-950 border border-gray-800 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-200">
          <div className="bg-dark-900 p-3 border-b border-gray-800 flex justify-between items-center">
            <h3 className="font-bold text-white flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-primary-500" />
              Chat
            </h3>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-hidden relative">
            {/* We override some styles of ChatLayout to fit the widget */}
            <div className="absolute inset-0 [&>div]:h-full [&>div]:rounded-none [&>div]:border-0">
               <ChatLayoutLite mode="floating" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
