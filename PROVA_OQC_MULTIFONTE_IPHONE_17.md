# Prova — OQC multifonte para iPhone 17

Data: 19/07/2026

## Produção auditada

- URL: `https://o-que-cabe.vercel.app`
- `/api/health`:
  - `buildCommit = 14a77db848d303533481e7648c3bec326a59bda6`

## Busca pública testada

- `/api/search?q=iphone%2017%20pro%20max&mode=total&totalBudget=10000`

## Resultado observado na produção

- `dataMode = real`
- o catálogo interno retornou:
  - `iPhone 7 32GB Ouro Rosa`
  - origem: `Saldão da Informática`
- `strategyUsed = catalog-search`
- `fallbackUsed = false`
- `fallbackAttempted = false`

## Leitura correta

Hoje o OQC ainda não está executando fallback multifonte real na produção para esse caso.

Motivos confirmados:

- Amazon em produção:
  - `configured = false`
  - sem provider operacional ativo no deployment atual
- Mercado Livre em produção:
  - `configured = true`
  - `authenticated = false`
  - `operational = false`

## Veredito atual

- Busca pública multifonte funcionando: **NÃO**

## O que já ficou pronto no código local

- provider da Amazon alinhado com o fluxo real `amazon_creators_api`;
- scripts de prova isolada para Amazon e Mercado Livre;
- endpoint de status mais honesto para distinguir:
  - configurado;
  - autenticado;
  - alcançável;
  - operacional.

## O que ainda bloqueia o SIM real

1. Amazon:
   - conta retorna `AssociateNotEligible`

2. Mercado Livre:
   - falta token OAuth real utilizável em produção

3. Produção:
   - precisa receber novo deployment com o provider atualizado e, junto dele, variáveis corretas da fonte que for realmente liberada.
