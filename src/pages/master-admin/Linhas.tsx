import { lazy, Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const LinhasVisaoGeral = lazy(() => import("./LinhasVisaoGeral"));
const MvnoLinhas = lazy(() => import("./MvnoLinhas"));

export default function Linhas() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Infraestrutura Telecom</p>
        <h1 className="mt-1 text-3xl font-bold md:text-4xl">
          Gestão de <span className="text-gradient-gold">Linhas</span>
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Visão geral e gerenciamento operacional de todas as linhas MVNO.</p>
      </div>

      <Tabs defaultValue="visao-geral" className="w-full">
        <TabsList>
          <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="gerenciar">Gerenciar Linhas</TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral" className="mt-6">
          <Suspense fallback={<Card><CardContent className="p-8"><Skeleton className="h-96 w-full" /></CardContent></Card>}>
            <LinhasVisaoGeral />
          </Suspense>
        </TabsContent>

        <TabsContent value="gerenciar" className="mt-6">
          <Suspense fallback={<Card><CardContent className="p-8"><Skeleton className="h-96 w-full" /></CardContent></Card>}>
            <MvnoLinhas />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
