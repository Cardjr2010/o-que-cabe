# RELATORIO_SPRINT27_HOME_CONSULTOR_DE_COMPRAS

## Objetivo
Transformar a home do OQC em um consultor de compras, com foco em intenções de compra, decisão financeira e catálogo real, sem destacar fonte específica.

## O que mudou
- O hero passou a comunicar o OQC como um assistente de decisão de compra.
- A home agora começa por intenções de compra, antes de departamentos.
- Entraram cards clicáveis para buscas por intenção, como celular, notebook, monitor gamer, TV, fone, presente, casa e flores.
- O bloco de como o OQC decide foi reescrito para explicar análise, comparação e decisão.
- O tom da home deixou de parecer vitrine de loja e passou a parecer consultoria de compra.
- O foco da base exibida continua no catálogo oficial, sem favorecer fornecedor.

## Dados oficiais preservados
- 16.740 produtos analisados
- 15.999 produtos publicados
- 741 ocultos por qualidade/fonte

## Resultados visuais da home
- A home deixa de começar por departamentos e passa a começar por intenção de compra.
- Os blocos de busca e decisão ficam mais claros e mais próximos de uma landing page de conversão.
- Departamentos continuam acessíveis, mas como apoio secundário à decisão.
- O texto da página enfatiza que o OQC compara diversas lojas e mostra a melhor compra dentro do orçamento.

## Validação técnica
- `node --test` passou com 118 testes aprovados.
- `node --check public/app.js` passou.
- `node --check api/web.js` passou.
- `node --check server.mjs` passou.
- `/api/home-data` local retornou os números oficiais e o foco da home como consultor de compras.

## Comportamento esperado agora
- O usuário entende rapidamente o que o OQC faz.
- A home responde pela intenção de compra, não pelo fornecedor.
- O catálogo real continua sendo a base da decisão.
- As recomendações permanecem orientadas por orçamento, qualidade e relevância.

## Observação
A validação desta sprint foi concluída com código, testes e resposta de API local. A captura visual nova pode ser gerada na próxima rodada se precisarmos registrar o antes/depois em PDF.
