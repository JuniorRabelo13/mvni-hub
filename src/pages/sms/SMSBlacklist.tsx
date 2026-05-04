import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldAlert, UserPlus, Trash2, Search } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function SMSBlacklist() {
  const { toast } = useToast();
  const [newNumber, setNewNumber] = useState("");
  const [blacklist] = useState([
    { id: 1, telefone: "+5511911111111", motivo: "Solicitado (SAIR)", data: "2024-05-10" },
    { id: 2, telefone: "+5521922222222", motivo: "Spam reportado", data: "2024-05-15" },
  ]);

  const handleAdd = () => {
    if (!newNumber) return;
    toast({ title: "Número bloqueado", description: "O número foi adicionado à blacklist." });
    setNewNumber("");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Blacklist</h1>
        <p className="text-muted-foreground">Gerencie números bloqueados para evitar envios indesejados.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" /> Adicionar Manualmente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="number">Telefone</Label>
              <Input 
                id="number" 
                placeholder="Ex: 5511999999999" 
                value={newNumber}
                onChange={(e) => setNewNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo</Label>
              <Input id="reason" placeholder="Ex: Solicitação direta" />
            </div>
            <Button className="w-full gap-2" onClick={handleAdd}>
              <ShieldAlert className="h-4 w-4" /> Bloquear Número
            </Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Números Bloqueados</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar..." className="pl-9 h-9" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blacklist.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-sm">{item.telefone}</TableCell>
                    <TableCell className="text-sm">{item.motivo}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{item.data}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {blacklist.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Nenhum número bloqueado encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
