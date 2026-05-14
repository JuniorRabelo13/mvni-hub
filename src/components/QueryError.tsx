import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface QueryErrorProps {
  error: unknown;
  onRetry?: () => void;
  title?: string;
}

export function QueryError({ error, onRetry, title = "Erro ao carregar dados" }: QueryErrorProps) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
      ? error
      : "Não foi possível carregar as informações. Tente novamente em alguns instantes.";

  return (
    <Alert variant="destructive" className="my-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex flex-col gap-3">
        <span>{message}</span>
        {onRetry && (
          <div>
            <Button size="sm" variant="outline" onClick={onRetry}>
              Tentar novamente
            </Button>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}

export default QueryError;
