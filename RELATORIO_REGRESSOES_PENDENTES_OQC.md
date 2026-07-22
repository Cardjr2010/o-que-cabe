# RELATORIO_REGRESSOES_PENDENTES_OQC

## Escopo

Auditoria e correção das regressões restantes após a produção em `e295d0d9dd959a25bb57e6f19c5e8222415c88b7`, sem reintroduzir:

- mojibake;
- três cards repetidos;
- orçamento presumido;
- links falsos.

## Falhas encontradas na suíte

Total inicial de falhas reais: `4`

### 1. `test/coupon-provider.test.js`

- Tipo: `expectativa antiga / teste sensível a data`
- Sintoma: cupom `VIPMELI` voltava `null`
- Causa: a campanha expira em `20/07/2026`, mas o teste rodava em `22/07/2026`
- Correção: o teste passou a informar `referenceDate` explícita, preservando o comportamento real de produção

### 2. `test/search-orchestrator.test.js`

- Tipo: `expectativa antiga / teste sensível a data`
- Sintoma: a busca do iPhone 17 Pro Max não recebia mais o cupom `VIPMELI`
- Causa: mesma dependência temporal da campanha expirada
- Correção: o `SearchOrchestrator` passou a aceitar `referenceDate` em busca de teste; o teste agora fixa a data da campanha ativa

### 3. `test/verified-affiliate-offer-provider.test.js`

- Tipo: `fixture desatualizada / teste sensível a data`
- Sintoma: a oferta considerada “ativa” já estava vencida em `22/07/2026`
- Causa: `visibleUntil` da fixture terminava em `21/07/2026`
- Correção: `VerifiedAffiliateOfferProvider.searchProducts()` passou a aceitar `referenceDate`; o teste agora usa uma data dentro da janela válida

### 4. `test/production-coherence.test.js`

- Tipo: `falha de código / espelhamento estático`
- Sintoma: divergência entre `index.html`, `public/index.html` e `api/static/index.html`
- Causa: o HTML raiz estava em versão diferente do HTML público canônico
- Correção: espelhamento do HTML canônico para os arquivos exigidos pelo deploy

## Arquivos ajustados

- `C:\Users\cardj\Documents\Codex\2026-06-10\files-mentioned-by-the-user-plano\work\cabe-no-bolso-site\src\pricing\CouponProvider.js`
- `C:\Users\cardj\Documents\Codex\2026-06-10\files-mentioned-by-the-user-plano\work\cabe-no-bolso-site\src\providers\VerifiedAffiliateOfferProvider.js`
- `C:\Users\cardj\Documents\Codex\2026-06-10\files-mentioned-by-the-user-plano\work\cabe-no-bolso-site\src\search\SearchOrchestrator.js`
- `C:\Users\cardj\Documents\Codex\2026-06-10\files-mentioned-by-the-user-plano\work\cabe-no-bolso-site\test\coupon-provider.test.js`
- `C:\Users\cardj\Documents\Codex\2026-06-10\files-mentioned-by-the-user-plano\work\cabe-no-bolso-site\test\search-orchestrator.test.js`
- `C:\Users\cardj\Documents\Codex\2026-06-10\files-mentioned-by-the-user-plano\work\cabe-no-bolso-site\test\verified-affiliate-offer-provider.test.js`
- `C:\Users\cardj\Documents\Codex\2026-06-10\files-mentioned-by-the-user-plano\work\cabe-no-bolso-site\index.html`

## Garantias preservadas

- cupom não verificado não altera preço principal;
- campanha expirada não é aplicada em produção;
- desconto não gera preço negativo;
- campos ausentes não quebram ranking;
- os HTMLs exigidos pelo deploy permanecem espelhados;
- nenhuma correção reintroduziu orçamento presumido, links falsos ou textos quebrados.

## Validação executada

Node usado:

`C:\Users\cardj\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`

Comandos:

```powershell
& 'C:\Users\cardj\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test
& 'C:\Users\cardj\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --check public\app.js
& 'C:\Users\cardj\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --check api\web.js
& 'C:\Users\cardj\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --check server.mjs
& 'C:\Users\cardj\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --check src\engines\RankingEngine.js
```

Resultado final:

- suíte: `156/156` verde
- `public/app.js`: OK
- `api/web.js`: OK
- `server.mjs`: OK
- `src/engines/RankingEngine.js`: OK

## Prova de produção disponível no momento da auditoria

Consulta pública executada em `22/07/2026`:

`GET https://o-que-cabe.vercel.app/api/health`

Resposta:

```json
{
  "ok": true,
  "buildCommit": "e295d0d9dd959a25bb57e6f19c5e8222415c88b7",
  "buildTime": "2026-07-22T14:27:11.833Z",
  "apiVersion": "health-minimal-002"
}
```

Leitura objetiva:

- a produção pública consultada ainda está em `e295d0d`;
- as correções desta auditoria estão prontas localmente;
- a validação de domínio público destas correções depende do deploy do novo commit.

## Conclusão

As regressões pendentes foram reduzidas a zero na suíte local.

Classificação final das causas:

- falha de código: `1`
- teste desatualizado / expectativa antiga: `2`
- fixture inválida por data: `1`
- problema de ambiente: `0`

Status local:

- suíte completa verde: `SIM`
- relatório concluído: `SIM`
- produção pública no commit novo: `NÃO`, ainda pendente de deploy
