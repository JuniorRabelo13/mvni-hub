import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "mvni_pwa_install_dismissed_at";
const COOLDOWN_MS = 1000 * 60 * 60 * 24 * 7;

export function InstallPWAPrompt() {
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (dismissedAt && Date.now() - dismissedAt < COOLDOWN_MS) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setEvt(e as BIPEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!visible || !evt) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  const install = async () => {
    await evt.prompt();
    await evt.userChoice;
    dismiss();
  };

  return (
    <div
      className="fixed left-1/2 z-50 w-[92vw] max-w-sm -translate-x-1/2 rounded-xl border border-primary/30 bg-card p-3 shadow-lg md:hidden"
      style={{ bottom: "calc(env(safe-area-inset-bottom) + 72px)" }}
    >
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-primary/15 p-2 text-primary">
          <Download className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">Instalar MVNI Hub</p>
          <p className="text-xs text-muted-foreground">Acesso rápido direto da tela inicial.</p>
        </div>
        <button
          onClick={dismiss}
          aria-label="Fechar"
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        <Button size="sm" className="flex-1" onClick={install}>
          Instalar
        </Button>
        <Button size="sm" variant="outline" onClick={dismiss}>
          Agora não
        </Button>
      </div>
    </div>
  );
}
