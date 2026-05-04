import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Users, Trash2, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function SMSListas() {
  const navigate = useNavigate();
  const [lists] = useState([
    { id: 1, nome: "Clientes VIP", contatos: 500, criacao: "2024-04-01" },
    { id: 2, nome: "Lead de São Paulo", contatos: 1200, criacao: "2024-04-15" },
    { id: 3, nome: "Black Friday 2023", contatos: 8500, criacao: "2023-11-01" },
  ]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Listas de Contatos</h1>
          <p className="text-muted-foreground">Organize seus contatos para campanhas segmentadas.</p>
        </div>
        <Button className="gap-2" onClick={() => navigate("/sms/listas/nova")}>
          <Plus className="h-4 w-4" /> Criar Lista
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome da Lista</TableHead>
                  <TableHead>Total de Contatos</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lists.map((list) => (
                  <TableRow key={list.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {list.nome}
                    </TableCell>
                    <TableCell>{list.contatos.toLocaleString()}</TableCell>
                    <TableCell>{list.criacao}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
