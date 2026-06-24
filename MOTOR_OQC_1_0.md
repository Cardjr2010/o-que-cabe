# MOTOR_OQC_1_0

## Objetivo
O Motor OQC 1.0 decide qual produto fica em primeiro lugar dentro de um orçamento.

Ele não mostra vitrine.
Ele não faz integração.
Ele não cuida de OAuth.
Ele só compara, pondera e ranqueia.

## Pergunta central

> Como o OQC decide qual produto fica em primeiro lugar?

O Motor OQC responde isso somando sinais de valor e confiança, depois convertendo tudo em um score de 0 a 100.

O produto com maior score relevante, dentro da regra de orçamento, fica mais alto no ranking.

## Regra base

O Motor OQC 1.0 considera dois eixos principais:

1. **Cabe no orçamento**
2. **É a melhor opção dentro do que cabe**

Ou seja:

- primeiro ele elimina o que não atende o limite;
- depois ele ordena os que restam por qualidade percebida;
- quando necessário, também mostra opções `APERTADO` e `NÃO CABE`, mas sem mentir sobre a posição delas.

## Score OQC

O score final vai de **0 a 100**.

### Interpretação
- `90 a 100`: excelente para o orçamento
- `75 a 89`: muito bom
- `60 a 74`: aceitável
- `40 a 59`: fraco, mas ainda comparável
- `0 a 39`: ruim para a proposta do usuário

## Fatores de nota

### 1. Preço
**Peso sugerido:** 20

**O que mede**
- se o produto é barato ou caro dentro da faixa esperada

**Quando aumenta a nota**
- quando o preço está abaixo ou bem perto do teto
- quando oferece bom valor pela faixa do mercado

**Quando diminui a nota**
- quando está muito acima do teto
- quando tira o produto da disputa principal

### 2. Parcela
**Peso sugerido:** 15

**O que mede**
- a parcela estimada em relação ao orçamento mensal

**Quando aumenta a nota**
- quando a parcela cabe folgadamente no valor mensal
- quando permite mais conforto financeiro

**Quando diminui a nota**
- quando passa do limite mensal
- quando vira `APERTADO` ou `NÃO CABE`

### 3. Frete
**Peso sugerido:** 10

**O que mede**
- impacto do custo de envio sobre o custo total

**Quando aumenta a nota**
- quando o frete é baixo
- quando o frete é grátis
- quando o frete não altera muito a decisão

**Quando diminui a nota**
- quando o frete encarece demais a compra
- quando o frete transforma um bom preço em mau negócio

### 4. Prazo
**Peso sugerido:** 8

**O que mede**
- o tempo para receber o produto

**Quando aumenta a nota**
- quando a entrega é rápida
- quando atende necessidade imediata

**Quando diminui a nota**
- quando o prazo é longo demais
- quando o atraso reduz a utilidade da oferta

### 5. Reputação do vendedor
**Peso sugerido:** 10

**O que mede**
- a confiança do vendedor

**Quando aumenta a nota**
- quando o vendedor é confiável
- quando a loja tem boa avaliação

**Quando diminui a nota**
- quando a reputação é baixa
- quando o vendedor inspira risco

### 6. Quantidade vendida
**Peso sugerido:** 8

**O que mede**
- prova social e tração do anúncio

**Quando aumenta a nota**
- quando há muitas vendas
- quando o produto tem aderência de mercado

**Quando diminui a nota**
- quando o anúncio parece fraco ou sem validação

### 7. Avaliações
**Peso sugerido:** 10

**O que mede**
- a nota média do produto e a qualidade percebida

**Quando aumenta a nota**
- quando as avaliações são altas e consistentes

**Quando diminui a nota**
- quando a nota média é baixa
- quando há muitos sinais de insatisfação

### 8. Garantia
**Peso sugerido:** 6

**O que mede**
- proteção da compra

**Quando aumenta a nota**
- quando existe garantia clara
- quando a cobertura é boa

**Quando diminui a nota**
- quando a garantia é fraca ou inexistente

### 9. Marca
**Peso sugerido:** 5

**O que mede**
- força e confiança da marca

**Quando aumenta a nota**
- quando a marca é reconhecida e estável

**Quando diminui a nota**
- quando a marca é desconhecida ou de baixa confiança

### 10. Disponibilidade
**Peso sugerido:** 4

**O que mede**
- se o produto está disponível agora

