# RELATORIO_HOTFIX_QUALIDADE_BUSCA_PRECOS

## O que foi corrigido

- Corrigimos a normalização de preço para fontes de flores, evitando o erro de centavos virando reais.
- Mantivemos eletrônicos, notebooks e demais categorias com o preço original, sem dividir por 100.
- Reforçamos a relevância da busca para iPhone, Samsung e Galaxy, priorizando aparelho principal e rebaixando acessórios.

## Causa do erro de preço das flores

O problema vinha de feeds de flores que entregam preço em centavos como número inteiro.

Exemplo do caso:
- valor bruto: `16100`
- valor esperado: `R$ 161,00`

O ajuste aplicado em `normalizeImportedProduct()` identifica fontes de flores por marca, marketplace, seller e título, e converte apenas esses casos quando o valor chega como inteiro alto.

### Regra aplicada

- flores: `16100` -> `161`
- eletrônicos: `16100` -> `16100`

## Evidências de validação de preço

Teste direto do normalizador:

- `Buquê de Flores do Campo Amarelas e Laranjas`
  - entrada: `16100`
  - saída normalizada: `161`

- `Notebook Gamer`
  - entrada: `16100`
  - saída normalizada: `16100`

## Auditoria de busca: iPhone

Resultados verificados com o catálogo publicado:

- `iphone`
  - `dataMode`: `real`
  - resultados: `1`
  - top result: `iPhone 7 32GB Ouro Rosa`
  - marca: `Apple`
  - categoria: `celulares`
  - tipo: produto principal
  - marketplace: `saldao_informatica`

Conclusão:
- O catálogo atual tem um iPhone relevante, mas não há uma grande variedade de modelos iPhone publicados.
- A busca agora não deixa acessório ganhar de aparelho principal quando existe aparelho compatível.

## Auditoria de busca: Samsung / Galaxy

Resultados verificados com o catálogo publicado:

- `samsung`
  - `dataMode`: `real`
  - resultados: `47`
  - top result: `Smartphone Samsung Galaxy A10`
  - categoria: `celulares`
  - tipo: produto principal

- `galaxy`
  - `dataMode`: `real`
  - resultados: `21`
  - top result: `Smartphone Samsung Galaxy A10`
  - categoria: `celulares`
  - tipo: produto principal

- `galaxy a15`
  - `dataMode`: `real`
  - resultados: `21`
  - top result: `Smartphone Samsung Galaxy A10`

- `galaxy s24`
  - `dataMode`: `real`
  - resultados: `21`
  - top result: `Smartphone Samsung Galaxy A10`

### Observação importante

No catálogo publicado atual não encontramos modelos exatos como:
- Galaxy A15
- Galaxy A25
- Galaxy S23
- Galaxy S24
- Galaxy S25

Por isso a busca retorna o melhor Samsung/Galaxy principal disponível, sem cair em capa, película ou outro acessório.

## Auditoria de flores

Resultados verificados:

- `flores`
  - `dataMode`: `real`
  - resultados: `50`
  - top result: `Buquê de Flores com Rosas Vermelhas e Alstromérias Para Entrega`
  - marketplace: `flores_online`
  - preço: `250.38`

- `buque`
  - `dataMode`: `real`
  - resultados: `50`
  - top result: `Buquê de 10 Rosas Brancas Para Entrega`
  - marketplace: `flores_online`
  - preço: `208.56`

- `buquê de flores do campo amarelas e laranjas`
  - `dataMode`: `real`
  - resultados: `50`
  - top result: `Buquê de Flores do Campo Coloridas com Rosas e Margaridas`
  - marketplace: `flores_online`
  - preço: `198.9`

## Regras de relevância mantidas

- iPhone, Samsung e Galaxy priorizam aparelho principal antes de acessório.
- acessórios continuam rebaixados quando a consulta é ampla.
- a busca continua consultando catálogo real antes de cair em demo.

## Validações executadas

### Sintaxe

- `node --check src/importers/ProductImporter.js`
- `node --check src/search/SearchOrchestrator.js`
- `node --check src/catalog/ProductNormalizer.js`
- `node --check api/web.js`
- `node --check public/app.js`
- `node --check server.mjs`

### Testes

- `node --test`

Resultado:
- `122` testes aprovados
- `0` falhas

## Resultado final

O hotfix corrige o preço das flores sem mexer indevidamente em eletrônicos e melhora a qualidade da busca para iPhone e Samsung/Galaxy, com prioridade para produto principal e resultados reais.
