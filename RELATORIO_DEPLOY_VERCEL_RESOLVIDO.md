# RELATORIO_DEPLOY_VERCEL_RESOLVIDO.md

## Objetivo

Restaurar o deploy de producao do OQC na Vercel sem mexer em catalogo, motor, layout ou feeds.

## Deployment analisado

- Commit observado no painel: `84f050d`
- Mensagem: `Add minimal api health version marker`
- Status visivel no painel: `Preparar`
- Dominio ligado: `o-que-cabe.vercel.app`

## Causa raiz identificada

O runtime estava ficando dependente de uma resolucao de seed instavel e do empacotamento incompleto do catalogo:

1. O resolvedor de catalogo ainda podia cair em `src/data/products.seed.js`, um arquivo JS grande e desnecessario para producao.
2. A configuracao da Vercel incluia apenas `api/static/**`, deixando `data/**` fora do bundle serverless.
3. Com isso, o catalogo real nao ficava garantido no deploy e o health/catalogo em producao nao conseguiam refletir o JSON estavel.

## Correcao aplicada

- `src/runtime/catalog-path.js`
  - removi a prioridade para `src/data/products.seed.js`
  - mantive apenas caminhos JSON estaveis

- `src/importers/ProductImporter.js`
  - removi a copia de seed JS da lista canônica

- `api/web.js`
  - passei a reportar apenas o seed JSON real em `seedFileExists`
  - removi a dependencia de `src/data/products.seed.js` dos snapshots de health

- `vercel.json`
  - ampliei `functions.api/web.js.includeFiles` para incluir:
    - `api/static/**`
    - `data/**`
    - `public/**`

## Validacao local

### Health

- `/api/health`
  - `200`
  - `apiVersion: "health-minimal-001"`

### Catalog health

- `/api/catalog/health`
  - `200`
  - `seedFileExists: true`
  - `seedFileSize: 1118775`
  - `resolvedSeedPath: .../data/products.seed.json`
  - `sourceUsed: data/products.seed.json`
  - `catalogCount: 829`

### Search

- `/api/search?q=xiaomi&mode=total&totalBudget=1500`
  - `200`

## Validacao final em producao

Pendente de redeploy apos a correcao acima.

## Observacao

Nao foi possivel extrair o stack trace completo do painel da Vercel nesta sessao. A correcao foi guiada pela evidencia local e pela discrepancia do catalogo em producao.

