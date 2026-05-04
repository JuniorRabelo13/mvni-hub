import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageSquare, Search, Send, User } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export default function SMSInbox() {
  const [selectedChat, setSelectedChat] = useState<number | null>(1);
  const chats = [
    { id: 1, telefone: "+5511999999999", lastMessage: "SAIR", time: "10:30", unread: 1 },
    { id: 2, telefone: "+5521988888888", lastMessage: "Obrigado pelo retorno!", time: "Ontem", unread: 0 },
  ];

  const messages = [
    { id: 1, text: "Olá! Temos uma oferta para você.", type: "sent", time: "09:00" },
    { id: 2, text: "SAIR", type: "received", time: "10:30" },
  ];

  return (
    <div className="h-[calc(100vh-180px)] flex gap-4 animate-in fade-in duration-500">
      {/* Sidebar de Conversas */}
      <Card className="w-80 flex flex-col shrink-0">
        <CardHeader className="p-4 space-y-4">
          <CardTitle className="text-xl">Inbox</CardTitle>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar conversas..." className="pl-9 h-9" />
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            {chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => setSelectedChat(chat.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-4 hover:bg-muted transition-colors text-left border-b",
                  selectedChat === chat.id && "bg-muted"
                )}
              >
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <p className="font-semibold text-sm truncate">{chat.telefone}</p>
                    <span className="text-[10px] text-muted-foreground">{chat.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{chat.lastMessage}</p>
                </div>
                {chat.unread > 0 && (
                  <div className="h-2 w-2 rounded-full bg-primary" />
                )}
              </button>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Janela de Chat */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        {selectedChat ? (
          <>
            <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold">{chats.find(c => c.id === selectedChat)?.telefone}</CardTitle>
                  <p className="text-[10px] text-green-500 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Online
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0 relative">
              <ScrollArea className="h-full p-4 space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex mb-4",
                      msg.type === "sent" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[70%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                        msg.type === "sent"
                          ? "bg-primary text-primary-foreground rounded-tr-none"
                          : "bg-muted rounded-tl-none"
                      )}
                    >
                      <p>{msg.text}</p>
                      <p className={cn(
                        "text-[10px] mt-1 text-right opacity-70",
                        msg.type === "sent" ? "text-primary-foreground" : "text-muted-foreground"
                      )}>
                        {msg.time}
                      </p>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
            <div className="p-4 border-t bg-background">
              <div className="flex gap-2">
                <Input placeholder="Responda por aqui..." />
                <Button size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground space-y-4">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <MessageSquare className="h-8 w-8" />
            </div>
            <p className="text-sm">Selecione uma conversa para começar</p>
          </div>
        )}
      </Card>
    </div>
  );
}
