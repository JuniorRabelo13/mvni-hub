import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileUp, 
  XCircle, 
  PlayCircle, 
  Download, 
  RefreshCcw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Importacoes() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<any[]>([]);

  const fetchJobs = async () => {
    const { data, error } = await supabase
      .from("import_jobs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao carregar jobs:", error);
      toast.error("Erro ao carregar histórico de importações");
    } else {
      setJobs(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchJobs();
    
    // Inscrição em tempo real para atualizações de status
    const channel = supabase
      .channel("import_updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "import_jobs" },
        () => fetchJobs()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleCancel = async (jobId: string) => {
    const confirm = window.confirm("Tem certeza que deseja cancelar esta importação? Esta ação interromperá o processamento atual.");
    if (!confirm) return;

    // Update otimista na UI
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, cancelado: true, status: 'canceled' } : j));

    try {
      const { error } = await supabase.rpc("cancel_import_job", { p_job_id: jobId });
      if (error) throw error;
      toast.success("Importação cancelada com sucesso");
      fetchJobs();
    } catch (error: any) {
      toast.error("Erro ao cancelar importação: " + error.message);
      fetchJobs(); // Reverter se der erro
    }
  };

  const handleResume = async (jobId: string) => {
    try {
      const { error } = await supabase.rpc("resume_import_job", { p_job_id: jobId });
      if (error) throw error;
      toast.success("Processamento retomado");
      fetchJobs();
    } catch (error: any) {
      toast.error("Erro ao retomar importação: " + error.message);
    }
  };

  const downloadErrors = async (jobId: string, jobName: string) => {
    try {
      const { data, error } = await supabase.rpc("get_import_errors", { p_job_id: jobId });
      if (error) throw error;

      if (!data || data.length === 0) {
        toast.info("Nenhum erro registrado para esta importação");
        return;
      }

      // Gerar CSV conforme Etapa 5 (Sanitizado)
      const headers = ["CNPJ;Erro"];
      const rows = data.map((e: any) => {
        const cnpj = (e.cnpj || "").replace(/;/g, ',');
        const erro = (e.erro || "")
          .replace(/;/g, ',')
          .replace(/\n/g, ' ')
          .replace(/\r/g, '');
        return `${cnpj};${erro}`;
      });

      const csvContent = "\uFEFF" + [
        headers[0],
        ...rows
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `erros_importacao_${jobName.replace(/\s+/g, "_")}_${jobId.slice(0, 8)}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Relatório de erros baixado");
    } catch (error: any) {
      toast.error("Erro ao baixar relatório: " + error.message);
    }
  };

  const getStatusBadge = (status: string, cancelado: boolean) => {
    // Etapa 4 - Mapeamento de status detalhado
    if (cancelado || status === 'canceled') return <Badge variant="destructive">Cancelado</Badge>;
    
    switch (status) {
      case "pending": return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" /> Aguardando</Badge>;
      case "processing": return <Badge variant="default" className="bg-blue-500 animate-pulse"><Loader2 className="mr-1 h-3 w-3 animate-spin" /> Processando</Badge>;
      case "done": return <Badge variant="default" className="bg-emerald-500"><CheckCircle2 className="mr-1 h-3 w-3" /> Concluído</Badge>;
      case "failed": return <Badge variant="destructive"><AlertCircle className="mr-1 h-3 w-3" /> Falhou</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gerenciador de Importações</h1>
          <p className="text-muted-foreground">Monitore, pause ou retome pipelines de dados em massa.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileUp className="h-5 w-5 text-primary" />
            Jobs Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Importação</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Progresso</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center">Carregando...</TableCell></TableRow>
              ) : jobs.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center">Nenhuma importação encontrada.</TableCell></TableRow>
              ) : (
                jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{job.nome}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(job.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      {/* Etapa 3 - Resumo visual do progresso */}
                      <div className="space-y-1">
                        <div className="text-[10px] text-muted-foreground flex justify-between">
                          <span>{job.linhas_processadas} de {job.total_linhas} registros</span>
                          <span>{Math.round((job.linhas_processadas / (job.total_linhas || 1)) * 100)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all duration-500" 
                            style={{ width: `${(job.linhas_processadas / (job.total_linhas || 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(job.status, job.cancelado)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {/* Etapa 1 - UI de cancelamento */}
                        {job.status === "processing" && !job.cancelado && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 text-destructive border-destructive/20 hover:bg-destructive/10"
                            onClick={() => handleCancel(job.id)}
                          >
                            <XCircle className="h-4 w-4 mr-1" /> Parar
                          </Button>
                        )}
                        
                        {(job.status === "failed" || job.status === "canceled") && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 text-blue-600 border-blue-200 hover:bg-blue-50"
                            onClick={() => handleResume(job.id)}
                          >
                            <PlayCircle className="h-4 w-4 mr-1" /> Retomar
                          </Button>
                        )}

                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          title="Baixar Relatório de Erros"
                          onClick={() => downloadErrors(job.id, job.nome)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={fetchJobs}
                        >
                          <RefreshCcw className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
