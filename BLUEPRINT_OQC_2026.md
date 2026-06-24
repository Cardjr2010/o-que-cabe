# BLUEPRINT_OQC_2026

## Visão geral

### Fluxo principal
Usuário
↓
Frontend
↓
Motor OQC
↓
MercadoLivreConnector
↓
Mercado Livre
↓
Resposta

## Mapa de responsabilidades

| Arquivo / Módulo | Responsabilidade |
| --- | --- |
| `app.js` | Interface |
| `MotorOQC.js` | Ranking |
| `MercadoLivreConnector.js` | Integração Mercado Livre |
| `OAuthManager.js` | Tokens |
| `SearchEngine.js` | Busca |
| `ScoreEngine.js` | Pontuação |
| `BudgetEngine.js` | Mensal / Total |
| `CategoryResolver.js` | Categorias |
| `AffiliateManager.js` | Links afiliados |

## Responsabilidade de cada camada

### Frontend
- Nunca fala com Mercado Livre.
- Sempre fala com o Motor OQC.

### Motor OQC
- Nunca conhece OAuth.
- Nunca conhece HTTP.
- Só recebe produtos.
- Só devolve ranking.

### MercadoLivreConnector
- Único módulo autorizado a falar com Mercado Livre.

### OAuth
- Único módulo autorizado a manipular tokens.

## Motor OQC

### Módulos internos
- `BudgetEngine`
- `RankingEngine`
- `ScoreEngine`
- `RecommendationEngine`
- `CategoryEngine`
- `PriceHistory`
- `FutureNotification`

### Função do motor
- interpretar o orçamento;
- classificar;
- pontuar;
- recomendar;
- priorizar o que cabe.

## Banco OQC

### Estrutura base
- `Product`
- `PriceHistory`
- `Affiliate`
- `Marketplace`
- `Category`
- `Score`
- `Review`
- `Seller`

## Marketplaces futuros

Todos os marketplaces futuros devem seguir o mesmo padrão:

- Mercado Livre
- Amazon
- Magalu
- Casas Bahia
- Kabum
- Carrefour
- AliExpress

## Princípios

1. Nunca acessar marketplace diretamente.
2. Nunca colocar regra de negócio dentro do connector.
3. Nunca misturar UI com integração.
4. Nunca misturar ranking com OAuth.

## Roadmap

### Motor OQC 1.0
- ranking básico
- orçamento mensal e total
- resposta clara ao usuário

### Motor OQC 2.0
- OAuth completo
- busca autenticada
- itens reais
- permalinks confiáveis

### Histórico de preço
- guardar variação
- detectar tendência

### Alerta de queda
- notificar mudanças relevantes de preço

### IA de recomendação
- sugerir produtos com base no comportamento e no orçamento

### Comparador entre marketplaces
- mesma estrutura para várias fontes

### Afiliado automático
- monetização com saída rastreável

## Diagrama textual

Usuário
↓
Frontend
↓
Motor OQC
↓
BudgetEngine / ScoreEngine / RankingEngine / RecommendationEngine
↓
MercadoLivreConnector
↓
OAuthManager
↓
Marketplace API oficial
↓
Resposta normalizada
↓
Motor OQC
↓
Frontend

## Documento final

Este Blueprint passa a ser a referência oficial do projeto.

Nenhum módulo novo poderá ser criado sem estar compatível com este Blueprint.
