# RELATORIO_MOTOR_OQC_REAL_VS_DEMO

## Objetivo
- Separar com clareza resultados reais e resultados demo.
- Garantir que o botão do card diga exatamente o que vai abrir.

## Regra aplicada no botão
- `dataMode = real` e link válido:
  - botão: `Ver anúncio no Mercado Livre`
  - abre o `permalink` real do produto
- `dataMode = demo`:
  - botão: `Ver busca no Mercado Livre`
  - abre uma busca específica no Mercado Livre com o termo do produto
- Sem link válido:
  - botão: `Link indisponível`
  - desabilitado

## O que foi observado nos testes
### `motorola smartwatch` - total R$ 1500
- `dataMode`: demo
- motivo: a API real respondeu `403`
- retorno: 1 item demo
- primeiro produto: `Motorola Smartwatch`
- link: busca específica no Mercado Livre

### `smartwatch` - total R$ 1500
- `dataMode`: demo
- motivo: a API real respondeu `403`
- retorno: 1 item demo
- primeiro produto: `Motorola Smartwatch`
- link: busca específica no Mercado Livre

### `tv` - total R$ 500
- `dataMode`: demo
- motivo: a API real respondeu `403`
- retorno: 2 itens demo
- primeiro produto: `Samsung Crystal TV 50"`
- link: busca específica no Mercado Livre

### `celular` - total R$ 600
- `dataMode`: demo
- motivo: a API real respondeu `403`
- retorno: 7 itens demo
- primeiro produto: `Samsung Galaxy A05`
- link: busca específica no Mercado Livre

### `notebook` - mensal R$ 250 - 10x
- `dataMode`: demo
- motivo: a API real respondeu `403`
- retorno: 1 item demo
- primeiro produto: `Notebook Lenovo IdeaPad 3`
- link: busca específica no Mercado Livre

## Diagnóstico do fallback
- A busca real está sendo tentada primeiro.
- Quando o Mercado Livre responde `403`, o sistema cai para demo.
- No retorno de diagnóstico, isso aparece em:
  - `statusHttp: 502`
  - `error: Mercado Livre search HTTP 403`
  - `dataMode: demo`

## O que falta para usar anúncios reais sempre
- Resolver o bloqueio `403` da busca pública do Mercado Livre.
- Enquanto isso não acontecer, o motor continua útil com demo e busca específica.

## Comportamento do botão
- Nunca abre a home do Mercado Livre.
- Em demo, abre busca específica do termo.
- Em real, abre o anúncio retornado pela API.
