# Configurar ambiente local — MVNI HUB

Para rodar localmente, crie um arquivo `.env` na raiz do projeto com:

```
VITE_SUPABASE_PROJECT_ID=hmzqfcooxqucytxwljhg
VITE_SUPABASE_URL=https://hmzqfcooxqucytxwljhg.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=COLE_AQUI_A_CHAVE_PUBLICA_ANON
```

A chave `VITE_SUPABASE_PUBLISHABLE_KEY` deve ser a chave pública/anon do projeto backend conectado ao MVNI HUB (Lovable Cloud).

Não usar:
- `service_role`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- quaisquer chaves privadas

Depois de salvar o `.env`, reinicie o servidor local:

```
npm run dev -- --host 127.0.0.1 --port 8106
```

## Observação
Se o `.env` estiver ausente ou incompleto, o app agora lança um erro claro em vez de exibir tela branca com `supabaseUrl is required`.
