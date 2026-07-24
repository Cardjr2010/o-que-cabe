# Relatorio - Produtos Mercado Livre incluidos por screener

Data da auditoria: 24/07/2026

## Resumo

Foram incluidos 4 produtos do Mercado Livre no fluxo de ofertas verificadas por parceiro/screener.

O Mercado Livre via API oficial ainda nao esta operacional neste ambiente, porque as chamadas reais retornaram 403 sem token OAuth valido. Portanto, estes produtos foram incluidos como ofertas monitoradas por screener publico, com link direto de produto, preco, parcela e data de verificacao.

## Contagem atual

- Ofertas totais no arquivo: 9
- Ofertas frescas e publicaveis: 6
- Mercado Livre publicavel: 4
- Amazon publicavel: 2
- Magalu automatico: 0, mantido bloqueado por 403/captcha

## Produtos Mercado Livre incluidos ou reativados

| Produto | Fonte | Preco | Parcelamento | Link direto | Status |
| --- | --- | ---: | --- | --- | --- |
| Apple iPhone 17 Pro Max 256GB Laranja-cosmico | Mercado Livre | R$ 10.999,00 | 10x R$ 1.099,90 sem juros | Sim | Reativado com URL direta |
| Apple iPhone 17 Pro Max 256GB Azul-profundo | Mercado Livre | R$ 10.999,00 | 10x R$ 1.099,90 sem juros | Sim | Novo |
| Samsung Galaxy S26 Ultra 256GB Azul - caixa aberta | Mercado Livre | R$ 7.450,00 | 10x R$ 745,00 sem juros | Sim | Novo |
| Roteador Xiaomi BE6500 Pro Wi-Fi 7 | Mercado Livre | R$ 2.169,00 | 12x R$ 208,57 | Sim | Novo |

## Evidencia usada

- API oficial Mercado Livre:
  - `items/MLB4200316101`: HTTP 403
  - `items/MLB6288481984`: HTTP 403
  - busca publica `sites/MLB/search`: HTTP 403
  - motivo: token OAuth real ausente neste ambiente.

- Screener publico:
  - Busca externa encontrou paginas diretas do Mercado Livre com preco e parcela para iPhone 17 Pro Max.
  - Busca externa encontrou pagina direta para Xiaomi BE6500 Pro.
  - Busca externa encontrou pagina direta para Galaxy S26 Ultra 256GB caixa aberta.

## Resultado no OQC

Buscas locais pelo SearchOrchestrator:

- `iphone 17 pro max 256gb`
  - dataMode: real
  - fallbackUsed: true
  - fallbackSource: verified_partner_offers
  - resultados: 3
  - Mercado Livre: 2 ofertas
  - Amazon: 1 oferta

- `s26 ultra`
  - dataMode: real
  - fallbackUsed: true
  - resultados: 2
  - Mercado Livre: 1 oferta
  - Amazon: 1 oferta

- `xiaomi be6500`
  - dataMode: real
  - fallbackUsed: true
  - resultados: 1
  - Mercado Livre: 1 oferta

## Correcoes de qualidade

O provider de ofertas verificadas foi ajustado para nao misturar familias de produto:

- busca por iPhone nao deve trazer Galaxy ou Xiaomi;
- busca por Galaxy/S26 nao deve trazer iPhone;
- busca por Xiaomi BE6500 deve trazer somente roteador Xiaomi relacionado.

## Bloqueio restante

Mercado Livre API operacional continua: NAO.

Para virar operacional por API, ainda falta autorizar uma conta real com:

- `MELI_CLIENT_ID`
- `MELI_CLIENT_SECRET`
- `MELI_ACCESS_TOKEN`
- `MELI_REFRESH_TOKEN`

Sem isso, o caminho confiavel atual e: screener controlado + link direto + preco/parcela registrados + revalidacao periodica.
