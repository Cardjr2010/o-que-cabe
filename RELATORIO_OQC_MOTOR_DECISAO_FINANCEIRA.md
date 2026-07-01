# Relatorio: OQC motor de decisao financeira com catalogo real

Data: 2026-07-01

## O que entrou nesta sprint
- `RiskEngine` para medir risco financeiro e simular a decisao de esperar.
- `ExplanationEngine` para explicar a recomendacao em linguagem humana.
- A resposta da API agora pode carregar risco e explicacao junto com score e ranking.
- A home permanece focada no Balcao de Informatica com atalhos reais do catalogo.

## Arquitetura aplicada
Feed / CSV / API
-> FeedProvider
-> ProductNormalizer
-> CatalogManager
-> BudgetEngine
-> RiskEngine
-> ScoreEngine
-> RankingEngine
-> ExplanationEngine
-> Home / API / Cards

## Regras de risco
- Verde: cabe com folga e usa ate 70% do orcamento.
- Amarelo: cabe, mas usa entre 70% e 95%.
- Vermelho: ultrapassa ou quase esgota o limite.

## Simulacao "e se eu esperar?"
- Calcula quanto o usuario juntaria no periodo do parcelamento.
- Mostra se a compra a vista vira viavel.
- Exibe a diferenca entre comprar agora e esperar.

## Catalogo real atual
- Total de produtos: 830
- Mi Shop: 709
- Mercado Livre: 120
- Awin: 1

### Categorias reais mais fortes
- Celular: 182
- Relogio: 63
- Tablet: 60
- Acessorio: 42
- TV: 38
- Fone: 30
- Notebook: 11
- Monitor: 9
- Carregador: 10
- Peca: 8
- Cabo: 8
- Pelicula: 6
- Capa: 2

## Resultado pratico
- Produtos principais ficam acima de acessorios quando a busca nao pede acessorio.
- Xiaomi, Redmi e POCO continuam como marca, nao categoria.
- A home e os atalhos sao derivados do catalogo real, nao de botao fixo.
