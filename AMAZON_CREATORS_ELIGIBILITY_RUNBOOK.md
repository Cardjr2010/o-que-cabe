# Amazon Creators API Eligibility Runbook

Data da auditoria: 19/07/2026

## Estado confirmado

- Provider real identificado no projeto: `amazon_creators_api`
- Autenticacao OAuth do client credentials: `HTTP 200`
- Endpoint de busca: `HTTP 403`
- Motivo retornado pela Amazon:
  - `reason: AssociateNotEligible`
  - `type: AccessDeniedException`
- Status operacional atual: `NAO`

## O que isso significa

As credenciais tecnicas da Amazon Creators API existem e o token pode ser obtido, mas a conta vinculada nao atende aos requisitos de elegibilidade do programa para executar buscas de catalogo.

Ou seja:

- `configured = true`
- `authenticated = true`
- `reachable = true`
- `eligible = false`
- `operational = false`

## O que o administrador precisa verificar

1. Conta Amazon Associados ativa e sem bloqueio.
2. Marketplace brasileiro correto:
   - `www.amazon.com.br`
3. Associate tag correta e vinculada ao mesmo cadastro.
4. Aplicativo / credenciais realmente ligadas a essa conta de Associados.
5. Acesso autorizado para Creators API no painel correspondente.
6. Eventual suspensao, revisao de conta ou perda de elegibilidade.
7. Requisitos minimos do programa de afiliados ainda atendidos.

## Sinais de que o bloqueio foi resolvido

Somente considerar Amazon operacional quando todos os itens abaixo acontecerem:

1. `node scripts/probe-amazon-api.mjs "iphone 17"` retornar `HTTP 200`.
2. A resposta trouxer produto real.
3. O produto vier com:
   - `asin`
   - `price`
   - `currency = BRL`
   - `image`
   - `url` direta
4. `/api/amazon/status` passar a mostrar:
   - `eligible = true`
   - `operational = true`

## Comando de prova apos regularizacao

```bash
node scripts/probe-amazon-api.mjs "iphone 17"
```

## Regra de operacao no OQC

Enquanto a Amazon continuar retornando `AssociateNotEligible`:

- a fonte nao deve ser tratada como operacional;
- a busca publica nao deve prometer ofertas reais da Amazon;
- o diagnostico deve preservar o motivo exato;
- o frontend nao deve exibir erro tecnico para o usuario final.
