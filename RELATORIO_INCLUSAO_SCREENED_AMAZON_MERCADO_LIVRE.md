# Relatorio de inclusao screened Amazon e Mercado Livre

Gerado em: 2026-07-31T22:01:57.811Z

Total aceito: 500

## Por parceiro

- amazon: 300
- mercado_livre: 200

## Por categoria

- celular: 99
- notebook: 102
- monitor: 36
- tv: 84
- audio: 78
- rede: 36
- tablet: 36
- casa: 12
- ferramenta: 17

## Diagnostico por alvo

- amazon / iphone: HTTP 200; recebidos 51; aceitos 18
- amazon / samsung galaxy: HTTP 200; recebidos 60; aceitos 18
- amazon / xiaomi smartphone: HTTP 200; recebidos 60; aceitos 18
- amazon / notebook i5 16gb: HTTP 200; recebidos 60; aceitos 18
- amazon / notebook lenovo: HTTP 200; recebidos 60; aceitos 18
- amazon / notebook gamer: HTTP 200; recebidos 60; aceitos 18
- amazon / monitor gamer 144hz: HTTP 200; recebidos 60; aceitos 18
- amazon / monitor gamer curvo: HTTP 200; recebidos 60; aceitos 18
- amazon / smart tv 55: HTTP 200; recebidos 60; aceitos 18
- amazon / tv samsung 50: HTTP 200; recebidos 60; aceitos 18
- amazon / fone bluetooth: HTTP 200; recebidos 60; aceitos 18
- amazon / headset gamer: HTTP 200; recebidos 60; aceitos 18
- amazon / roteador wifi 6: HTTP 200; recebidos 60; aceitos 18
- amazon / xiaomi be6500: HTTP 200; recebidos 48; aceitos 18
- amazon / tablet samsung: HTTP 200; recebidos 60; aceitos 18
- amazon / ipad: HTTP 200; recebidos 52; aceitos 18
- amazon / air fryer: HTTP 200; recebidos 60; aceitos 18
- amazon / aspirador wap: HTTP 200; recebidos 60; aceitos 18
- amazon / furadeira bosch: HTTP 200; recebidos 60; aceitos 18
- amazon / parafusadeira: HTTP 200; recebidos 60; aceitos 18
- mercado_livre / Celulares: HTTP 200; recebidos 45; aceitos 45
- mercado_livre / Notebooks: HTTP 200; recebidos 48; aceitos 48
- mercado_livre / Fones: HTTP 200; recebidos 42; aceitos 42
- mercado_livre / TVs: HTTP 200; recebidos 48; aceitos 48
- mercado_livre / Ferramentas: HTTP 200; recebidos 46; aceitos 17

## Observacao

Produtos Amazon e Mercado Livre foram coletados por screener publico e marcados como sourceType public_search_screener/public_offer_screener. Isso nao torna as APIs oficiais operacionais.

## Sincronizacao no catalogo OQC

Depois da coleta, os produtos rastreados foram sincronizados nos tres espelhos de seed usados pelo projeto:

- src/data/products.seed.json
- data/products.seed.json
- public/data/products.seed.json

Catalogo publicado apos a sincronizacao: 2.208 produtos.

### Produtos publicados por origem

- Info Store - Informatica: 1.462
- Amazon: 337
- Mercado Livre: 207
- Saldao da Informatica: 202

### Produtos publicados por categoria

- capa: 457
- acessorio: 260
- cabo: 241
- peca: 156
- notebook: 147
- outros: 118
- monitor: 118
- celular: 110
- casa: 95
- tv: 92
- carregador: 86
- audio: 78
- construcao: 63
- tablet: 48
- rede: 37
- ferramenta: 30
- relogio: 19
- pelicula: 15
- fone: 12
- achadinho: 7
- esporte: 5
- moda: 4
- ferragem: 3
- roteador: 3
- presente: 2
- camera: 1
- acessorios: 1

### Validacao executada

- node --test: 173/173 testes aprovados
- node --check api/web.js: OK
- node --check public/app.js: OK
- node --check server.mjs: OK
- node --check src/engines/RankingEngine.js: OK

### Prova rapida de busca local

- iphone: dataMode real, primeiro resultado da Amazon
- notebook: dataMode real, primeiro resultado do Mercado Livre
- tv: dataMode real, primeiro resultado do Mercado Livre
- monitor gamer: dataMode real, primeiro resultado da Info Store
- fone bluetooth: dataMode real, primeiro resultado da Amazon
- roteador: dataMode real, primeiro resultado da Amazon
- furadeira: dataMode real, primeiro resultado do Mercado Livre

### Ajuste publico de metricas

O endpoint de home-data agora expoe apenas contagem publicada por origem. Campos de bastidor como produtos ocultos por origem nao sao enviados em topSources.
