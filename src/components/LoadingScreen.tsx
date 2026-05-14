import { Loader2 } from "lucide-react";

export const LoadingScreen = () => (
  <div className="flex h-screen w-full items-center justify-center bg-zinc-950">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground animate-pulse">Carregando módulo...</p>
    </div>
  </div>
);

export default LoadingScreen;