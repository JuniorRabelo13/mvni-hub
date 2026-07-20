
# Plano — Implementação integral da Especificação MVNI HUB

A especificação anexa contém **10 ajustes independentes** que abrangem banco, edge functions, Stripe e frontend. Vou executá-los na ordem sugerida pelo próprio documento, cada bloco validado antes do próximo. Nenhuma funcionalidade existente será removida — tudo aditivo/corretivo. A regra "não alterar Stripe/webhook/comissão" de prompts anteriores é **substituída explicitamente** pela autorização deste prompt de implementar os fluxos descritos.

## Escopo confirmado

**AJUSTE 1** — Remover `.lovable/plan.md` (resíduo do PIX-via-Stripe abandonado).

**AJUSTE 2** — Consolidar `planos` → `saas_plans`:
- Migration: adicionar `features jsonb` a `saas_plans` se ausente.
- Atualizar `src/components/SeletorPlano.tsx` para ler `saas_plans` com novos nomes de coluna.
- Repointar FK `clientes.plano_id` para `saas_plans(id)`.
- DROP `planos` após confirmar zero refs. Não tocar em `planos_mvno`.

**AJUSTE 3** — Unificar `/master/linhas` + `/master/mvno/linhas` numa única tela com abas ("Visão Geral" + "Gerenciar Linhas"). Remover entrada duplicada do sidebar.

**AJUSTE 4** — `stripe-webhook` no `checkout.session.completed` do cadastro chama `stripe-criar-assinatura` automaticamente usando o dia do mês do cadastro como `dia_vencimento` (aniversário). `proration_behavior: none` mantido.

**AJUSTE 5** — Corrigir bug em `calcular-comissao-representante`: filtrar `valor_recorrencia_direta` para NÃO incluir assinaturas criadas dentro do próprio `mes_referencia` (recorrência só do mês 2 em diante).

**AJUSTE 6** — Expandir avisos:
- `disparar-notificacoes-dia`: novos tipos `pre_vencimento_5`, `pre_vencimento_2` (mantém `vencimento_hoje` e `pos_vencimento`).
- Novo trigger/handler `pagamento_confirmado` disparado quando `pagamentos.status` vira `pago`.
- `enviar-notificacao-vencimento`: mensagem própria para cada um dos 5 tipos.

**AJUSTE 7** — Adicionar cron em `supabase/config.toml`:
```
[cron.disparar-notificacoes-dia]
schedule = "0 9 * * *"
```

**AJUSTE 8** — Ligar motor financeiro ao `stripe-webhook`:
- 1º pagamento (cadastro/mês 1): `ativar_linha_pos_pagamento()` → guarda `linha_id` → `registrar_ativacao_financeira()`.
- `invoke.payment_succeeded` para pagamentos recorrentes (mês 2+): apenas `registrar_recorrencia_financeira()` (nunca ativar linha de novo, nunca duplicar mês 1).
- Erros de RPC não travam webhook — logam em `system_error_logs` para tratamento manual.

**AJUSTE 9** — Nova página `src/pages/master-admin/FinanceiroMvni.tsx` (rota `/master/financeiro-mvni` para não colidir com `/master/financeiro` existente):
- Seletor de mês (default: atual).
- Consome `get_mvni_financeiro_mensal(mes)` via `.rpc()`.
- Cards: receita clientes, receita operadoras, custo operadoras, comissões pagas, descontos, **lucro líquido em destaque**.
- Gráfico de composição (operadora vs parceiros vs lucro) com recharts.
- Nova entrada no sidebar do master admin.

**AJUSTE 10** — Ads self-service completo (frontend, banco pronto):
- `/anuncios/criar` — assistente 4 passos (criativo → posição → duração+preço via `calcular_preco_anuncio` → checkout Stripe único).
- Edge function `criar-checkout-anuncio` para gerar sessão Stripe única; webhook marca anúncio como `pendente_aprovacao` ao confirmar pagamento.
- `/anuncios/meus` — anúncios do usuário com contagem de impressões/cliques via `anuncios_eventos`.
- `/master/anuncios` — fila de aprovação: aprovar (chama `aprovar_anuncio`) / rejeitar (chama `rejeitar_anuncio` + estorno Stripe).
- Componente `<AdSlot posicao="dashboard_topo" />` — busca ativos vigentes, registra impressão/clique em `anuncios_eventos`.
- Cron leve: ativar anúncios `aprovado` cuja `data_inicio <= now()` → status `ativo` (via cron diário já compartilhado).

## O que NÃO será alterado

- `planos_mvno`, catálogo MVNO, `mvno-pagarme-pix-criar`, `mvno-pagarme-webhook` — PIX MVNO continua no Pagar.me.
- Fluxo Stripe de assinatura de representante permanece — apenas ganha automação e integração pós-pagamento.
- RLS de tabelas fora do escopo (todas as tabelas de Ads/motor financeiro já têm RLS testada).
- Nenhuma tabela nova além do que o próprio spec já criou (o motor financeiro e as tabelas de Ads já existem).

## Ordem de execução

1. Ajustes 1 → 7 → 6 → 5 → 4 → 8 (fluxo backend de cobrança, comissão e notificações)
2. Ajustes 2 → 3 → 9 (consolidação e telas admin)
3. Ajuste 10 (Ads — maior superfície de frontend)

Cada bloco é uma migration/edge function/PR isolado; se qualquer um falhar, os anteriores permanecem funcionais.

## Entregáveis finais (relatório)

Ao terminar entregarei: (1) arquivos criados, (2) reaproveitados, (3) migrations, (4) APIs/edge functions, (5) componentes React, (6) alterações Stripe (endpoints/eventos), (7) fluxo E2E (cadastro → pagamento → ativação linha → lançamento financeiro → comissão → notificação), (8) checklist de conformidade item-a-item com a especificação, (9) pendências que dependem de você (configuração Stripe/Pagar.me, secrets).

---

**Aprova para eu executar?** Assim que aprovar, começo pelo Ajuste 1 e sigo pela ordem acima sem parar entre blocos.
