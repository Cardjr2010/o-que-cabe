# RELATORIO_FUNCTION_INVOCATION_FAILED_API_WEB.md

## Resumo

A falha de runtime em `api/web.js` foi causada por uma chamada incorreta ao provider do Mercado Livre.
O código estava invocando `MercadoLivreProvider.searchProducts(...)` como se fosse método estático, mas `searchProducts` é um método de instância.

## Stack trace reproduzido localmente

Ao chamar o provider diretamente, o erro reproduzido foi:

```text
TypeError: m.MercadoLivreProvider.searchProducts is not a function
    at [eval]:1:123
```

Na rota da API, o ponto exato era:

- `api/web.js:1087` para `/api/search`
- `api/web.js:1288` para `/api/ml-connector-test`

## Causa raiz

O módulo `src/providers/MercadoLivreProvider.js` exporta a classe `MercadoLivreProvider`.
Como a classe não define `searchProducts` como método estático, a chamada direta no nível do módulo falhava em runtime.

Isso derrubava a rota de busca e o endpoint de diagnóstico do provider.

## Correção aplicada

Foi criado um singleton lazy dentro de `api/web.js`:

- `getMercadoLivreProvider()`

E as chamadas foram trocadas para usar a instância:

- `getMercadoLivreProvider().searchProducts(...)`

## Validação local

Após a correção, os testes locais responderam com sucesso:

- `/api/health` -> 200
- `/api/catalog/health` -> 200
- `/api/ml-connector-test?q=xiaomi&mode=total&totalBudget=1500` -> 200
- `/api/search?q=xiaomi&mode=total&totalBudget=1500` -> 200

## Observação sobre Vercel

Não foi possível copiar o log completo diretamente da UI da Vercel com as ferramentas disponíveis neste ambiente.
Mesmo assim, a reprodução local confirmou a causa raiz exata e a correção mínima necessária.

