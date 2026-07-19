# Relatório — Aprendizado da API Amazon Real

Data da auditoria: 19/07/2026

## Resumo executivo

- O projeto **não está configurado com RapidAPI Amazon** no ambiente local auditado.
- O projeto **já possui credenciais de Amazon Creators API** no `.env` local.
- A chamada de autenticação da Amazon **funciona**.
- A chamada de busca da Amazon **não retorna produtos** porque a própria conta recebe:
  - `HTTP 403`
  - `reason: AssociateNotEligible`
  - `type: AccessDeniedException`
- Portanto, hoje a Amazon está em estado:
  - `configured = SIM`
  - `authenticated = SIM`
  - `reachable = SIM`
  - `operational = NÃO`

## API real identificada

- Provider real encontrado no projeto: `amazon_creators_api`
- Fluxo de token:
  - `POST https://api.amazon.com/auth/o2/token`
- Fluxo de busca:
  - `POST https://creatorsapi.amazon/catalog/v1/searchItems`
- Marketplace configurado:
  - `www.amazon.com.br`

## Prova isolada

Consulta testada:

- `iphone 17`
- `iphone 17 pro max`

Resultado:

- Token:
  - `HTTP 200`
  - access token recebido com sucesso
- Busca:
  - `HTTP 403`
  - resposta:
    - `message: "Your account does not currently meet the eligibility requirements."`
    - `reason: "AssociateNotEligible"`
    - `type: "AccessDeniedException"`

## Conclusão prática

O bloqueio **não é de código de autenticação**.

O bloqueio atual é de **elegibilidade da conta Amazon Associates / Creators API** usada no projeto.

Enquanto essa elegibilidade não for resolvida no lado da conta, o OQC não conseguirá trazer produtos reais da Amazon ao frontend, mesmo com:

- client id válido;
- client secret válido;
- associate tag presente;
- marketplace Brasil configurado.

## O que foi ajustado no código

- O provider de Amazon passou a reconhecer o fluxo real do projeto.
- O status da Amazon agora pode distinguir:
  - configurado;
  - autenticado;
  - alcançável;
  - operacional.
- Foi criado script de prova isolada:
  - `scripts/probe-amazon-api.mjs`

## Próximo passo obrigatório fora do código

Resolver a elegibilidade da conta Amazon Creators API / Associates que está respondendo `AssociateNotEligible`.