**Quando aumenta a nota**
- quando há estoque adequado

**Quando diminui a nota**
- quando há risco de ruptura
- quando o produto está fora de estoque

### 11. Histórico de preço
**Peso sugerido:** 4

**O que mede**
- se o preço atual está melhor que o comportamento recente

**Quando aumenta a nota**
- quando o preço caiu
- quando está em tendência positiva

**Quando diminui a nota**
- quando o preço subiu recentemente
- quando há instabilidade

### 12. Promoção
**Peso sugerido:** 2

**O que mede**
- descontos, campanhas e benefícios temporários

**Quando aumenta a nota**
- quando há promoção real

**Quando diminui a nota**
- quando o preço promocional é ilusório ou pouco relevante

## Pesos sugeridos

| Fator | Peso |
| --- | ---: |
| Preço | 20 |
| Parcela | 15 |
| Frete | 10 |
| Prazo | 8 |
| Reputação do vendedor | 10 |
| Quantidade vendida | 8 |
| Avaliações | 10 |
| Garantia | 6 |
| Marca | 5 |
| Disponibilidade | 4 |
| Histórico de preço | 4 |
| Promoção | 2 |

**Total:** 102

### Observação
O total passa de 100 porque o Motor OQC 1.0 não precisa usar pesos rígidos normalizados de início. O score final deve ser recalibrado para cair entre 0 e 100.

## Fórmula conceitual

O Motor OQC pode operar assim:

1. calcula cada subnota por fator;
2. multiplica pela importância do fator;
3. soma tudo;
4. normaliza para 0 a 100;
5. aplica bônus ou descontos de contexto;
6. ordena o ranking final.

## Decisões automáticas do Motor OQC 1.0

Ele seria capaz de decidir automaticamente:

- qual produto cabe melhor no orçamento mensal;
- qual produto cabe melhor no orçamento total;
- qual anúncio tem melhor relação custo-benefício;
- quais opções estão `CABE`, `APERTADO` ou `NÃO CABE`;
- quais produtos devem aparecer primeiro;
- quais devem ser escondidos ou rebaixados;
- quando um bom preço perde força por causa de frete, prazo ou reputação;
- quando um produto mais caro ainda vale mais a pena que um barato de baixa qualidade.

## Exemplo realista 1

### Cenário
Usuário tem **R$ 1.500**.
Existem **20 celulares**.

### Situação
- Celular A: R$ 1.399
  - parcela confortável
  - frete baixo
  - vendedor confiável
  - avaliações altas
  - boa disponibilidade

- Celular B: R$ 1.299
  - parcela boa
  - frete alto
  - vendedor médio
  - avaliações medianas
  - pouca disponibilidade

### Resultado
Mesmo sendo mais caro, o Celular A pode ficar acima do B se a soma de confiança e entrega compensar o preço.

**Por quê?**
- o OQC não olha só o menor preço;
- ele olha o melhor custo-benefício dentro do orçamento.

## Exemplo realista 2

### Cenário
Usuário tem **R$ 1.500**.
Dois celulares custam quase o mesmo.

- Celular X: R$ 1.450
- Celular Y: R$ 1.430

### Diferença decisiva
O Celular X tem:
- melhor avaliação
- mais vendidos
- garantia melhor
- entrega mais rápida

O Celular Y tem:
- reputação menor
- frete mais alto
- histórico de preço ruim

### Resultado
O Celular X pode ficar em primeiro lugar mesmo sendo mais caro.

## O que o Motor OQC 1.0 entrega

Se estivesse pronto hoje, o Motor OQC 1.0 seria capaz de:

- escolher automaticamente quais produtos mostram maior valor;
- ordenar produtos por compatibilidade com orçamento;
- separar candidatos bons de candidatos ruins;
- respeitar mensal e total;
- aplicar uma leitura mais humana do custo-benefício;
- mostrar ao usuário o que realmente merece atenção.

## Limite do Motor OQC 1.0

O Motor OQC 1.0 ainda não é IA completa de compras.

Ele é um motor de decisão estruturado, com sinais objetivos e ranking explicável.

## Decisão final
O primeiro lugar no OQC não pertence ao produto mais barato.
Pertence ao produto que melhor combina:

- preço
- confiança
- entrega
- utilidade
- aderência ao orçamento

Esse é o coração do O Que Cabe.
