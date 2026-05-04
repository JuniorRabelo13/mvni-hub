import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Play, Pause, Trash2, BarChart2 } from "lucide-react";

export default function SMSCampanhas() {
  const [campaigns] = useState([
    { id: 1, nome: "Promoção Dia das Mães", lista: "Clientes VIP", status: "completed", data: "2024-05-10", envios: 1250 },
    { id: 2, nome: "Aviso de Vencimento", lista: "Inadimplentes", status: "processing", data: "2024-05-20", envios: 450 },
    { id: 3, nome: "Boas-vindas", lista: "Novos Cadastros", status: "scheduled", data: "2024-06-01", envios: 0 },
  ]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campanhas</h1>
          <p className="text-muted-foreground">Gerencie suas campanhas de SMS em massa.</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Nova Campanha
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campanha</TableHead>
                <TableHead>Lista</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Envios</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((camp) => (
                <TableRow key={camp.id}>
                  <TableCell className="font-medium">{camp.nome}</TableCell>
                  <TableCell>{camp.lista}</TableCell>
                  <TableCell>
                    <Badge variant={
                      camp.status === 'completed' ? 'default' : 
                      camp.status === 'processing' ? 'secondary' : 'outline'
                    }>
                      {camp.status === 'completed' ? 'Concluída' : 
                       camp.status === 'processing' ? 'Processando' : 'Agendada'}
                    </Badge>
                  </TableCell>
                  <TableCell>{camp.data}</TableCell>
                  <TableCell className="text-right">{camp.envios}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon"><BarChart2 className="h-4 w-4" /></Button>
                      {camp.status === 'scheduled' && <Button variant="ghost" size="icon text-green-500"><Play className="h-4 w-4" /></Button>}
                      {camp.status === 'processing' && <Button variant="ghost" size="icon text-yellow-500"><Pause className="h-4 w-4" /></Button>}
                      <Button variant="ghost" size="icon text-red-500"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
