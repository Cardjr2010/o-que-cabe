# RELATORIO_ONDE_ESTAO_OS_PRODUTOS

Data da analise: 2026-07-02

## 1. Resumo do problema

O OQC tem duas bases de catalogo no repositorio:

- `data/products.seed.json` com **1.531** produtos
- `src/data/products.seed.json` com **16.740** produtos

A producao e o runtime atual estao lendo a base menor, e depois aplicando filtros adicionais no CatalogManager, no ProductIntelligenceEngine e no SearchOrchestrator.

## 2. Grão da analise

Unidade de analise: **produto catalogado**.

Fontes observadas:

- `data/products.seed.json`
- `src/data/products.seed.json`
- `data/saldao-feed.xml`
- `data/infostore-feed-3029.xml`
- `data/infostore-feed-3030.xml`
- `data/products.seed.json` usado pelo runtime atual

## 3. Inventario do pipeline

| Etapa | Produtos |
|---|---:|
| Seed master em `src/data/products.seed.json` | 16.740 |
| Seed selecionada pelo runtime em `data/products.seed.json` | 1.531 |
| CatalogManager `list()` visível | 708 |
| ProductIntelligenceEngine com departamento util | 576 |
| ProductIntelligenceEngine ainda em `Outros` | 132 |
| Home buttons | 6 |
| SEO hot searches | 6 |

## 4. Onde os produtos desaparecem

### Etapa A - escolha da seed

O runtime atual resolve o seed por esta ordem:

1. `src/data/products.seed.json`
2. `data/products.seed.json`
3. `public/data/products.seed.json`

Mas o caminho efetivamente usado no fluxo atual da API/home esta apontando para `data/products.seed.json`.

**Efeito:** o OQC nao esta usando o catalogo master de 16.740 itens na camada atual do runtime.

### Etapa B - filtro de fontes no CatalogManager

`CatalogManager.list()` remove as fontes:

- `mi_shop`
- `mercadolivre`

Na base `data/products.seed.json`, isso remove:

- `mi_shop`: 703
- `Mercado Livre`: 120

**Total removido nesta etapa:** 823

**Efeito:** de 1.531 produtos, sobram **708** visiveis.

### Etapa C - classificacao de inteligencia

No conjunto visivel de 708 produtos:

- **576** ganham departamento util
- **132** continuam em `Outros`

**Efeito:** o produto continua existindo, mas ainda nao vira opcao forte de home/categoria.

### Etapa D - home

A home usa `SEOIntelligenceEngine.buildHomeButtons()` com:

- limite de **6 botoes**
- filtro que ignora `Outros`, `Peças`, `Acessorios` e `Cabos e Carregadores`
- prioridade por volume SEO + contagem do catalogo

**Efeito:** a home exibe apenas 6 botões, mesmo com dezenas de categorias possiveis.

### Etapa E - busca

Nos testes locais, as buscas abaixo retornaram o mesmo volume de resultados:

- `celular`
- `notebook`
- `monitor`
- `tv`
- `flores`
- `ferramenta`

Resultado observado:

- `visibleMatches`: **516**
- `returned`: **516**

Além disso, `parseIntent()` nao detectou categoria/brand para essas buscas curtas.

**Efeito:** a busca nao esta usando bem a intençao para diferenciar categorias de entrada curta.

## 5. Filtros que removem ou escondem produtos

### Filtro 1 - fonte excluida

Remove:

- `mi_shop`
- `mercadolivre`

**Impacto:** 823 produtos removidos da base de 1.531.

### Filtro 2 - classificacao generica

Produtos com:

- departamento `Outros`
- categoria `Outros`

**Impacto atual:** 132 itens ainda entram como genericos mesmo depois da inteligencia.

### Filtro 3 - home buttons

Regras de home:

- minimo por categoria
- limite de 6 botoes
- exclui `Outros`, `Peças`, `Acessorios`, `Cabos e Carregadores`

**Impacto:** grande parte do catalogo nao vira atalho de home.

### Filtro 4 - busca

O SearchOrchestrator aplica:

- relevancia textual
- tipo principal vs acessorio
- categoria
- marca
- filtros de visibilidade

**Impacto:** a resposta final pode ficar bem menor que o catalogo visivel, especialmente para consultas amplas.

## 6. Produtos por origem

### Base usada pelo runtime atual: `data/products.seed.json`

- `saldao_informatica`: 592
- `infostore`: 115
- `awin`: 1
- `mi_shop`: 703
- `Mercado Livre`: 120

### Base master: `src/data/products.seed.json`

