# RELATORIO_CORRECAO_FUNCIONAL_MVP

## O que foi corrigido
- O botão dos cards agora usa link de anúncio real quando disponível.
- Quando não há link válido, o botão vira `Link indisponível` em vez de abrir a home do Mercado Livre.
- O modo `Orçamento Total` passou a usar somente o valor digitado em `totalBudget`.
- O modo `Orçamento Mensal` continua calculando `monthly x months`.
- As imagens quebradas agora caem para o placeholder OQC.
- O visual principal da interface foi puxado para o azul OQC.

## Link do produto
- Regra aplicada: `affiliateUrl || productUrl || permalink`
- Para demos com link genérico, o sistema converte para busca específica no Mercado Livre.

## Ajustes visuais
- Azul principal aplicado na UI.
- Verde ficou restrito ao status de sucesso.
- Botões desabilitados receberam estado visual próprio.

## Testes realizados
### Modo mensal
- `tv` com `R$ 200` e `12x`
- Resultado calculou teto total correto

### Modo total
- `tv` com `R$ 500`
- `celular` com `R$ 600`
- `relogio` com `R$ 300`
- Resultado respeitou o valor digitado em `totalBudget`

### Links
- Os produtos demo retornaram URLs específicas do tipo busca no Mercado Livre.

## Observação
- A estrutura futura de afiliado e outras fontes foi mantida.
- O foco aqui foi estabilizar o MVP antes da próxima etapa.
