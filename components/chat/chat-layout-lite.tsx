 "use client";
 
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Send } from "lucide-react";
 import { cn } from "@/lib/utils";
 
 export default function ChatLayoutLite({ mode = "full" }: { mode?: "full" | "floating" }) {
   return (
     <div className={cn("flex h-full bg-dark-950 border border-gray-800 rounded-lg overflow-hidden relative", mode === "floating" ? "" : "")}>
       <div className="flex-1 flex flex-col">
         <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-dark-900">
           <h3 className="font-semibold text-white">Chat</h3>
         </div>
         <div className="flex-1 p-6 text-center text-gray-500">
           <p>Carregando chat...</p>
         </div>
         <div className="p-4 bg-dark-900 border-t border-gray-800">
           <form className="flex gap-2">
             <Input 
               placeholder="Digite sua mensagem..." 
               className="bg-dark-800 border-gray-700 text-white"
             />
             <Button className="bg-primary-600 hover:bg-primary-700">
               <Send className="h-5 w-5" />
             </Button>
           </form>
         </div>
       </div>
     </div>
   );
 }
