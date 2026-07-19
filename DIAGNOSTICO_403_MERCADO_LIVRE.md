# Diagnóstico — 403 do Mercado Livre

Data: 19/07/2026

## Estado encontrado

No ambiente auditado:

- `MELI_CLIENT_ID`: presente
- `MELI_CLIENT_SECRET`: presente
- `MELI_ACCESS_TOKEN`: ausente no `.env`
- `MELI_REFRESH_TOKEN`: ausente no `.env`

Arquivo local encontrado:

- `data/mercadolivre-oauth.json`

Situação desse arquivo:

- existe;
- contém tokens de teste/placeholder;
- não representa autenticação real utilizável em produção.

## Prova isolada

Consultas testadas:

- `iphone 17`
- `xiaomi be6500`

Resultado:

- `HTTP 403`
- `error = forbidden`
- `dataMode = demo`
- `returnedCount = 0`

## Leitura técnica correta

O Mercado Livre **não está operacional** hoje no ambiente auditado por dois motivos combinados:

1. não existe access token real carregado por variável de ambiente;
2. o arquivo OAuth local encontrado é placeholder, não autenticação válida.

## Estado honesto

- configurado: **SIM**  
  (há client id e client secret)

- autenticado: **NÃO em produção**  
  (`/api/ml/status` em produção retorna `authenticated: false`)

- autenticado localmente com token real: **NÃO**

- operacional: **NÃO**

## Conclusão

O erro 403 atual do Mercado Livre não deve ser tratado como “busca sem resultados”.

Ele indica ausência de autenticação real utilizável no ambiente.

## Próximo passo obrigatório

Fazer autenticação OAuth real do Mercado Livre e persistir:

- access token válido;
- refresh token válido;
- expiração;
- renovação segura.
