# Relatório de Correção do Catálogo Principal do OQC

## Resumo executivo

O OQC tinha duas seeds concorrendo no runtime:

- `src/data/products.seed.json` com **16.740** produtos brutos
- `data/products.seed.json` com **1.531** produtos brutos

Após a correção, o runtime passou a preferir a seed principal em `src/data/products.seed.json`, eliminando a ambiguidade de carregamento.

## Seed oficial escolhida

**Seed oficial do catálogo:** `src/data/products.seed.json`

**Motivo da escolha**

- maior cobertura real do catálogo;
- melhor base para Product Intelligence;
- contém o catálogo principal com fornecedores ativos;
- evita que a seed menor assuma o runtime por acidente.

## Comparação das duas seeds

| Seed | Total bruto | Publicados | Filtrados | Ocultos | Observação |
|---|---:|---:|---:|---:|---|
| `src/data/products.seed.json` | 16.740 | 15.999 | 741 | 741 | seed oficial |
| `data/products.seed.json` | 1.531 | 708 | 823 | 823 | seed menor, não oficial |

### Validade técnica

| Seed | Links válidos | Imagens válidas | Preços válidos | Duplicados por ID |
|---|---:|---:|---:|---:|
| `src/data/products.seed.json` | 16.740 | 16.740 | 16.740 | 0 |
| `data/products.seed.json` | 1.531 | 1.530 | 1.531 | 0 |

## Fontes removidas do catálogo publicado

O filtro atual continua ocultando estas fontes do catálogo publicado:

| Fonte | Quantidade | Motivo |
|---|---:|---|
| `mi_shop` | 621 | Fonte ocultada do catálogo publicado (Mi Shop / Mercado Livre). |
| `mercadolivre` | 120 | Fonte ocultada do catálogo publicado (Mi Shop / Mercado Livre). |

**Total filtrado:** 741

## Catálogo publicado após a correção

- **Total bruto do catálogo:** 16.740
- **Total publicado:** 15.999
- **Total oculto/filtrado:** 741

## Impacto no Product Intelligence

Com a seed principal carregada, o catálogo passa a ser analisado sobre a base maior.

### Destaques do catálogo publicado

| Departamento | Quantidade |
|---|---:|
| Casa e Construção | 8.164 |
| Outros | 4.873 |
| Peças | 1.947 |
| Acessórios | 434 |
| Cabos e Carregadores | 225 |
| Relógios | 118 |
| Celulares | 68 |
| Monitores | 59 |
| Notebooks | 48 |
| TVs | 41 |
| Áudio | 18 |

### Observação importante

Mesmo com a seed oficial, ainda existe um volume alto em **Outros**. Isso agora é um problema de classificação e não mais de carregamento da seed.

## Home

A home continua mostrando **6 botões principais por decisão de UX**, e não por limitação de catálogo.

### O que a home passa a expor

- `totalCatalogProducts`: **16.740**
- `totalPublishedProducts`: **15.999**
- `hiddenProducts`: **741**
- `topDepartments`
- `topCategories`
- `topSources`

### Botões principais retornados

- Monitores
- Relógios
- Celulares
- Notebooks
- TVs
- Tablets

## Busca

A busca agora consulta o catálogo publicado completo.

### Validação local

| Busca | HTTP | Resultados | Fonte principal | Observação |
|---|---:|---:|---|---|
| `celular` | 200 | 91 | Saldão da Informática | catálogo real |
| `notebook` | 200 | 47 | Saldão da Informática | catálogo real |
| `ferramenta` | 200 | 2.778 | catálogo real | catálogo real |
| `flores` | 200 | 802 | catálogo real | catálogo real |

### Primeiro resultado observado em `celular`

- produto real do Saldão da Informática
- `dataMode: real`
- link válido
- imagem válida
- score e explicação presentes

## `/api/catalog/health`

O endpoint passou a mostrar claramente:

- `seedUsed`: `src/data/products.seed.json`
- `seedCandidates`
- `rawCount`: **16.740**
- `publishedCount`: **15.999**
- `filteredCount`: **741**
- `hiddenProducts`: **741**
- `filterReasons`
- `sourceCounts`

## Conclusão

O problema principal era de **ambiguidade de seed**. O runtime estava deixando a seed menor vencer o carregamento.

Agora a seed oficial é a de `src/data/products.seed.json`, com **16.740 produtos brutos** e **15.999 publicados**.

O catálogo ficou consistente, a home passou a enxergar os números reais e a busca continua operando sobre a base completa publicada.

