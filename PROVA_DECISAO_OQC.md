# Prova de Decisão OQC

Data: 22/07/2026

## Casos validados

### 1. iPhone 17 Pro Max 256GB

- catálogo retornou `iPhone 7`
- match engine rejeitou como `wrongModel`
- resultado final: nenhuma oferta aceita

Conclusão: a camada não promove aparelho de geração errada.

### 2. TV Samsung 55

- catálogo retornava smartphone com `TV` no título
- match engine bloqueou por conflito de tipo
- resultado final: nenhuma oferta aceita

Conclusão: nome ambíguo não basta para virar decisão.

### 3. casa até 50

- parser marcou `refinementRequired`
- resultado final sem peça industrial

Conclusão: busca ampla gera refinamento, não pseudo-recomendação.

### 4. TV LG OLED

- catálogo tinha cobertura real
- 4 ofertas aceitas
- melhor oferta exibida com preço final

Conclusão: quando existe cobertura suficiente, a camada consegue formar decisão objetiva.

