import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, Check, Loader2, QrCode } from "lucide-react";

interface PixPaymentDialogProps {
  pagamentoId: string | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function PixPaymentDialog({ cobrancaId, onOpenChange, onSuccess }: PixPaymentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [pixData, setPixData] = useState<{ qr_code: string; copy_paste: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (cobrancaId) {
      generatePix();
    } else {
      setPixData(null);
    }
  }, [cobrancaId]);

  // Realtime subscription para verificar status
  useEffect(() => {
    if (!cobrancaId || !pixData) return;

    const channel = supabase
      .channel(`cobranca-${cobrancaId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'cobrancas',
          filter: `id=eq.${cobrancaId}`
        },
        (payload) => {
          if (payload.new.status === 'pago') {
            toast.success("Pagamento confirmado via Realtime!");
            onSuccess();
            onOpenChange(false);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [cobrancaId, pixData]);

  const generatePix = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("criar-cobranca-pix", {
        body: { cobranca_id: cobrancaId },
      });

      if (error) throw error;
      setPixData(data);
    } catch (error: any) {
      toast.error("Erro ao gerar PIX: " + error.message);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (pixData?.copy_paste) {
      navigator.clipboard.writeText(pixData.copy_paste);
      setCopied(true);
      toast.success("Código PIX copiado!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={!!cobrancaId} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader>
          <DialogTitle className="text-center">Pagamento via PIX</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center space-y-4 py-4">
          {loading ? (
            <div className="flex flex-col items-center gap-2 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Gerando QR Code...</p>
            </div>
          ) : pixData ? (
            <>
              <div className="bg-white p-4 rounded-lg">
                {pixData.qr_code.startsWith('data:image') ? (
                  <img src={pixData.qr_code} alt="QR Code PIX" className="w-48 h-48" />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center bg-muted rounded">
                     <QrCode className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              
              <div className="w-full space-y-2">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Copia e Cola</p>
                <div className="flex items-center gap-2 bg-muted p-2 rounded border border-border">
                  <code className="text-[10px] break-all text-left flex-1 line-clamp-2">
                    {pixData.copy_paste}
                  </code>
                  <Button size="icon" variant="ghost" onClick={copyToClipboard}>
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-amber-500 font-medium animate-pulse">
                <Clock className="h-4 w-4" />
                Aguardando pagamento...
              </div>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper icon component since Clock wasn't imported in this snippet scope but used
function Clock({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
