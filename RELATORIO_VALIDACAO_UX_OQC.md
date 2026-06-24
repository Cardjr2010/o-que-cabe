# RELATORIO_VALIDACAO_UX_OQC

Data da validacao: 2026-06-24

## Resumo executivo

O O Que Cabe ainda nao entrega uma experiencia clara o suficiente para um usuario comum. A ideia central e boa, mas o fluxo atual ainda tem inconsistencias entre a pagina, a API e a promessa do produto.

Se eu fosse um usuario comum, eu ainda confiaria apenas parcialmente no OQC para decidir uma compra. Eu confiaria na proposta, mas nao confiaria ainda no fluxo como decisor final porque o caminho da busca nao esta consistente em todos os cenarios.

## Cenarios simulados

### 1. Quero comprar um celular com orcamento total de R$ 1.500

- O usuario entenderia o que fazer? Parcialmente.
- Encontraria rapidamente a melhor opcao? Nao de forma confiavel.
- Entenderia por que foi recomendada? Sim, quando a recomendacao aparece.
- O botao levou para o destino correto? Nao consegui validar esse fluxo como consistente.
- Existe alguma etapa confusa? Sim. O modo total ainda responde com erro em algumas chamadas e nao fica claro para o usuario como concluir a busca.

### 2. Quero comprar uma TV pagando ate R$ 200 por mes

- O usuario entenderia o que fazer? Sim.
- Encontraria rapidamente a melhor opcao? Nao, porque a resposta ainda retorna produtos demo que nao correspondem ao termo pesquisado.
- Entenderia por que foi recomendada? Parcialmente.
- O botao levou para o destino correto? Nao foi validado como consistente no fluxo atual.
- Existe alguma etapa confusa? Sim. A busca traz produtos irrelevantes para a categoria.

### 3. Quero comprar um presente ate R$ 100

- O usuario entenderia o que fazer? Sim.
- Encontraria rapidamente a melhor opcao? Parcialmente.
- Entenderia por que foi recomendada? Sim, quando o ranking aparece.
- O botao levou para o destino correto? Nao validado de ponta a ponta aqui.
- Existe alguma etapa confusa? Sim. A pagina ainda mistura sinais de demo e de busca principal.

### 4. Quero comprar um notebook pagando ate R$ 250 por mes

- O usuario entenderia o que fazer? Sim.
- Encontraria rapidamente a melhor opcao? Parcialmente.
- Entenderia por que foi recomendada? Sim, mas a explicacao ainda pode ficar mais curta.
- O botao levou para o destino correto? Nao validado de ponta a ponta aqui.
- Existe alguma etapa confusa? Sim. O fluxo de busca ainda nao entrega a categoria de forma previsivel.

## Auditoria de UX

### Manter

- Titulo principal com a promessa do produto.
- Dois modos de orcamento.
- Exibicao de preco total e parcela estimada.
- Cards com imagem, status e score.

### Melhorar

- Simplificar o texto de apoio acima dos resultados.
- Deixar o bloco "Recomendacao OQC" mais curto e mais direto.
- Explicar em uma frase unica por que o item ficou em primeiro.
- Separar ainda mais o aviso de demo do conteudo principal.
- Tornar a diferenca entre modo mensal e modo total mais evidente.

### Remover

- Qualquer sobra de fluxo que ainda leve o usuario a produtos irrelevantes.
- Mensagens redundantes sobre pre-comparacao e confianca.
- Qualquer ambiguidade entre resultado real e demonstracao.

## Pontos que geram duvida

1. O modo total ainda nao parece confiavel no fluxo atual.
2. A resposta da API de busca ainda pode cair em demo com produtos de outra origem.
3. O usuario precisa entender mais rapidamente se a busca e real ou demonstrativa.
4. A recomendacao precisa ser explicada com menos texto tecnico.

## Tempo para decidir

Hoje o usuario ainda nao consegue fazer o ciclo completo em menos de 30 segundos com confianca consistente, porque:

- a intencao de busca nem sempre vira um resultado coerente;
- o modo total nao esta confiavel em todas as chamadas;
- o contexto visual e textual ainda tem sobreposicoes desnecessarias.

## Resposta objetiva

Se eu fosse um usuario comum, eu ainda confiaria no OQC com cautela, mas nao como fonte final de decisao em todos os cenarios.

Por que:

- a proposta e boa e faz sentido;
- a interface comunica a ideia principal;
- o ranking ajuda a entender a escolha;
- porem a busca ainda nao esta consistente o suficiente para todos os modos e categorias;
- isso reduz a confiança na recomendacao.

