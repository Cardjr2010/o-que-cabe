# Relatorio - Esteira de Ofertas Reais OQC

Gerado em: 02/08/2026.

## Objetivo

Criar um fluxo pratico para transformar exports de Telegram e links de afiliado em produtos reais do OQC, sem misturar campanha generica, cupom solto ou link de outro afiliado no catalogo publico.

## O que foi implementado

- Corrigido `scripts/import-telegram-affiliate-offers.mjs` para usar `src/data/products.seed.json` como seed canonica.
- As seeds `src/data/products.seed.json`, `data/products.seed.json` e `public/data/products.seed.json` agora sao espelhadas com o mesmo conteudo.
- Criado `scripts/import-telegram-affiliate-batch.mjs` para processar uma pasta inteira de exports do Telegram.
- O batch aceita somente mensagens com produto concreto, preco, fonte aceita e link controlavel.
- Mensagens de cupom/campanha sem produto individual continuam rejeitadas.

## Comando operacional

```bash
node scripts/import-telegram-affiliate-batch.mjs --input-dir "C:\Users\cardj\Downloads\Telegram Desktop" --date 31.07.2026 --max-per-file 300
```

Para simular sem alterar catalogo:

```bash
node scripts/import-telegram-affiliate-batch.mjs --input-dir "C:\Users\cardj\Downloads\Telegram Desktop" --date 31.07.2026 --max-per-file 300 --dry-run
```

## Resultado do batch

- Arquivos analisados: 16
- Mensagens analisadas: 10.891
- Ofertas aceitas: 58
- Mensagens rejeitadas: 10.832

### Aceitas por fonte

- Mercado Livre: 38
- Amazon: 20

### Aceitas por categoria

- Casa: 17
- Moda: 9
- TVs: 7
- Relogios: 5
- Informatica: 3
- Monitor: 3
- Games: 3
- Automotivo: 3
- Beleza: 2
- Acessorios: 2
- Audio: 1
- Roteador: 1
- Celular: 1
- Colecionaveis: 1

## Catalogo apos sincronizacao

- Produtos publicados: 2.280
- Produtos de origem Telegram/import manual: 72
- Mercado Livre via Telegram/import manual: 40
- Amazon via Telegram/import manual: 24
- Magalu via Telegram/import manual: 8

### Fontes publicadas no catalogo

- Info Store: 1.462
- Amazon: 361
- Mercado Livre: 247
- Saldao da Informatica: 202
- Magalu: 8

## Por que o total nao aumentou

As 58 ofertas concretas encontradas no batch ja estavam presentes na seed atual. A execucao atualizou o fluxo e a data de leitura, mas nao criou duplicatas. Isso e o comportamento correto: oferta repetida deve atualizar, nao inflar catalogo.

## Banheiro organizado

Foram encontradas mensagens relacionadas a banheiro/prateleira nos exports, mas elas vieram principalmente de:

- Shopee (`s.shopee.com.br`)
- Shoptime/bit.ly
- Economizzando

Essas fontes nao foram importadas como produto publico porque nao ha link controlado pelo OQC nem validacao de destino/produto direto dentro da esteira atual. O OQC nao deve publicar link de outro afiliado como se fosse produto proprio.

Para fazer `banheiro organizado ate 250` retornar produtos, precisamos importar ofertas controladas de banheiro/organizacao com:

- titulo do produto;
- preco;
- imagem;
- link direto/afiliado controlado;
- origem;
- categoria pretendida.

## Buscas validadas

- `banheiro organizado ate 250`: sem oferta confirmada; o OQC nao recomenda falso positivo.
- `cozinha suspensa ate 250`: retorna produto real do Mercado Livre.
- `jogo de panelas tramontina ate 400`: retorna produto real da Amazon.
- `roteador`: retorna produtos reais.
- `xiaomi be6500`: retorna produtos reais do Mercado Livre.
- `tv`: retorna produtos reais do Mercado Livre.
- `monitor gamer`: retorna produtos reais da Amazon.

## Testes

- `node --test`: 177/177 aprovados.
- `node --check public/app.js`: OK.
- `node --check api/web.js`: OK.
- `node --check server.mjs`: OK.
- `node --check scripts/import-telegram-affiliate-batch.mjs`: OK.

## Proximo passo

Usar a esteira batch como processo padrao:

1. Exportar canal/grupo do Telegram.
2. Rodar dry-run.
3. Conferir aceitos/rejeitados.
4. Rodar import real.
5. Validar buscas prioritarias.
6. Publicar somente se o catalogo melhorar sem duplicatas e sem links de terceiros.
