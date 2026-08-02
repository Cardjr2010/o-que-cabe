# Relatório — Refino Android TV em Categorias

Data: 2026-08-02

## Problema corrigido

- A página de categoria ainda parecia uma busca comum com formulário grande antes dos produtos.
- O card de decisão em mobile podia cortar título/preço quando o produto tinha nome longo.
- A navegação de categoria não passava sensação de prateleira fluida: havia excesso de leitura e blocos altos demais.
- O menu ainda usava abreviação `Deptos.`, com aparência de ajuste provisório.

## Decisão de UX

Android TV foi usado como referência porque o padrão resolve exatamente o problema do OQC:

- navegação por foco;
- cards grandes o suficiente para decisão rápida;
- poucas opções por tela;
- leitura curta;
- ação clara;
- detalhes sob demanda.

No OQC isso significa: a home apresenta, a categoria navega, e a página de resultado explica.

## Alterações feitas

- Ocultado o hero/formulário em páginas de categoria.
- Categoria agora começa direto com o título, filtros e trilha de produtos.
- Cards de decisão foram limitados em altura e título.
- Cards de produto em categoria ficaram mais slim no mobile.
- Informações longas e análises ficam fora da visualização principal.
- Menu de categoria compactado em mobile.
- `Deptos.` foi trocado por `Departamentos`.
- `public` e `api/static` foram sincronizados para evitar divergência de bundle.

## Evidência visual

Arquivo gerado:

- `evidencias/categoria-celulares-android-tv-polish-mobile-final.png`

Diagnóstico da captura:

- `heroVisible: false`
- `topbarHeight: 132`
- `titleTop: 163`
- `productCards: 8`
- `navOverflow: []`

## Testes

- `node --test`: 177/177 aprovados.
- `node --check public/app.js`: OK.
- `node --check api/web.js`: OK.
- `node --check server.mjs`: OK.
- `node --check src/search/SearchOrchestrator.js`: OK.

## Observação

Ofertas verificadas individuais estão com `fresh = 0` em 2026-08-02. Os testes foram atualizados para não exigir ofertas expiradas na home nem em fallback. Isso evita que cupom ou produto velho volte a aparecer só para satisfazer expectativa antiga.
