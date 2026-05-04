import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileType, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

export default function SMSNovaLista() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [listName, setListName] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = () => {
    if (!listName) {
      toast({ title: "Nome obrigatório", description: "Dê um nome para sua lista.", variant: "destructive" });
      return;
    }
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      toast({ title: "Lista importada", description: "Seus contatos foram processados com sucesso." });
      navigate("/sms/listas");
    }, 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/sms/listas")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nova Lista</h1>
          <p className="text-muted-foreground">Importe seus contatos via arquivo CSV ou Excel.</p>
        </div>
      </div>

      <div className="grid gap-6 max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Detalhes da Lista</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Lista</Label>
              <Input 
                id="name" 
                placeholder="Ex: Leads Campanha Junho" 
                value={listName}
                onChange={(e) => setListName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Arquivo de Contatos</Label>
              <div className="border-2 border-dashed rounded-lg p-12 text-center space-y-4 hover:bg-muted/50 transition-colors cursor-pointer border-muted-foreground/20">
                <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Arraste seu arquivo ou clique para selecionar</p>
                  <p className="text-xs text-muted-foreground">Formatos suportados: .csv, .xls, .xlsx, .txt</p>
                </div>
                <Input type="file" className="hidden" />
              </div>
            </div>

            <div className="rounded-lg bg-blue-500/5 border border-blue-500/20 p-4">
              <div className="flex gap-3">
                <FileType className="h-5 w-5 text-blue-500 shrink-0" />
                <div className="text-xs space-y-1">
                  <p className="font-semibold text-blue-500">Padrão de Importação:</p>
                  <ul className="list-disc list-inside text-muted-foreground">
                    <li>A primeira coluna deve conter o telefone.</li>
                    <li>Use formato internacional (ex: 5511999999999).</li>
                    <li>Nomes e tags podem ser adicionados em colunas extras.</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button className="w-full gap-2" size="lg" onClick={handleUpload} disabled={isUploading}>
              {isUploading ? "Processando..." : "Importar Lista"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
