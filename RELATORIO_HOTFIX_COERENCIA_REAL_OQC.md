# RELATORIO HOTFIX - COERENCIA REAL OQC

## Escopo

Hotfix restrito à comunicação da home, estados públicos de busca e segurança dos diagnósticos de fontes. A seed oficial, os importadores, o BudgetEngine, o RiskEngine, o Advisor, o RankingEngine e o MarketIntelligenceEngine não foram alterados.

## Evidência da produção antes do hotfix

Auditoria realizada em `https://o-que-cabe.vercel.app` antes da correção:

- build ativo: `a61cf3014f2e76816d9f550d7bc956129feed785`;
- catálogo: 16.740 produtos brutos, 15.999 publicados e 741 filtrados;
- `/api/market/stats`: 15.999 monitorados, somente 19 com histórico e 14 promoções detectadas;
- `/api/ml/status`: inexistente (404);
- `/api/amazon/status`: inexistente (404);
- Blog e Minha Conta aparentavam ser links ativos, mas apontavam para blocos da própria home;
- a busca iniciava com produto e orçamento preenchidos;
- a home dizia “Hoje” sem usar um timestamp comprovável;
- departamentos e atalhos apareciam em blocos repetidos.

## Correções aplicadas

### Catálogo e atualização

- Hero: “Pesquisamos 15.999 produtos publicados em diferentes fontes.”
- Transparência: 16.740 analisados, 15.999 publicados e 741 ocultos por qualidade ou fonte.
- O quarto indicador usa `catalogUpdatedAt`, calculado a partir dos timestamps existentes nos produtos.
- Quando não há timestamp válido, a interface mostra somente “Catálogo ativo”.
- A data local comprovada pelo catálogo foi exibida como `01/07/2026 às 22:39`.

### Navegação e conteúdo

- Início e Departamentos permanecem navegáveis.
- Departamentos rola para `#departments`.
- Blog e Minha Conta são texto não navegável com o marcador “Em breve”.
- Foram removidos o bloco duplicado de departamentos, os painéis falsos de Blog/Conta e o bloco redundante “Atalhos reais”.
- A ordem pública ficou: hero, busca, transparência, intenções, decisões, departamentos, buscas em alta, funcionamento e rodapé.

### Orçamento e estados de busca

- Produto, orçamento mensal e orçamento total começam vazios.
- A área de resultados fica oculta até existir produto e orçamento declarados.
- Clicar em intenção ou departamento sem orçamento apenas preenche a intenção e leva o foco ao campo de orçamento.
- Busca sem oferta confirmada retorna `dataMode: none`, lista vazia e mensagem pública genérica.
- Produtos `demo` são filtrados da resposta pública de `/api/search` e da renderização da home.
- Falhas de fonte externa não exibem 403, token ou mensagem técnica ao usuário.

### Promessas e Market Intelligence

- Foi removida a promessa absoluta sobre juros, frete e reputação.
- O texto agora informa que frete, parcelamento e reputação são considerados somente quando a fonte fornece esses dados.
- Indicador e recomendação de mercado exigem histórico plausível.
- Com menos de dois registros, a interface mostra “Histórico de preço ainda insuficiente.”
- Classificação de preço e conselho de compra exigem pelo menos três registros.

### Cards

- Título limitado visualmente a três linhas.
- Origem legível preservada.
- Condição exibida quando disponível.
- Parcelamento real e estimado recebem rótulos diferentes.
- Link externo só aparece para URL direta válida.
- URL genérica do Mercado Livre é recusada.
- Sem link, o card mostra “Oferta indisponível” como estado não clicável.

## Segurança das fontes

- O repositório atual e o histórico Git foram pesquisados por `x-rapidapi-key`, `RAPIDAPI`, `RAPIDAPI_AMAZON_KEY` e padrões relacionados.
- Não foi encontrada uma chave RapidAPI gravada em código, relatório, commit ou `.env` versionado.
- `.env.example` contém apenas o nome vazio `RAPIDAPI_AMAZON_KEY=`.
- A chave mostrada fora do repositório, em captura/PDF, deve ser revogada no painel da RapidAPI e substituída antes de qualquer integração.
- `/api/amazon/status` informa configuração e presença da variável sem retornar seu valor.
- `/api/ml/status` informa somente estado operacional, sem token, client secret ou erro bruto.
- Testes usam segredos falsos e confirmam que nenhuma resposta contém `x-rapidapi-key`, `MELI_ACCESS_TOKEN`, `CLIENT_SECRET` ou os valores usados.
- Amazon permanece desativada: `configured: false`.
- Mercado Livre não é anunciado na interface como disponível; fallback indisponível gera apenas mensagem pública neutra.

