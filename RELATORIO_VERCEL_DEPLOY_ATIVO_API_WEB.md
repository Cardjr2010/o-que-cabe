# RELATORIO_VERCEL_DEPLOY_ATIVO_API_WEB.md

## Objetivo

Descobrir se a Vercel estava rodando um deploy antigo, um deploy novo ainda não promovido, ou o código novo com outro erro de runtime.

## Commit local atual

- `84f050d`
- Mensagem: `Add minimal api health version marker`

## Commit anterior validado localmente

- `7b8f3a5`
- Mensagem: `Fix api web serverless runtime failure`

## Evidências observadas em produção

### Assets estáticos

- `/index.html` -> 200
- `/app.js` -> 200
- `/styles.css` -> 200

### Estado atual do domínio

Ao abrir a raiz pública `https://o-que-cabe.vercel.app/`, o conteúdo exibido ainda é a tela de fallback:

> "O site está iniciando em modo seguro. A interface completa será carregada assim que o arquivo principal estiver disponível."

Isso confirma que o domínio principal continua servido por uma versão que não está entregando a interface completa do OQC.

## Evidências do painel da Vercel

Com base nas capturas enviadas pelo usuário, o deployment ligado ao domínio principal mostra:

- commit `84f050d`
- mensagem: `Add minimal api health version marker`
- ambiente: `Production`
- status exibido no painel: `Preparar`
- domínio: `o-que-cabe.vercel.app`

O mesmo painel também mostra a seção de deploy da produção com a mensagem de falha de runtime ainda associada ao preview do deployment, reforçando que a implantação que está aparecendo para o domínio não está estável/ready.

### Função serverless

- `/` -> 500 `FUNCTION_INVOCATION_FAILED`
- `/api/health` -> 500 `FUNCTION_INVOCATION_FAILED`
- `/api/catalog/health` -> 500 `FUNCTION_INVOCATION_FAILED`
- `/api/search` -> 500 `FUNCTION_INVOCATION_FAILED`
- `/api/ml-connector-test` -> 500 `FUNCTION_INVOCATION_FAILED`

## Resultado da investigação

O hotfix local do `api/web.js` está funcional:

- a rota `/api/health` responde 200 localmente
- o payload mínimo traz:
  - `ok: true`
  - `buildCommit`
  - `buildTime`
  - `apiVersion: "health-minimal-001"`

Em produção, porém, o mesmo endpoint ainda retorna `500 FUNCTION_INVOCATION_FAILED` mesmo após o push.

## Interpretação mais provável

O domínio de produção ainda não está executando o build novo que contém o marcador mínimo.
Com os dados disponíveis nesta sessão, não foi possível confirmar pelo painel se o deployment ativo está apontando para:

- um deploy antigo;
- um deploy recém-pushed ainda não promovido;
- ou um deployment novo com runtime quebrando antes do handler.

O fato de o health mínimo funcionar localmente e continuar 500 em produção reforça que o deploy ativo ainda não refletiu o hotfix atual.

Além disso, a raiz pública segue exibindo a mensagem de "modo seguro", o que indica que a interface completa não está sendo servida pela versão ativa do domínio.

As capturas do painel sugerem que o deployment atualmente associado ao domínio principal é o próprio `84f050d`, mas ele ainda não está em estado `READY`; o status visível é `Preparar`, então o domínio pode estar preso a uma implantação que não terminou de ficar saudável.

## Stack trace

Não foi possível extrair o stack trace completo da UI da Vercel com as ferramentas disponíveis nesta sessão.

## Próximo passo recomendado

Abrir o painel da Vercel em:

- Deployments
- deployment ligado ao domínio
- Functions
- `api/web.js`
- Runtime Logs

E verificar:

- commit hash do deployment ativo;
- status do deployment;
- stack trace real do runtime.
