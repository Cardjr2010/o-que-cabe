# Relatorio intake Amazon 8.8

Data: 2026-08-05
Pagina de origem: https://amzlink.to/az0g7oruNLKIg

## Resultado da captura

- ASINs identificados na pagina: 93
- Produtos aceitos para o OQC: 30
- Registros rejeitados: 34
- Fonte aplicada no catalogo: amazon
- Tag de afiliado usada nos links: candombledesm-20

## Categorias importadas

- casa: 8
- celular: 4
- achadinho: 18

## Produtos principais importados

- Air Fryer Philco 4L Redstone PAF40A 220V | R$ 209,89 | B0DY3G3MJW
- WAP Aspirador de Po e Agua Barril GTW COMPACT 127V | R$ 162,44 | B0CG792C4C
- Smartphone Motorola Moto g35 5G 128GB | R$ 849,00 | B0DHWFBYVC
- Samsung Galaxy A36 5G 128GB 6GB RAM | R$ 1.429,00 | B0DYVNRG3B
- Samsung Galaxy A57 5G 128GB 8GB RAM | R$ 1.999,00 | B0GVT7QXF7
- Samsung Galaxy A37 5G 256GB 8GB RAM | R$ 2.098,89 | B0GVSXJF6K
- WAP Mini Liquidificador Blender Go 300W | R$ 144,99 | B0FY6RV5FM
- Oster Cafeteira com Jarra Inox 1,2L | R$ 146,05 | B002NLADVU
- Liquidificador Oster 1400 Full 3,2L | R$ 152,75 | B08DFCF9HW
- WAP Lavadora de Alta Pressao ATACAMA SMART 127V | R$ 308,90 | B076QDQVMJ

## Ganchos de conteudo aplicados

- Air Fryer: "3 coisas que me fizeram usar menos oleo."
- Aspirador: "Como parei de varrer a casa todos os dias."
- Mop: "O item que me fez limpar a casa em menos de 15 minutos."
- Fone com cancelamento de ruido: "O acessorio que mudou meu jeito de trabalhar em casa."

## Inventario apos sincronizacao

- Total de produtos no catalogo: 2.827
- InfoStore: 1.462
- Amazon: 697
- Mercado Livre: 456
- Saldao da Informatica: 202
- Magalu: 8
- Shopee: 2

## Validacoes de busca

- `celular ate 1500`: retorna `dataMode real` e prioriza produto dentro do orcamento.
- `aspirador wap`: retorna WAP Aspirador, sem promover liquidificador por marca.
- `air fryer philco`: retorna Air Fryer Philco importada da Amazon.
- `casa ate 50`: pede refinamento e nao recomenda produto aleatorio.

## Correcoes de inteligencia

- Produtos de casa como aspirador, air fryer, mop, liquidificador, cafeteira e lavadora agora sao tratados como produtos principais quando a busca pede esse tipo de item.
- Busca generica de celular agora considera `celular` e `smartphone` como intencao de aparelho principal.
- Na ordenacao, produto que cabe no orcamento fica acima de item mais caro.
- Celulares obsoletos como 3G, 16GB e Android antigo sao rebaixados em buscas genericas de smartphone.

## Testes executados

- `node --test`: 180/180 aprovados.
- `node --check public/app.js`: OK.
- `node --check api/web.js`: OK.
- `node --check server.mjs`: OK.
- `node --check scripts/intake-amazon-bestsellers-page.mjs`: OK.
- `node --check scripts/sync-partner-offers-to-catalog.mjs`: OK.
- `node --check src/catalog/ProductIntelligenceEngine.js`: OK.
- `node --check src/providers/VerifiedAffiliateOfferProvider.js`: OK.
