# Auditoria de Ofertas Verificadas — 23/07/2026

## Resumo

- O catálogo público estava exibindo referências manuais com `verifiedAt` de **19/07/2026**.
- As campanhas/cuponagem manual estavam com verificação de **20/07/2026**.
- Em **23/07/2026**, isso já está fora da janela de frescor definida no projeto.

## Campanhas

### Expiradas

- `PUSHFULLSU` — validade até **20/07/2026**
- `VIPMELI` — validade até **20/07/2026**

### Ainda dentro da validade nominal, mas velhas para exibição automática

- `CUPOMPRACASA` — validade até **26/07/2026**, porém `verifiedAt` em **20/07/2026**
- `MELIBARATO` — validade até **26/07/2026**, porém `verifiedAt` em **20/07/2026**

Conclusão: nenhuma campanha deveria continuar pública sem nova confirmação.

## Ofertas verificadas

### Amazon

- `verified-amazon-galaxy-s26-ultra-256gb`
  - HTTP: `200`
  - Resultado: acessível
  - Observação: página responde com título de produto válido

- `verified-amazon-iphone-17-pro-256gb`
  - HTTP: `200`
  - Resultado: acessível
  - Observação: página responde com título de produto válido

### Mercado Livre

- `verified-ml-galaxy-s26-ultra-256gb`
  - HTTP: `200`
  - Resultado: acessível tecnicamente
  - Observação: o título retornado foi genérico (`Mercado Libre`), então a disponibilidade real precisa de validação adicional por browser/API

- `verified-ml-iphone-17-pro-max-256gb`
  - HTTP: `200`
  - Resultado: acessível tecnicamente
  - Observação: o título retornado foi genérico (`Mercado Libre`), então a disponibilidade real precisa de validação adicional por browser/API

### Magalu

- `verified-magalu-galaxy-s26-ultra-512gb`
  - HTTP: `403`
  - Resultado: bloqueado
  - Observação: não deve ser tratado como oferta validada automática

- `verified-magalu-iphone-17-pro-max-256gb`
  - HTTP: `200`
  - Resultado: bloqueado por captcha
  - Observação: não deve ser tratado como oferta validada automática

## Decisão aplicada no código

Foi implementado:

- ocultar ofertas verificadas manuais fora da janela de frescor;
- ocultar campanhas/cuponagem manual envelhecida;
- parar de rotular a base antiga como se estivesse “atualizada”.

## Próximo passo recomendado

1. Revalidar manualmente as ofertas que ainda interessam.
2. Atualizar `verifiedAt` somente para links realmente confirmados hoje.
3. Rebaixar Magalu para fluxo manual/screener até ter uma rotina estável contra captcha/403.
4. Manter Amazon e Mercado Livre apenas quando houver confirmação recente.
