# RELATORIO FIX BUSCA HOME

## Objetivo

Garantir que a busca da home tenha resultados de demonstração úteis na Vercel.

## Correções aplicadas

1. A função da Vercel passou a responder a `/api/search` com fallback demo local.
2. A função da Vercel passou a responder a `/api/teste-produtos` com fallback demo local.
3. `data/products.json` foi ampliado com mais opções de demonstração, incluindo celulares, tablet, casa e presente.
4. A classificação de resultados continua mostrando:
   - `CABE`
   - `APERTADO`
   - `NÃO CABE`

## Validação local

- `/` responde HTML
- `/api/search?q=celular&monthly=50&months=12` retorna produtos demo
- `/api/teste-produtos?q=celular&monthly=50&months=12` retorna produtos demo

## Observação

A home segue sem alterar layout. O fallback demo evita que a busca fique vazia para termos comuns como celular, notebook, tablet, casa e presente.

