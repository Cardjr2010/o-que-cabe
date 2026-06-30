# RELATORIO_FONTES_E_CATEGORIAS_OQC

Data da auditoria: 2026-06-30

Escopo desta sprint:
- mapear fontes, providers, importers e arquivos de catálogo já existentes;
- não importar novos produtos;
- não alterar motor, ranking ou UI.

## Resumo executivo

O catálogo real atual do OQC tem **829 produtos** no seed principal.

Distribuição real do catálogo:
- **709** itens vêm do fluxo **Mi Shop / CSV feed** (`sourceType: csv_feed`, `marketplace: mi_shop`).
- **120** itens vêm do seed manual/curado do **Mercado Livre** (`sourceType: seed`, `marketplace: Mercado Livre`).

Cobertura de qualidade do seed atual:
- **829/829** produtos com preço válido.
- **829/829** produtos com link válido (`productUrl`).
- **709/829** produtos com `affiliateUrl`.
- **828/829** produtos com imagem.
- **0** grupos de duplicidade detectados por `title|brand|model`.

## Fontes existentes no projeto

| Fonte | Status | Caminho | Tipo | Produtos | Link afiliado | Falta fazer |
|---|---|---|---|---:|---|---|
| Mi Shop | Ativa no catálogo real | `src/feed/providers/MiShopFeedProvider.js`, `src/feed/providers/CsvFeedProvider.js`, `src/feed/FeedProvider.js`, `data/products.seed.json` | CSV / feed genérico | 709 | Sim, em 709 itens | Refinar normalização de títulos em russo e separar melhor acessórios de categorias principais |
| Actionpay | Provider/importer pronto; sem produtos no seed principal | `src/providers/ActionpayProvider.js`, `src/importers/ActionpayYmlImporter.js`, `src/providers/ActionpayFeedProvider.js`, `data/actionpay-import-state.json` | YML / XML / API | 0 no seed principal; estado salvo indica 1 importação anterior | Sim, quando importado | Baixar/importar catálogo completo para o seed principal |
| Awin | Provider/importer pronto; sem produtos no seed principal | `src/providers/AwinFeedProvider.js` | CSV / JSONL / XML / JSON / manual | 0 no seed principal | Sim, quando importado | Configurar feed por anunciante e persistir importação no catálogo |
| Google Merchant | Adapter pronto; sem produtos no seed principal | `src/adapters/GoogleMerchantProductsAdapter.js` | API JSON | 0 no seed principal | Opcional | Configurar `GOOGLE_MERCHANT_ACCOUNT_ID` e `GOOGLE_MERCHANT_ACCESS_TOKEN` para importar |
| Mercado Livre real/seed | Ativa no catálogo real e no provider | `src/providers/MercadoLivreProvider.js`, `src/connectors/MercadoLivreConnector.js`, `data/products.seed.json`, `data/mercadolivre-links.json` | JSON / API / manual | 120 | Parcial, via `data/mercadolivre-links.json` | Manter como fonte secundária e continuar a separar real, seed e demo |
| Mercado Livre demo | Ativa no fallback da API | `data/mercadolivre-demo-products.json` | JSON manual | 16 | Não | Manter honesto e sem redirecionamento externo em demo |
| CSV manual | Ativo como entrada de importação | `src/importers/CsvProductImporter.js`, `src/importers/WooCommerceStyleImporter.js`, `src/importers/FeedImporter.js`, `scripts/import-products-csv.js`, `scripts/feed-cron.js`, `data/products.sample.csv`, `data/products.to-fill.csv` | CSV / manual | Template e staging; sem novos produtos nesta sprint | Sim, quando preenchido | Preencher preços e links reais antes de importar |
| Amazon demo legado | Arquivo legado / não entra no catálogo principal | `data/products.json`, `src/adapters/products.amazon.js` | JSON / stub | 0 no catálogo principal | Não | Decidir se o arquivo fica apenas como legado |
| Magalu | Stub sem catálogo ativo | `src/adapters/products.magalu.js` | Stub | 0 | Não | Implementar feed real quando houver fonte oficial definida |
| Indoleads / Indoleans | Não encontrado | Nenhum arquivo/provider localizado | — | 0 | — | Confirmar se haverá provider/fonte oficial no projeto |
| Posthaus standalone | Não encontrado como provider próprio | Nenhum provider próprio; aparece como anunciante Awin | — | 0 standalone | — | Se houver feed próprio, localizar URL/arquivo; hoje existe só como anunciante dentro da Awin |

## O que já entra no CatalogManager

Fontes que já têm caminho claro até o `CatalogManager`:
- `MiShopFeedProvider` e `CsvFeedProvider`
- `FeedImporter`
- `CsvProductImporter`
- `WooCommerceStyleImporter`
- `ActionpayYmlImporter`
- `ActionpayFeedProvider`
- `AwinFeedProvider`
- `GoogleMerchantProductsAdapter`
- `MercadoLivreProvider` / `MercadoLivreConnector`

Fontes/arquivos que existem, mas não estão alimentando o catálogo principal hoje:
- `data/products.json` (legado Amazon/demo)
- `data/mercadolivre-demo-products.json` (fallback demo)
- `data/mercadolivre-links.json` (manual link list, sem catálogo completo)

## Catálogo atual por marketplace / source

| Marketplace / source | Quantidade | Observação |
|---|---:|---|
| `mi_shop` | 709 | Base atual mais importante do catálogo real |
| `Mercado Livre` | 120 | Seed/manual curado atual |

