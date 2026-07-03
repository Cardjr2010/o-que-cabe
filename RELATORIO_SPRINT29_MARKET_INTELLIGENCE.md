# RELATORIO SPRINT 29 - MARKET INTELLIGENCE

## O que foi entregue

Foi adicionada uma camada de inteligência de mercado em cima do catálogo real do OQC, sem mexer na home, nos motores financeiros, na seed ou na lógica de recomendação existente.

### Novo endpoint

- `GET /api/market/stats`

### Nova camada de dados

- `src/catalog/MarketIntelligenceEngine.js`

### Integração com a busca

- Os produtos retornados pela busca agora carregam um bloco `market` com:
  - preço atual
  - menor preço registrado
  - maior preço registrado
  - tendência
  - promoção real detectada
  - indicador de preço
  - conselho de compra
  - estrutura preparada para alertas futuros

## Base analisada

- Produtos publicados: **15.999**
- Produtos com histórico de preço: **19**
- Promoções reais detectadas: **14**

## Como a inteligência funciona

### Histórico de preços

Cada produto passa a expor:

- menor preço
- maior preço
- preço atual
- última coleta

### Indicador de preço

Classificação aplicada:

- `Excelente preço`
- `Preço normal`
- `Preço alto`

### Promoção verdadeira

Uma promoção só é considerada real quando o preço atual fica abaixo do preço anterior registrado no próprio histórico.

### Tendência

- `Preço subindo`
- `Preço estável`
- `Preço caindo`

### Conselho ao usuário

- `Vale comprar hoje.`
- `Pode valer esperar alguns dias.`
- `Sem histórico suficiente. Vale acompanhar.`

### Alertas futuros

A arquitetura já fica preparada para o futuro:

- `Avise-me quando chegar a R$ XXX.`

Sem envio de alerta nesta sprint.

## Dashboard interno

O endpoint `/api/market/stats` devolve:

- produtos monitorados
- produtos com histórico
- cobertura de histórico
- promoções reais
- maiores quedas
- maiores altas
- categorias mais baratas
- estrutura de alerta futura

## Números observados em produção local

- `monitoredProducts`: **15.999**
- `productsWithHistory`: **19**
- `historyCoverage`: **0,1187%**
- `realPromotions`: **14**

## Exemplos observados

### Maiores quedas

- produto com queda real acima de 90% detectada no catálogo histórico
- categorias com descontos muito fortes aparecem no topo do ranking de mercado

### Maiores altas

- produtos com histórico apontando subida real de preço aparecem separados das promoções

## Testes executados

- `node --test`
- `node --check api/web.js`
- `node --check public/app.js`
- `node --check server.mjs`

## Resultado da validação

Todos os testes passaram, e o endpoint de mercado passou a responder com estatísticas reais do catálogo.

## Próximo passo natural

Ampliar a cobertura de histórico de preços para mais produtos, porque hoje a base já sustenta a lógica, mas ainda há pouca amostra com histórico efetivo.
