# RELATORIO_SPRINT28_INTELLIGENCE_ADVISOR

Sprint 28 consolidou o OQC como um advisor de compras com foco em explicacao, alternativas e comparacao de produtos reais.

## Resumo executivo

- Catalogo analisado: 16.740 produtos
- Produtos publicados: 15.999
- Produtos ocultos: 741
- Marcas identificadas: 206
- Categorias identificadas: 18
- Endpoint novo: `/api/catalog/stats`
- Busca agora entrega advisor com:
  - motivo da recomendacao
  - alternativas
  - comparativo simples

## Auditoria do catalogo por marca

| Marca | Total | Publicados | Ocultos | Principais | Acessorios | Preco min | Preco max | Fontes | Categorias |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| Apple | 9 | 3 | 6 | 2 | 1 | 605.82 | 949.04 | saldao_informatica, authentical | tablet, celular, outros |
| Samsung | 73 | 51 | 22 | 47 | 4 | 199.02 | 8007.95 | infostore, saldao_informatica | monitor, tv, peca, acessorio, celular |
| Motorola | 16 | 12 | 4 | 11 | 1 | 315.93 | 579.87 | saldao_informatica | celular, capa |
| Xiaomi | 466 | 0 | 466 | 0 | 0 | - | - | - | - |
| Lenovo | 56 | 50 | 6 | 34 | 16 | 39.00 | 8651.51 | saldao_informatica, infostore, authentical | cabo, peca, outros, acessorio, notebook |
| Dell | 6 | 4 | 2 | 3 | 1 | 369.02 | 4616.07 | saldao_informatica | notebook, monitor, peca |
| LG | 112 | 107 | 5 | 89 | 18 | 12.81 | 17185.94 | saldao_informatica, flores_online, authentical, ccp | monitor, celular, tv, fone, acessorio |
| TP-Link | 7 | 7 | 0 | 5 | 2 | 96.41 | 2911.95 | infostore | acessorio, outros, relogio |
| Intel | 129 | 128 | 1 | 81 | 47 | 421.69 | 11874.10 | saldao_informatica | notebook, tablet, peca, cabo, outros |
| AMD | 14 | 14 | 0 | 9 | 5 | 199.01 | 7199.01 | saldao_informatica | peca, capa, monitor, outros, acessorio |

## Auditoria por intencao

| Busca | Total encontrado | Principais | Acessorios | Primeiro resultado | Melhor custo-beneficio | Melhor dentro do orcamento |
|---|---:|---:|---:|---|---|---|
| iphone | 1 | 1 | 0 | iPhone 7 32GB Ouro Rosa | iPhone 7 32GB Ouro Rosa | iPhone 7 32GB Ouro Rosa |
| samsung | 47 | 47 | 0 | Smartphone Samsung Galaxy A10 - Vermelho - 32GB - RAM 2GB - Octa Core - 4G - 13MP - Tela 6.2" - Android 10 | Smartphone Samsung Galaxy A10 - Vermelho - 32GB - RAM 2GB - Octa Core - 4G - 13MP - Tela 6.2" - Android 10 | Smartphone Samsung Galaxy A10 - Vermelho - 32GB - RAM 2GB - Octa Core - 4G - 13MP - Tela 6.2" - Android 10 |
| galaxy | 21 | 21 | 0 | Smartphone Samsung Galaxy A10 - Vermelho - 32GB - RAM 2GB - Octa Core - 4G - 13MP - Tela 6.2" - Android 10 | Smartphone Samsung Galaxy A10 - Vermelho - 32GB - RAM 2GB - Octa Core - 4G - 13MP - Tela 6.2" - Android 10 | Smartphone Samsung Galaxy A10 - Vermelho - 32GB - RAM 2GB - Octa Core - 4G - 13MP - Tela 6.2" - Android 10 |
| xiaomi | 0 | 0 | 0 | - | - | - |
| motorola | 10 | 10 | 0 | Smartphone Motorola Moto C Plus XT1726 | Smartphone Motorola Moto C Plus XT1726 | Smartphone Motorola Moto C Plus XT1726 |
| notebook | 47 | 47 | 0 | Notebook 2 em 1 Acer Spin 3 SP313-51N-54V4 | Notebook 2 em 1 Acer Spin 3 SP313-51N-54V4 | Notebook 2 em 1 Acer Spin 3 SP313-51N-54V4 |
| monitor gamer | 30 | 30 | 0 | Monitor Gamer Acer Nitro KG272 | Monitor Gamer Acer Nitro KG272 | Monitor Gamer Acer Nitro KG272 |
| tv | 41 | 41 | 0 | Smart TV AOC LED 50" 4K Roku WiFi HDMI 50U7045/78G | Smart TV AOC LED 50" 4K Roku WiFi HDMI 50U7045/78G | Smart TV AOC LED 50" 4K Roku WiFi HDMI 50U7045/78G |
| flores | 50 | 50 | 0 | Buque de Flores com Rosas Vermelhas e Alstromerias Para Entrega | Buque de Flores com Rosas Vermelhas e Alstromerias Para Entrega | Buque de Flores com Rosas Vermelhas e Alstromerias Para Entrega |
| presente | 50 | 50 | 0 | Buque de 12 Rosas Vermelhas Para Entrega | Buque de 12 Rosas Vermelhas Para Entrega | Buque de 12 Rosas Vermelhas Para Entrega |

## Advisor entregue pela busca

Cada pesquisa agora devolve:

- `whyThisProduct`
- `alternatives`
- `comparison`
- `firstProduct`

Exemplos verificados:

- `iphone` -> 1 resultado real, com explicacao de cabimento e link valido
- `samsung` -> produtos reais Samsung/Galaxy priorizados
- `galaxy` -> resultados reais Samsung/Galaxy priorizados
- `notebook` -> notebook principal priorizado
- `flores` -> produto real com preco corrigido para valor monetario plausivel
- `tv` -> TV principal priorizada; controle remoto foi rebaixado

## Problemas de qualidade identificados e ajustados nesta sprint

1. `controle remoto` estava competindo com TVs reais na busca por `tv`.
2. Foi adicionada regra para tratar `controle remoto` / `remote control` / `remote` como acessorio.
3. A busca por `tv` agora prioriza TV principal acima do acessorio.
4. O advisor recebeu texto de resumo mais claro para evitar respostas vazias.

## Endpoint novo

`GET /api/catalog/stats`

Retorna:

- total de marcas
- total de categorias
- produtos publicados
- produtos ocultos
- produtos por fonte
- produtos por categoria
- top 20 marcas
- top 20 categorias
- top buscas

## Validacoes executadas

- `node --check api/web.js`
- `node --check public/app.js`
- `node --check server.mjs`
- `node --test`

## Resultado final

O OQC agora responde melhor a consultas com:

- explicacao do motivo
- alternativas inteligentes
- comparacao simples
- auditoria de catalogo por marcas e categorias

Isso deixa o sistema mais perto de um consultor de compras do que de um simples buscador.
