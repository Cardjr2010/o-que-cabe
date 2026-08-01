# Relatorio - Importacao Telegram Afiliados

Atualizado em: 2026-07-31

## Resumo executivo

O importador de ofertas do Telegram foi ajustado para somar novos lotes sem apagar produtos importados anteriormente. Agora o catalogo preserva os produtos do export anterior e adiciona o novo arquivo `ChatExport_2026-07-31 (5)`.

Resultado atual:

- 3.181 produtos analisados no catalogo.
- 2.246 produtos publicados.
- 30 produtos vindos de exports do Telegram preservados no catalogo.
- Amazon passou para 355 produtos.
- Mercado Livre passou para 219 produtos.
- Magalu continua fora do fluxo automatico ate resolver captcha/403.

## Lote novo importado

Arquivo processado:

`C:\Users\cardj\Downloads\Telegram Desktop\ChatExport_2026-07-31 (5)\messages.html`

Produtos aceitos neste lote:

- 10 produtos no total.
- 5 produtos Amazon.
- 5 produtos Mercado Livre.

Categorias do lote:

- Casa: 7 produtos.
- Ofertas: 2 produtos.
- Relogios: 1 produto.

## Produtos adicionados neste lote

| Fonte | Produto | Preco | Categoria | Link |
| --- | --- | ---: | --- | --- |
| Amazon | Jogo de Panelas Tramontina Turim 10 pecas | R$ 379,31 | Casa | https://link.amazon/B0ivOZatZ |
| Amazon | Buddemeyer Jogo de toalhas Florentina Extra Soft Banho Bege 4 pecas | R$ 139,89 | Casa | https://link.amazon/B0geyMhht |
| Amazon | WAP Mixer Eletrico 3 em 1 600W 127V | R$ 178,99 | Casa | https://link.amazon/B07b0VDCd |
| Amazon | Cafeteira Cadence Single Up 127V CAF230 | R$ 91,18 | Casa | https://link.amazon/B0i8kgy6g |
| Amazon | Caixa Organizadora de Ferramentas Empilhavel Stacktech | R$ 531,32 | Ofertas | https://link.amazon/B0cZayuZm |
| Mercado Livre | Fresh Whey DUX 900g Chocolate Belga e Avela | R$ 233,13 | Ofertas | https://meli.la/11rk2mR |
| Mercado Livre | Kit Relogio Condor Masculino Dourado Aco | R$ 164,90 | Relogios | https://meli.la/1LYXKAJ |
| Mercado Livre | Escorredor de Pratos Louca Preto Cozinha Suspensa 65cm | R$ 135,19 | Casa | https://meli.la/1pYtm9H |
| Mercado Livre | Fritadeira Eletrica Air Fryer WAP Cozinha Barbecue | R$ 872,10 | Casa | https://meli.la/1XT472J |
| Mercado Livre | Tira Manchas Vanish Liquido Multiuso Pro Line 5L | R$ 47,49 | Casa | https://meli.la/2a28aUr |

## Correcoes aplicadas

- O importador deixou de substituir todos os produtos anteriores do Telegram.
- Produtos do Telegram agora sao atualizados apenas quando o mesmo identificador chega novamente.
- Linhas genericas como "Oferta Relampago" nao viram mais titulo do produto.
- Kits e jogos de uso domestico, como panelas e toalhas, nao sao tratados como "pecas" de reposicao.
- "Florentina" em nome de produto nao aciona mais intencao de flores.

## Validacoes locais

Buscas testadas com resultado real:

- `panelas tramontina turim`
- `toalhas buddemeyer florentina`
- `mixer wap 3 em 1`
- `cafeteira cadence single up`
- `escorredor cozinha suspensa`
- `fritadeira wap barbecue`
- `vanish pro line 5l`
- `relogio condor dourado`
- `tp-link deco be22`
- `honor magic 7 lite`

Tambem foi validado que `flores aniversario` nao passa a retornar toalhas por causa da palavra "Florentina".

## Testes

Executado:

- `node --test`

Resultado:

- 174 testes executados.
- 174 aprovados.
- 0 falhas.

## Observacoes

- Os precos vieram do Telegram e devem continuar sendo tratados como ofertas monitoradas, nao como preco garantido indefinidamente.
- Cupons capturados nao alteram o preco principal sem validacao por produto.
- Links de campanha sem produto individual continuam ignorados.
