# Relatorio de Integracao Real ML Amazon

Data: 2026-07-19

## Objetivo

Auditar e endurecer o fluxo real de busca multifonte do OQC para Mercado Livre e Amazon, sem declarar nenhuma fonte como operacional sem prova chegando ao frontend.

## Fluxo real auditado

Frontend -> `/api/search` em `api/web.js` -> `SearchOrchestrator` em `src/search/SearchOrchestrator.js` -> catalogo interno -> decisao de fallback externo -> `MercadoLivreSearchProvider` / `AmazonRapidApiSearchProvider` -> normalizacao unica -> ranking -> resposta JSON para a interface.

Arquivos principais executados nesta tarefa:

- `C:\Users\cardj\Documents\Codex\2026-06-10\files-mentioned-by-the-user-plano\work\cabe-no-bolso-site\api\web.js`
- `C:\Users\cardj\Documents\Codex\2026-06-10\files-mentioned-by-the-user-plano\work\cabe-no-bolso-site\src\search\SearchOrchestrator.js`
- `C:\Users\cardj\Documents\Codex\2026-06-10\files-mentioned-by-the-user-plano\work\cabe-no-bolso-site\src\providers\MercadoLivreSearchProvider.js`
- `C:\Users\cardj\Documents\Codex\2026-06-10\files-mentioned-by-the-user-plano\work\cabe-no-bolso-site\src\providers\AmazonRapidApiSearchProvider.js`
- `C:\Users\cardj\Documents\Codex\2026-06-10\files-mentioned-by-the-user-plano\work\cabe-no-bolso-site\src\pricing\CouponProvider.js`

## O que foi corrigido

1. O SearchOrchestrator agora decide melhor quando buscar fora:
   - nao chama fonte externa a toa quando o catalogo interno ja esta forte;
   - abre fallback para buscas de modelo especifico ou cobertura insuficiente;
   - trata `casa ate 50` como intencao ampla e devolve refinamentos uteis, em vez de priorizar peca industrial.

2. O Mercado Livre agora tem refresh lock por processo:
   - apenas uma renovacao de token ocorre por vez;
   - chamadas simultaneas aguardam a mesma promessa;
   - evita corrida de refresh.

3. O diagnostico do Mercado Livre ficou conservador:
   - token presente nao significa mais `operational: true`;
   - `operational` so vira verdadeiro quando existir validacao real de busca com status 200;
   - `lastStatus` e `lastErrorType` agora ficam registrados.

4. A Amazon ganhou provider unico e auditavel:
   - `AmazonRapidApiSearchProvider` normaliza apenas resultado direto e rejeita URL generica;
   - sem chave valida, a fonte continua explicitamente desativada.

5. O preco final ganhou camada conservadora:
   - `CouponProvider` calcula `finalPrice`;
   - cupom so entra no preco principal quando estiver verificado;
   - cashback nao verificado nao derruba preco.

## Provas tecnicas locais

### Mercado Livre local

- Busca direta local por `iphone 17 pro max` retornou `403 forbidden`.
- Depois do hotfix, `/api/ml/status` local passou a registrar:
  - `authenticated: true`
  - `operational: false`
  - `lastStatus: 403`
  - `lastErrorType: auth_failed`

Isso mostra que o sistema deixou de confundir "token salvo" com "fonte funcionando".

### Amazon local

- `AmazonRapidApiSearchProvider.getDiagnostics()` retornou:
  - `configured: false`
  - `hasKey: false`

Sem chave valida, a Amazon nao foi declarada operacional.

## Provas de producao

Na producao atual (`https://o-que-cabe.vercel.app`) em 2026-07-19:

- `/api/health` -> `buildCommit: 78f6b6f0de6f03acfa728ab73964fe0b2128afb8`
- `/api/ml/status` -> `authenticated: false`, `operational: false`
- `/api/amazon/status` -> `configured: false`, `hasKey: false`

## Resultado objetivo

### Mercado Livre operacional

Nao.

Motivo comprovado:

- producao sem autenticacao valida;
- ambiente local com token de teste/placeholder retornando `403`;
- fallback ainda nao entrega item real do ML ao frontend publicado.

### Amazon operacional

Nao.

Motivo comprovado:

- provider escolhido: RapidAPI Amazon;
- producao sem chave configurada;
- nenhum produto Amazon real chegando ao frontend.

### Cupons operacionais

Nao, de forma externa/publica.

O motor de preco final foi preparado com contrato conservador, mas nao existe fonte verificada de cupom em producao para anunciar desconto real ao usuario.

## Estado atual honesto

- Parser melhorado: sim
- Fallback mais seguro: sim
- Diagnostico confiavel: sim
- Mercado Livre em producao: nao
- Amazon em producao: nao
- Cupom verificado em producao: nao

## Proximo passo obrigatorio para virar SIM

1. Mercado Livre:
   - autenticar de verdade no ambiente publicado;
   - confirmar busca com itemId e permalink reais em producao.

2. Amazon:
   - configurar `RAPIDAPI_AMAZON_KEY` valida;
   - testar retorno BR com link direto e ASIN real.

3. Depois disso:
   - publicar;
   - validar `iphone 17 pro max`, `xiaomi be6500`, `samsung galaxy`, `notebook i5 16gb`, `monitor gamer 144hz`.
