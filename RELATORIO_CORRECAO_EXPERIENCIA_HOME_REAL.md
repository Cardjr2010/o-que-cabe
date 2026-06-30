# Relatório de correção da experiência real da home OQC

## O que foi ajustado
- A home passou a carregar **categorias** e **pechinchas** a partir do catálogo real via `GET /api/home-data`.
- Os atalhos fixos da home foram removidos e substituídos por opções derivadas do catálogo.
- Os cards de produto agora usam um placeholder discreto quando a imagem real não existe.
- O botão de ação só fica ativo quando o produto é real e possui um link externo válido.
- Os resultados de busca foram separados em grupos:
  - `Melhores dentro do orçamento`
  - `Cabem apertado`
  - `Fora do orçamento`
- A origem exibida no card foi refinada para mostrar a loja/marketplace real quando disponível.

## Critérios validados localmente
- `node --check public/app.js` ✅
- `node --check api/web.js` ✅
- `node --check server.mjs` ✅
- `node --test` ✅ (92 testes aprovados)
- `GET /api/home-data` ✅ retornou catálogo real com 830 produtos, categorias derivadas e atalhos reais

## Resultado observado
- A lógica da interface agora diferencia melhor produtos que cabem, que cabem apertado e que ficam fora do orçamento.
- A home deixa de depender de botões fixos e passa a usar o catálogo real como fonte de atalhos.
- A experiência visual dos cards reais fica mais discreta quando falta imagem.
