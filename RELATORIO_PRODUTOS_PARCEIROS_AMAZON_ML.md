# Relatório — Produtos Parceiros Amazon e Mercado Livre

Data: 2026-07-31

## O Que Foi Feito

Os produtos capturados de Amazon e Mercado Livre deixaram de ser tratados apenas como "ofertas frescas" e passaram a entrar no catálogo como produtos parceiros monitorados.

Isso permite que eles apareçam no inventário, nas categorias e nas buscas, mesmo quando a revalidação de preço/estoque precisa ser refeita.

Magalu continua fora do fluxo automático por enquanto por causa de bloqueios/captcha/403.

## Inventário Atual

Total analisado: 3.317

Total publicado: 2.382

Produtos ocultos por qualidade/fonte: 935

## Produtos Publicados Por Fonte

| Fonte | Produtos publicados |
| --- | ---: |
| Info Store | 1.462 |
| Amazon | 437 |
| Mercado Livre | 281 |
| Saldão da Informática | 202 |

## Parceiros Incluídos

Foram avaliadas 719 capturas elegíveis de Amazon/Mercado Livre.

Entraram 718 produtos únicos, porque havia 1 duplicidade real de item.

| Fonte parceira | Produtos únicos |
| --- | ---: |
| Amazon | 437 |
| Mercado Livre | 281 |

## Categorias Com Produtos Parceiros

| Categoria | Produtos parceiros |
| --- | ---: |
| Celular | 122 |
| Notebook | 119 |
| TV | 94 |
| Áudio | 89 |
| Ferramenta | 47 |
| Tablet | 46 |
| Monitor | 46 |
| Rede | 46 |
| Relógio | 45 |
| Casa | 41 |
| Achadinho | 7 |
| Esporte | 5 |
| Moda | 4 |
| Roteador | 3 |
| Presente | 2 |
| Câmera | 1 |
| Acessórios | 1 |

## Proteções Mantidas

- Produto parceiro precisa ter preço, imagem e link.
- Magalu não entra automaticamente.
- Produtos antigos entram como monitorados, não como cupom/oferta fresca.
- Cupons vencidos continuam sem alterar o preço principal.
- Saldão foi preservado mesmo com IDs repetidos no feed antigo.

## Provas Locais

Busca `iphone 17 pro max` com orçamento total de R$ 12.000 retornou produto real do Mercado Livre:

- Apple iPhone 17 Pro Max 256GB Azul-profundo
- Fonte: Mercado Livre
- Preço: R$ 10.999,00
- Link direto de produto do Mercado Livre

Busca `notebook i5 16gb` com orçamento total de R$ 4.000 retornou produto real do Mercado Livre:

- Notebook HP 256R G9 Intel Core i5, 16GB RAM
- Fonte: Mercado Livre
- Preço: R$ 3.799,00
- Link direto de produto do Mercado Livre

## Validação

- `node --test`: 168/168 testes aprovados
- `node --check public/app.js`: OK
- `node --check api/web.js`: OK
- `node --check server.mjs`: OK
- `node --check scripts/sync-partner-offers-to-catalog.mjs`: OK

