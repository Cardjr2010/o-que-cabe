# ARQUITETURA_FINAL_OQC_2026

## 1. Visão do produto
O O Que Cabe não é um marketplace, não é um Buscapé e não é uma vitrine. O O Que Cabe é um motor de decisão de compra.

A função do sistema é responder, com clareza:

> "Qual é o melhor produto que cabe no orçamento do usuário?"

## 2. Papel do Mercado Livre
Mercado Livre não é o produto. Mercado Livre é apenas:

- fonte de anúncios
- fonte de preços
- destino do clique

O produto de verdade é o algoritmo OQC.

## 3. Decisão sobre a API
A busca pública do Mercado Livre retorna `403` neste contexto de projeto.

Portanto, o caminho recomendado e oficial para a integração deve ser:

- OAuth
- recursos oficiais permitidos
- catálogo
- permalink

Não insistir mais em endpoints públicos bloqueados como base principal do MVP.

## 4. Arquitetura definitiva

Usuário
↓
Produto
↓
Modo
↓
Mensal ou Total
↓
Motor OQC
↓
Ranking inteligente
↓
Mercado Livre
↓
Compra

## 5. Motor OQC
O motor OQC deve evoluir para considerar:

- preço
- parcela
- frete
- reputação do vendedor
- entrega
- garantia
- avaliações
- quantidade vendida
- marca
- popularidade
- disponibilidade
- pontuação própria OQC

## 6. MVP
O MVP deve conter apenas:

- Mercado Livre
- busca
- mensal
- total
- ranking
- botão

Nada além disso.

## 7. Futuro
Somente depois do MVP, avaliar:

- Amazon
- Magalu
- Casas Bahia
- Kabum
- Carrefour
- AliExpress

## 8. O que abandonar
Abandonar de forma definitiva:

- busca pública bloqueada
- produtos demo irreais
- links genéricos
- mistura Amazon/Mercado Livre

## 9. O que implementar
Prioridade do projeto:

1. OAuth Mercado Livre
2. Busca autenticada
3. Ranking OQC
4. Afiliado

## 10. Diferencial
Por que alguém usaria o O Que Cabe em vez de abrir o Mercado Livre?

Porque o O Que Cabe não tenta ser só uma vitrine.
Ele ajuda a escolher.

O valor do sistema está em:

- classificar
- comparar
- filtrar
- priorizar
- explicar o que cabe e o que não cabe

O Mercado Livre mostra opções.
O O Que Cabe decide quais opções merecem atenção.

## 11. Roadmap

### Versão 1
- Mercado Livre somente
- busca mensal
- busca total
- ranking básico
- botão de saída

### Versão 2
- OAuth completo
- busca autenticada
- permanência de token
- item real com permalink

### Versão 3
- ranking avançado OQC
- mais sinais de confiança
- frete
- reputação
- avaliações
- disponibilidade

### Versão 4
- novas fontes oficiais
- Amazon
- Magalu
- demais marketplaces

## 12. Documento final
Este documento passa a ser a arquitetura oficial do projeto.

Nenhuma implementação futura deve contrariar esta arquitetura sem justificativa técnica forte.

## 13. Decisão resumida
O O Que Cabe deve ser construído como um motor de decisão de compra baseado em fontes oficiais, começando por Mercado Livre com OAuth e recursos permitidos, e não como um agregador de vitrines com demo enganoso.
