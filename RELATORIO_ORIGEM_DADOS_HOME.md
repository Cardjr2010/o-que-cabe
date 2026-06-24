# RELATORIO ORIGEM DADOS HOME

## Objetivo

Separar claramente a origem dos dados na busca da home.

## Origem padrão

- `Mercado Livre`

## Origens suportadas

- Demo
- Amazon
- Mercado Livre
- Magalu

## Ajustes aplicados

1. A busca passou a enviar a origem selecionada na query `source`.
2. A função da Vercel passou a respeitar a origem escolhida.
3. Mercado Livre não mistura mais resultados com Amazon.
4. A origem aparece nos cards e no botão:
   - Mercado Livre -> `Ver no Mercado Livre`
   - Amazon -> `Ver na Amazon`
   - Magalu -> `Ver na Magalu`
5. A classificação por categoria foi preservada para termos como:
   - celular
   - notebook
   - tablet

## Validação local

- `/api/search?q=celular&monthly=50&months=12&source=mercadolivre`
- `/api/search?q=notebook&monthly=50&months=12&source=amazon`
- `/` continua respondendo HTML

## Observação

O fallback demo continua disponível, mas agora com origem correta para cada busca.

