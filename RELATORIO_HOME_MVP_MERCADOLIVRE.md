# RELATORIO_HOME_MVP_MERCADOLIVRE

## O que foi ocultado na home
- seletor de origem
- blocos de Amazon como apoio principal
- escolhas de origem como Amazon, Magalu e Demo na interface pública

## O que foi mantido para o futuro
- adapters de Amazon e Magalu no código
- rotas de Mercado Livre manual e OAuth
- fallback demo por categoria
- estrutura visual dos cards e categorias

## Como testar os modos

### Modo Orçamento Mensal
- produto: `tv`
- máximo por mês: `200`
- parcelas: `12`

### Modo Orçamento Total
- produto: `tv`
- orçamento total: `500`

### Outros exemplos
- `relogio` em modo total com `300`
- `celular` em modo mensal com `80` e `12x`

## Resultado da validação
- a home segue abrindo sem erro 500
- os endpoints de busca continuam respondendo
- a home agora fica focada no Mercado Livre no MVP
- os resultados continuam mostrando selo real/demo, preço, status e botão do Mercado Livre