## Catálogo atual por categoria

| Categoria | Quantidade | Fontes | Exemplos |
|---|---:|---|---|
| `outros` | 484 | Mi Shop | acessórios, itens diversos, suportes, peças e produtos que ainda precisam de melhor classificação |
| `celular` | 214 | Mi Shop + Mercado Livre seed | Samsung Galaxy A05, Samsung Galaxy A15, Xiaomi Redmi, Motorola Moto G |
| `tv` | 40 | Mi Shop + Mercado Livre seed | Samsung Smart TV 32, Samsung Crystal UHD 50, LG UHD AI ThinQ |
| `notebook` | 21 | Mi Shop + Mercado Livre seed | Lenovo IdeaPad 1, ASUS Vivobook 15, Acer Aspire 5 |
| `casa` | 20 | Mi Shop + Mercado Livre seed | air fryers, aspiradores e kits de organização |
| `presente` | 20 | Mercado Livre seed | kits, canecas e produtos de baixo ticket |
| `relogio` | 20 | Mi Shop | Samsung Galaxy Watch, Apple Watch, Amazfit |
| `monitor` | 9 | Mi Shop | monitores Xiaomi e variações |
| `tablet` | 1 | Mi Shop | item avulso de suporte/tablet; ainda insuficiente para virar categoria principal |

## Loja / seller

| Loja / seller | Quantidade | Categorias principais | Status |
|---|---:|---|---|
| `mi_shop` | 709 | celulares, monitores, acessórios, relógios, tablets, TVs, notebooks | Ativo no seed real |
| `Mercado Livre` | 120 | celulares, TVs, notebooks, casa, presentes, relógios | Seed manual ativo |

## Marcas com presença relevante no catálogo

| Marca | Quantidade | Observação |
|---|---:|---|
| Samsung | 22 | Forte em celulares e TVs |
| OQC | 21 | Itens curados / seed interno |
| Xiaomi | 6 | Presença muito forte em títulos Mi Shop, mesmo quando a marca não veio preenchida |
| Apple | 6 | Presença em relógios e acessórios |
| Lenovo | 5 | Notebooks |
| LG | 5 | TVs |
| Motorola | 4 | Celulares |
| ASUS | 4 | Notebooks |
| Amazfit | 4 | Relógios |
| Acer | 3 | Notebooks |
| TCL | 3 | TVs |

## Problemas de normalização detectados

### 1. Títulos em russo / caracteres mistos
- **707** produtos têm título em alfabeto cirílico.
- Isso aparece principalmente no feed da Mi Shop.
- Exemplo de itens:
  - `Модель автомобиля Xiaomi SU7 1/18 Ultra (Желтый)`
  - `Беспроводные открытые наушники Xiaomi OpenWear Stereo Pro (...)`
  - `Смарт-часы Xiaomi Watch S4 41mm (...)`

### 2. Categoria genérica dominante
- A categoria `outros` tem **484** itens.
- Muitos desses produtos são acessórios, peças ou itens de suporte que ainda não ganharam categoria melhor.

### 3. Marca e modelo vazios
- Em **707** itens a marca está vazia.
- O mesmo padrão se repete para vários itens Mi Shop.

### 4. Um item sem imagem
- Item sem imagem identificado:
  - `8522` — `Бампер защитный Red Line для Xiaomi Mi Watch Lite (тестовый)`

### 5. Possíveis acessórios aparecendo como produto principal
- Exemplos observados:
  - capas
  - películas
  - suportes
  - protetores
  - peças avulsas

### 6. Exemplos de classificação que merecem ajuste fino
- `Планшет REDMI Pad 2 Pro 5G ...` apareceu classificado como `celular`.
- `Монитор Xiaomi ...` aparece como `outros` em parte do catálogo e como `monitor` em outra parte.

## Proposta de categorias reais da home

Baseada apenas no catálogo atual, as categorias que têm massa suficiente para a home são:

1. Celulares
2. TVs
3. Notebooks
4. Relógios / Smartwatches
5. Casa
6. Presentes
7. Acessórios / Outros
8. Monitores

Categorias secundárias ou long tail:
- Tablets
- Kits
- Peças e suportes

Sugestão de filtros de marca dentro da home, com base na presença atual:
- Samsung
- Xiaomi
- Apple
- Motorola
- Lenovo
- LG
- ASUS
- Amazfit
- Acer
- TCL

## O que ainda falta ensinar o sistema a pegar

- **Actionpay YML**: hoje a estrutura está pronta; falta importar o catálogo completo da oferta alvo para o seed principal.
- **Awin Feed**: o provider está pronto; falta conectar um feed real de anunciante e persistir a importação no catálogo.
- **Google Merchant**: o adapter existe; falta configurar `GOOGLE_MERCHANT_ACCOUNT_ID` e `GOOGLE_MERCHANT_ACCESS_TOKEN`.
- **Posthaus**: hoje aparece só como anunciante dentro da Awin; não há provider/feed próprio encontrado.
- **Indoleads / Indoleans**: nenhum arquivo ou provider encontrado no projeto.
- **Mercado Livre**: manter como fonte secundária/controle, sem misturar demo com real.

## Observações finais

- O `CatalogManager` atual lê o seed real principal em `data/products.seed.json`.
- O catálogo principal já está preenchido e estável em quantidade.
- O próximo passo lógico não é importar mais algo às cegas, e sim decidir quais dessas fontes viram categorias, quais viram provedores reais e quais continuam como fallback ou legado.
