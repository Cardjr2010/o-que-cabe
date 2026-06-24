# RELATORIO_FIX_FALLBACK_CATEGORIAS

## Objetivo
Garantir fallback demo específico para categorias que vinham vazias, mantendo a distinção entre dado real e demonstração.

## O que foi ajustado
- adição de produtos demo para `tv`
- adição de produtos demo para `relogio`
- cobertura de fallback para `smartwatch`
- manutenção dos demos já existentes para `air fryer`, `notebook` e `tablet`
- reforço da relevância por categoria na busca

## Validação local

### q=tv — monthly=200 — months=12
- retorno: 2 produtos
- primeiro produto: Samsung Crystal TV 50"
- status do primeiro produto: CABE
- dataMode: demo

### q=relogio — monthly=100 — months=10
- retorno: 2 produtos
- primeiro produto: Samsung Galaxy Watch
- status do primeiro produto: CABE
- dataMode: demo

### q=celular — monthly=80 — months=12
- retorno: 7 produtos
- primeiro produto: Samsung Galaxy A05
- status do primeiro produto: CABE
- dataMode: demo

## Observação
A busca continua tentando Mercado Livre real primeiro. Quando não há retorno útil, o fallback demo agora cobre as categorias pedidas sem misturar celular com TV ou relógio.