## Validação local comprovada

| Rota/busca | HTTP | Resultado |
|---|---:|---|
| `/api/health` | 200 | OK |
| `/api/catalog/health` | 200 | 16.740 / 15.999 / 741 |
| `/api/home-data` | 200 | métricas oficiais e menu seguro |
| `/api/market/stats` | 200 | sem erro |
| `/api/ml/status` | 200 | resposta segura, sem segredo |
| `/api/amazon/status` | 200 | `configured: false`, sem segredo |
| flores, total R$ 500 | 200 | real; primeiro preço R$ 188,05; origem `flores_online` |
| iPhone, total R$ 5.000 | 200 | real; 1 produto do catálogo; fonte Saldão da Informática |
| Samsung, total R$ 3.000 | 200 | real; smartphone principal no topo |
| iPhone 17 Pro Max, total R$ 10.000 | 200 | catálogo insuficiente; fonte externa sem oferta adicional confirmada |
| produto inexistente | 200 | `dataMode: none`; zero produto; nenhum demo |

A inspeção visual local confirmou:

- Blog e Minha Conta não são links;
- Departamentos navega para a seção correta;
- campos de produto e orçamento começam vazios;
- resultados não aparecem antes do orçamento;
- os números oficiais estão visíveis e não se contradizem;
- não há lista duplicada de departamentos;
- nenhum fornecedor é apresentado como protagonista.

## Testes executados

- `node --check public/app.js`: passou;
- `node --check api/web.js`: passou;
- `node --check server.mjs`: passou;
- `node --test`: 146 testes, 146 aprovados, 0 falhas.

Durante a suíte, o arquivo OAuth local ignorado pelo Git foi temporariamente retirado e restaurado para que o teste de “token ausente” fosse isolado do estado da máquina. Nenhum conteúdo do token foi lido ou registrado.

## Pendência operacional externa

- Revogar a chave RapidAPI que apareceu na captura/PDF.
- Criar uma chave nova somente quando o plano, limite, URL direta e termos de uso da Amazon forem validados.
- A revogação da chave RapidAPI continua sendo uma ação manual no painel do provedor; a validação do hotfix no domínio principal foi concluída.

## Validação final em produção

O domínio `https://o-que-cabe.vercel.app` foi validado após a publicação dos commits do hotfix.

- `/api/health`: HTTP 200 e build novo confirmado.
- `/api/catalog/health`: 16.740 produtos analisados, 15.999 publicados e 741 ocultos.
- `/api/home-data`: métricas oficiais, timestamp real e menu sem links falsos.
- `/api/market/stats`: HTTP 200.
- `/api/ml/status`: Mercado Livre configurado, porém não autenticado nem operacional; nenhum segredo exposto.
- `/api/amazon/status`: Amazon desativada e sem chave exposta.
- Busca por flores com R$ 500: oferta real da Flores Online, preço de R$ 179,49 no primeiro card validado, condição Novo, link direto e parcelamento identificado como estimativa.
- Busca por iPhone com R$ 5.000: apenas o iPhone confirmado existente no catálogo, acompanhado do aviso de poucas opções.
- Busca por Samsung com R$ 3.000: smartphone principal antes de acessórios.
- Busca por produto inexistente: zero card, nenhum demo e mensagem pública neutra.

A inspeção no navegador confirmou que Blog e Minha Conta aparecem como itens futuros não navegáveis, Departamentos leva à seção correta e nenhum orçamento é presumido antes do preenchimento. Também foi corrigido o encaixe dos grupos de produtos na grade: cada grupo agora ocupa a largura total da área de resultados, sem comprimir três cards dentro de uma única coluna.

Nenhuma resposta pública inspecionada contém `x-rapidapi-key`, `MELI_ACCESS_TOKEN`, `CLIENT_SECRET` ou `RAPIDAPI_AMAZON_KEY`.
