# RELATORIO_SPRINT25_PRODUCT_INTELLIGENCE_V2

Data da validacao: 2026-07-02

## Resumo executivo

A Sprint 25 deixou o OQC mais inteligente na classificacao do catalogo, com melhor separacao por departamento, categoria e intencao de busca.

## Escopo validado

- Nenhuma nova fonte foi adicionada.
- BudgetEngine, RiskEngine, DecisionEngine e a arquitetura da API foram preservados.
- O trabalho ficou concentrado em enriquecimento de catalogo, classificacao e inteligencia de home e busca.

## Auditoria do catalogo visivel

### Volume geral

- Total de produtos visiveis no catalogo atual: 708
- Produtos por fonte:
  - saldao_informatica: 592
  - infostore: 115
  - awin: 1

### Classificacao

- Produtos classificados com departamento util: 576
- Produtos ainda em classificacao generica: 132
- Produtos inicialmente em Outros antes do enriquecimento: 132
- Produtos ainda em Outros depois do enriquecimento: 38

### Top departamentos

1. Pecas - 134
2. Monitores - 117
3. Celulares - 87
4. Informatica - 73
5. Notebooks - 73
6. TVs - 50
7. Acessorios - 41
8. Audio - 24
9. Cabos e Carregadores - 12
10. Casa e Construcao - 28
11. Tablets - 10
12. Ferramentas - 9
13. Construcao - 7
14. Ferragens - 2
15. Relogios - 1

### Top categorias

1. Pecas - 134
2. Monitores - 117
3. Celulares - 87
4. Notebooks - 73
5. Informatica - 73
6. TVs - 50
7. Acessorios - 41
8. Outros - 38
9. Fones - 24
10. Audio - 20
11. Cabos e Carregadores - 12
12. Casa - 10
13. Tablets - 10
14. Ferramentas - 9
15. Construcao - 7
16. Ferragens - 2
17. Relogios - 1

### Top marcas

1. Acer - 230
2. LG - 115
3. Lenovo - 92
4. Samsung - 71
5. Positivo - 37
6. JBL - 32
7. Motorola - 21
8. Electrolux - 20
9. HP - 19
10. TP-Link - 11
11. Rhadium - 10
12. Dell - 6

## O que melhorou

- A classificacao por departamento ficou mais util para itens de informatica e audio.
- A home passou a priorizar 6 botoes reais e relevancia de departamento.
- As buscas de:
  - monitor gamer 144hz
  - monitor gamer curvo
  - notebook bom ate 2500
  - celular ate 1000 reais 128gb
  retornam dataMode real.
- O menu superior e as hot searches de SEO continuam publicados na home.

## Home e SEO Intelligence

- Menu superior validado.
- 6 botoes principais derivados de catalogo + SEO.
- seoHotSearches publicado com 6 itens.
- focusLabel mantido como Catalogo real.

## Pontos ainda pendentes

- Ainda existem 38 itens com classificacao generica.
- Pecas segue forte como categoria volumosa e merece tratamento adicional em uma iteracao futura.
- Parte dos itens de informatica e audio ainda pode ganhar subcategorias mais finas.

## Evidencia de execucao

- node --test passou com sucesso.
- home-data validado com menu, botoes e SEO.
- A base catalogada continua operando sem novas fontes.

## Conclusao

O OQC saiu de uma classificacao ruidosa e entrou em uma fase mais inteligente:

- mais produtos utilmente classificados;
- menos classificacao generica;
- home guiada por dados reais;
- e busca mais alinhada com a intencao do usuario.
