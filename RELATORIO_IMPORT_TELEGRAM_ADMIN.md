# Importacao Telegram Admin OQC

Gerado em: 2026-08-01

## Objetivo

Criar um fluxo pratico para usar os exports reais do Telegram como entrada de produtos, sem depender de API externa instavel e sem importar cupom/campanha generica como produto.

## O que foi criado

- Pagina admin: `/admin-telegram.html`
- Endpoint protegido: `POST /api/admin/telegram-import`
- Autenticacao: `Authorization: Bearer <OQC_ADMIN_TOKEN>` ou `x-oqc-admin-token`
- Acoes:
  - `preview`: revisa o HTML sem alterar catalogo.
  - `import`: importa produtos aceitos no filesystem atual.

Observacao operacional: em producao serverless, a importacao via endpoint so fica duravel depois de commit e redeploy do catalogo atualizado.

## Exports avaliados

| Export | Mensagens | Produtos aceitos | Fontes |
|---|---:|---:|---|
| ChatExport_2026-07-31 (4)/messages.html | 216 | 15 | Mercado Livre 5, Amazon 10 |
| ChatExport_2026-07-31 (5)/messages.html | 145 | 9 | Mercado Livre 5, Amazon 4 |
| ChatExport_2026-07-31 (6)/messages2.html | 93 | 34 | Mercado Livre 28, Amazon 6 |

Total bruto aceito: 58 ofertas.

## Impacto no catalogo

Antes:

- Produtos publicados: 2.274
- Total analisado: 3.209
- Amazon: 355
- Mercado Livre: 247

Depois:

- Produtos publicados: 2.280
- Total analisado: 3.215
- Amazon: 361
- Mercado Livre: 247
- Produtos com origem Telegram afiliados: 64

Resultado liquido:

- 6 produtos novos adicionados.
- 52 produtos existentes atualizados/substituidos por link/id ja conhecido.

## Produtos novos liquidos

| Produto | Fonte | Preco | Categoria |
|---|---|---:|---|
| Combo Teclado e Mouse Sem Fio Logitech MK250 | Amazon | 169,90 | Informatica |
| Eudora Siage Hidratacao Micelar Shampoo 250ml | Amazon | 41,99 | Beleza |
| Brinox Jogo de Panelas 8 Pecas Ceramic Life Smart Plus | Amazon | 799,90 | Casa |
| Cooktop por Inducao Oster Touch Screen 4 Bocas | Amazon | 1.199,00 | Casa |
| Teclado sem fio Logitech K400 Plus TV | Amazon | 148,48 | Informatica |
| L'OR Cafe Soluvel Classique Pote de Vidro 130g | Amazon | 39,65 | Casa |

## Regras de rejeicao

Foram rejeitados:

- mensagens sem link de afiliado aceito;
- mensagens sem preco capturado;
- campanhas/cupom sem produto concreto;
- links fora das fontes aceitas;
- mensagens fora da data do lote selecionado;
- duplicados por link.

## Validacoes executadas

- `node --check public/app.js`
- `node --check api/web.js`
- `node --check server.mjs`
- `node --check scripts/import-telegram-affiliate-offers.mjs`
- `node --test`

Resultado final:

- 176 testes executados.
- 176 testes aprovados.

## Prova do endpoint admin

Validacao em memoria do `server.mjs`:

- `/api/health`: 200
- `/api/admin/telegram-import` sem token: 401
- `/api/admin/telegram-import` com token e produto Mercado Livre: 200
- Produto aceito: `Fritadeira Eletrica Air Fryer WAP Cozinha Barbecue com Painel Digital`
- Fonte: Mercado Livre
- Preco: R$ 872,10
- Categoria: Casa