- `ccp`: 14.067
- `mi_shop`: 621
- `infostore`: 92
- `authentical`: 539
- `saldao_informatica`: 318
- `isabela_flores`: 234
- `flores_online`: 749
- `Mercado Livre`: 120

## 7. Produtos por departamento

### Runtime atual (`data/products.seed.json`)

1. Peças - 134
2. Monitores - 117
3. Celulares - 87
4. Notebooks - 73
5. Informática - 73
6. TVs - 50
7. Acessórios - 41
8. Fones - 24
9. Áudio - 20
10. Cabos e Carregadores - 12
11. Casa - 10
12. Tablets - 10
13. Ferramentas - 9
14. Construção - 7
15. Ferragens - 2
16. Relógios - 1

### Base master (`src/data/products.seed.json`)

1. Casa e Construção - 8.167
2. Outros - 5.097
3. Peças - 1.965
4. Acessórios - 589
5. Cabos e Carregadores - 295
6. Celulares - 180
7. Relógios - 156
8. TVs - 79
9. Monitores - 68
10. Notebooks - 66

## 8. Produtos por categoria

### Runtime atual (`data/products.seed.json`)

1. Celulares - 366
2. Acessórios - 212
3. Peças - 156
4. Monitores - 133
5. Cabos e Carregadores - 101
6. Notebooks - 91
7. Informática - 90
8. TVs - 82
9. Fones - 51
10. Outros - 38

### Base master (`src/data/products.seed.json`)

1. Outros - 4.464
2. Ferragens - 4.191
3. Ferramentas - 3.402
4. Peças - 1.965
5. Acessórios - 589
6. Casa - 404
7. Celulares - 347
8. Flores e Presentes - 327
9. Cabos e Carregadores - 295
10. Construção - 212

## 9. Produtos ocultos e publicados

### Runtime atual

- Publicados/visíveis no CatalogManager: **708**
- Ocultos por fonte excluida: **823**
- Ainda classificados como `Outros`: **132**

### Base master

- Total bruto: **16.740**
- Classificados com departamento util: **11.643**
- Ainda em `Outros`: **5.097**

## 10. Por que a Home mostra só uma parte

Nao é paginação.
Nao é limite de tela.

Os motivos sao:

1. a home usa a base visivel do runtime, nao o master de 16.740;
2. o CatalogManager exclui `mi_shop` e `mercadolivre`;
3. o ProductIntelligenceEngine ainda deixa 132 itens em `Outros`;
4. o SEOIntelligenceEngine mostra apenas 6 botões principais;
5. o SearchOrchestrator ainda nao converte bem buscas curtas de intenção em categoria.

## 11. Busca: comparacao entre existencia e retorno

### Testes executados

- `celular`
- `notebook`
- `monitor`
- `tv`
- `flores`
- `ferramenta`

### Resultado observado

- `visibleMatches`: 516
- `returned`: 516
- `parseIntent()` nao extraiu categoria/brand para as consultas curtas testadas

### Leitura pratica

A busca ainda nao esta explorando todo o catalogo de forma semantica suficiente.
Ela retorna uma fatia ampla e pouco seletiva para consultas curtas.

## 12. Causa raiz principal

A causa principal do desaparecimento dos produtos é a combinação de:

1. **seed runtime menor que a master**
2. **filtro de fontes no CatalogManager**
3. **classificacao ainda incompleta**
4. **home limitada a 6 botoes**
5. **busca com intençao ainda fraca para consultas curtas**

## 13. Como corrigir

### Correção estrutural

- alinhar o runtime para usar a seed master correta quando for a fonte oficial esperada;
- ou consolidar as seeds para uma unica fonte publica de verdade.

### Correção de catálogo

- reduzir `Outros`;
- criar departamentos e subcategorias adicionais para os itens que hoje ficam sem classificação.

### Correção de busca

- melhorar `parseIntent()` para consultas curtas;
- usar categoria/brand/atributos com mais precisão;
- evitar que consultas amplas retornem quase o mesmo conjunto.

### Correção de home

- manter os 6 botões, mas alimentar melhor a seleção com a inteligencia real do catálogo.

## 14. Conclusao

O OQC nao perdeu os produtos em um unico ponto.
Ele os perdeu em **quatro camadas diferentes**:

1. escolha da seed;
2. filtro de fontes;
3. classificacao generica;
4. limitacao de exibicao na home e busca.

O principal gargalo hoje nao é quantidade absoluta de produtos.
E a combinacao entre **qual seed o runtime carrega** e **como o catalogo é filtrado/classificado antes de chegar à home e à busca**.
