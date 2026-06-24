# RELATORIO VERCEL 500

## Causa raiz

A função serverless da Vercel estava importando o servidor completo do projeto. Esse servidor traz muita lógica de inicialização, leitura de arquivos e caminhos locais. Para o runtime da Vercel, isso aumentou o risco de empacotamento e de exportação inválida no módulo.

## Arquivo responsável

- `api/web.js`

## Correção aplicada

- substituí a função serverless por um handler direto e mínimo
- o handler agora exporta `default function handler(req, res)`
- a rota `/` retorna JSON simples:
  - `{"status":"ok","project":"O Que Cabe"}`
- `favicon.ico` e arquivos estáticos públicos continuam sendo atendidos quando existirem

## Testes realizados

- `node --check api/web.js`
- importação do módulo em Node
- chamada local para `/` retornando `200`

## Observação

Essa correção isola o erro de invocação da Vercel. Se a aplicação principal ainda precisar ser servida como site completo, isso deve ser feito em um segundo passo, depois que a função base estiver estável no deploy.

