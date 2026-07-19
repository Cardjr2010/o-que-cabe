# Relatório de auditoria do HTML em produção — 7a8d53d

Data da auditoria: 18/07/2026
Domínio: `https://o-que-cabe.vercel.app`

## Resultado

A produção estava no commit esperado `7a8d53d7b72f9ce5ca023cb9f38b3a27fbd8c6e5` e o domínio principal já entregava a home corrigida. A contradição veio de uma cópia antiga de `index.html` mantida na raiz do repositório, que não era a home servida pela Vercel.

O hotfix alinhou essa cópia com a home canônica e adicionou um teste para impedir nova divergência entre:

- `index.html`;
- `public/index.html`;
- `api/static/index.html`.

## Evidência da produção antes do hotfix

Foi feita uma requisição com parâmetro único e cabeçalhos de cache desativado.

| Verificação | Resultado |
|---|---:|
| `/api/health` | `buildCommit = 7a8d53d7b72f9ce5ca023cb9f38b3a27fbd8c6e5` |
| `/` | HTTP 200 |
| `/index.html` | HTTP 200 |
| Content-Type | `text/html; charset=utf-8` |
| Cache da Vercel | `MISS` |
| Tamanho de `/` | 9.345 caracteres |
| Tamanho de `/index.html` | 9.345 caracteres |
| Conteúdo de `/` e `/index.html` | idêntico |

Nenhuma destas frases apareceu no HTML servido:

- `Hoje catálogo atualizado`;
- `Seu teto estimado`;
- `Filtramos as armadilhas`;
- `juros abusivos`;
- `Sua área pessoal`.

O HTML servido continha:

- `15.999 produtos publicados`;
- `16.740 produtos analisados`;
- `741 produtos ocultos por qualidade ou fonte`;
- Blog e Minha Conta marcados como `Em breve`, sem links falsos;
- texto conservador sobre frete, parcelamento e reputação;
- campos de produto e orçamento vazios.

## Caminho real do HTML

Na Vercel, `api/web.js` prefere `api/static` quando essa pasta está empacotada e lê `api/static/index.html` para responder a home pela função. O servidor local resolve `/` para `public/index.html`.

As cópias `public/index.html` e `api/static/index.html` já estavam idênticas. O arquivo `index.html` da raiz era uma cópia histórica e continha os textos antigos. Embora não estivesse sendo servido no domínio, ele podia induzir auditorias de código ou ferramentas externas a interpretar a versão errada da home.

## Correção aplicada

- O `index.html` da raiz foi alinhado ao `public/index.html` canônico.
- O teste `test/production-coherence.test.js` agora compara as três cópias da home.
- Os textos antigos continuam permitidos apenas quando representam comportamento dinâmico real. Em `public/app.js`, `Seu teto estimado` só é produzido depois que o usuário informa um orçamento válido; ele não aparece no estado inicial.
- Páginas técnicas de exploração em `api/web.js` e `server.mjs` não são a home pública e não participam da renderização de `/`.

## Validação visual

Print sem cache registrado em:

`evidencias/auditoria-home-7a8d53d-cache-bust.png`

O print confirma:

- menu com Blog e Minha Conta como `Em breve`;
- hero com `15.999 produtos publicados`;
- ausência de orçamento presumido;
- ausência das promessas antigas.

## Testes

- `node --check public/app.js`: OK
- `node --check api/web.js`: OK
- `node --check server.mjs`: OK
- `node --test test/production-coherence.test.js`: 5 testes aprovados
- `node --test`: 146 testes aprovados, 0 falhas

## Conclusão

Não havia cache antigo nem alias divergente no domínio principal durante a auditoria. A produção `7a8d53d` servia o HTML correto. A única divergência comprovada era a cópia antiga da raiz do repositório, agora alinhada e protegida por teste automatizado.
