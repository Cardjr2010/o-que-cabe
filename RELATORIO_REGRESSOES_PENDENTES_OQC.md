## Relatório de regressões pendentes OQC

Data: 23/07/2026

### Escopo auditado

- Domínio público em `e8d16dc413b7955abc7ffd9bfdda422cfc5e107d`
- Home pública
- `/api/home-data`
- buscas críticas de catálogo vivo

### Problemas reais encontrados

1. A home ainda expunha sinais derivados de catálogo velho:
   - atalhos/pechinchas antigos;
   - chips de fontes e marcas a partir de uma base desatualizada;
   - esses blocos ainda apareciam mesmo com `catalogFresh = false`.

2. A busca estrita de produto comercial ainda aceitava matches frouxos:
   - consulta `iphone 17 pro max 256gb`;
   - produto antigo como `iPhone 7` podia entrar por coincidência textual.

### Causa raiz

1. `src/runtime/home-data.js`
   - a API já sabia que o catálogo não estava fresco;
   - mesmo assim continuava retornando atalhos, fontes e marcas derivadas desse estado.

2. `src/search/SearchOrchestrator.js`
   - o contador de hits usava substring simples;
   - token curto como `pro` batia em palavras irrelevantes e inflava o match.

### Correções aplicadas

1. Home stale-safe
   - quando `catalogFresh = false`, a home agora oculta:
     - `shortcuts`;
     - `pechinchas`;
     - `activeSources`;
     - `topSources`;
     - `brandSummary`;
     - `topBrands`;
     - `marketplaceSummary`;
     - `sellerSummary`.

2. Busca com match mais estrito
   - o match de tokens passou a usar fronteira de palavra;
   - isso impede que `iphone 7` apareça em uma busca exata por `iphone 17 pro max 256gb`.

### Arquivos alterados

- `src/runtime/home-data.js`
- `src/search/SearchOrchestrator.js`
- `test/home-data.test.js`
- `test/search-orchestrator.test.js`

### Validação executada

Comandos:

```powershell
node --test
node --check public/app.js
node --check api/web.js
node --check server.mjs
node --check src/engines/RankingEngine.js
```

Resultado:

- `149/149` testes aprovados
- checks sintáticos aprovados

### Efeito esperado após publicação

1. A home pública deixa de mostrar sinais velhos de catálogo/cupom.
2. Produtos comerciais antigos e irrelevantes deixam de vazar em buscas estritas.
3. O domínio público fica mais honesto até a próxima revalidação real do catálogo.
