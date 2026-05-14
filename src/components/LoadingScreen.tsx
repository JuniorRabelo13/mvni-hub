import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

const messages = [
  'Carregando módulo...',
  'Preparando interface...',
  'Sincronizando dados...',
  'Quase lá...',
];

export const LoadingScreen = () => {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setMsgIndex(i => (i + 1) % messages.length);
    }, 1500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-zinc-950">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse min-w-[150px] text-center">
          {messages[msgIndex]}
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;