# AUDITORIA_API_MERCADOLIVRE_2026

## Objetivo
Descobrir o fluxo oficial do Mercado Livre para busca de produtos e validar se o O Que Cabe consegue trabalhar com dados reais.

## O que foi verificado

### 1. Endpoint público atual de busca
- Endpoint testado no projeto:
  - `https://api.mercadolibre.com/sites/MLB/search?q=celular`
- Resultado observado localmente:
  - `403 forbidden`
- Isso aconteceu:
  - no backend do projeto;
  - sem passar pela interface;
  - com `Accept` e `User-Agent` explícitos;
  - sem token OAuth salvo.

### 2. O que a documentação oficial mostra
- A documentação oficial do Mercado Livre em `developers.mercadolibre.com`/`developers.mercadolibre.com.ar` está disponível, mas várias páginas retornam `403` ao tentar abrir diretamente no navegador desta sessão.
- Mesmo assim, os resultados oficiais de pesquisa mostraram a área:
  - `What´s catalog?`
  - `Products search`
  - `Catalog required listings`
  - `Catalog listing`
  - `Catalog competition`
- Isso indica que o fluxo oficial atual está associado à área de catálogo/produtos, não a um scraping ou atalho não documentado.

### 3. OAuth oficial
As buscas oficiais de documentação retornaram um guia de autenticação/autorização do Mercado Libre que informa:
- o código de autorização é trocado por `access_token`;
- o `access_token` expira em cerca de `6 horas`;
- existe `refresh_token` para renovação.

## Respostas objetivas

### 1) Qual endpoint oficial deve ser usado?
- O projeto testou e recebeu `403` em:
  - `GET https://api.mercadolibre.com/sites/MLB/search?q=...`
- A documentação oficial pesquisável aponta a área `Products search` dentro de `Catalog`, mas a página detalhada não foi acessível diretamente nesta sessão.
- Conclusão:
  - o endpoint público atual de busca está bloqueado para este app/ambiente;
  - o caminho oficial mais provável hoje envolve OAuth e a área de catálogo/produtos.

### 2) O endpoint atual realmente está bloqueado?
- Sim.
- Evidência:
  - backend do projeto recebeu `403 forbidden`;
  - resposta veio de CloudFront/Mercado Livre, não do frontend;
  - body retornado:
    - `{"message":"forbidden","error":"forbidden","status":403,"cause":[]}`

### 3) O OAuth remove o 403?
- Não foi possível confirmar nesta sessão porque não existe token OAuth salvo em `data/mercadolivre-oauth.json`.
- O que foi confirmado pela documentação:
  - OAuth gera `access_token`;
  - `access_token` expira em aproximadamente `6 horas`;
  - `refresh_token` existe para renovação.
- Portanto:
  - a hipótese correta é que a busca real precisa ser testada autenticada;
  - sem token, o projeto cai para demo.

### 4) Existe outra API mais indicada?
- A documentação oficial pesquisável aponta a trilha:
  - `Catalog`
  - `Products search`
  - `Catalog required listings`
- Isso sugere que o fluxo de catálogo/produtos é a trilha oficial que deve ser priorizada.
- Não houve evidência nesta sessão de uma API pública alternativa simples que substitua a busca e evite OAuth.

### 5) Qual é o caminho definitivo para o O Que Cabe trabalhar somente com dados reais?
- Fazer o fluxo oficial de OAuth funcionar;
- obter `access_token` válido;
- testar a busca autenticada;
- se a busca autenticada continuar com `403`, usar apenas o fluxo oficial indicado pela documentação de catálogo/produtos e descartar a tentativa de busca pública direta.

## Diagnóstico do projeto

### O O Que Cabe consegue ou não buscar produtos reais do Mercado Livre?
- **Hoje, nesta sessão, não conseguimos confirmar busca real estável.**
- Motivo:
  - a busca pública responde `403`;
  - não há token OAuth salvo para validar a busca autenticada.

### Se sim, como?
- Seria via OAuth autenticado, com token válido, e chamadas ao endpoint oficial aceito pelo Mercado Livre para a área de busca/produtos.

### Se não, por quê?
- Porque o endpoint público atual está bloqueado para este app/ambiente;
- e a sessão não tinha token OAuth persistido para testar o caminho autenticado.

## Próximos passos recomendados
1. Validar o OAuth no ambiente de produção.
2. Salvar um `access_token` funcional na Vercel/variável segura.
3. Reexecutar a busca autenticada.
4. Se a busca autenticada ainda falhar, seguir a trilha oficial de catálogo/produtos indicada pela documentação.

## Fontes oficiais consultadas
- [Mercado Libre Developers](https://developers.mercadolibre.com/)
- [Documentação oficial pesquisável de Mercado Libre](https://developers.mercadolibre.com.ar/)

## Observação de cautela
- A inferência sobre “Products search” como trilha oficial é baseada nos trechos indexados da documentação oficial pesquisável, porque as páginas detalhadas retornaram `403` ao abrir nesta sessão.
