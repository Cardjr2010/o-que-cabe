# Import Telegram - Campanhas Mercado Livre

Data da auditoria: 2026-08-01

Arquivo analisado:

- `C:\Users\cardj\Downloads\Telegram Desktop\ChatExport_2026-07-31 (3)\messages.html`

## Resultado

O export nao trouxe produtos completos o bastante para entrar como produto do catalogo.

Produtos importados: 0

Motivo:

- a maioria das mensagens e de campanha/cupom;
- varios links sao `bit.ly`, nao anuncios diretos;
- os blocos nao trazem preco individual confirmavel;
- nao ha imagem/link/preco do produto em formato suficiente para virar card de compra.

## Campanhas validas adicionadas

Estas campanhas estavam dentro da janela de validade em 2026-08-01 e foram adicionadas ao Radar como campanhas, nao como produtos:

| Cupom | Beneficio | Minimo | Valido ate | Link |
| --- | ---: | ---: | --- | --- |
| DESCONTODOML | 20% OFF | R$ 79 | 02/08/2026 | https://bit.ly/4pGnXwJ |
| CUPOMNOML | 22% OFF | R$ 29 | 02/08/2026 | https://bit.ly/4fq6uoQ |
| OFERTAS | 25% OFF | R$ 29 | 02/08/2026 | https://bit.ly/4wkj7aY |
| MELIACHA | 22% OFF | R$ 29 | 02/08/2026 | https://bit.ly/3THEuVf |
| QUEROPROMO | 25% OFF | R$ 29 | 02/08/2026 | https://bit.ly/4fnMxz1 |
| BIKEMINIONS1P | 15% OFF | R$ 100 | 05/08/2026 | https://bit.ly/4wwB3zl |

## Campanhas ignoradas

Campanhas vencidas em 24/07, 25/07, 26/07, 30/07 e 31/07 foram ignoradas.

Exemplos:

- POUPACERTO
- VALEAPENANOMELI
- BOMDEMAIS
- MODACOMVC
- MELIPRACASA
- LIQUIDA30
- MAYBELLINENOMELI
- USAESSAPROMO

## Regra aplicada

Os cupons nao alteram o preco principal dos produtos porque a elegibilidade nao foi confirmada por item.

O OQC pode mostrar a campanha como oportunidade de radar, mas so deve calcular "preco final com cupom" quando houver:

- produto individual validado;
- link direto;
- preco atual;
- regra do cupom;
- data de verificacao;
- confirmacao de que aquele item aceita o cupom.

## Protecao adicionada

O importador de Telegram Magalu foi ajustado para nao apagar produtos antigos quando o novo export nao tiver nenhum produto confirmado.

Isso evita que um arquivo de cupons ou campanhas limpe produtos reais ja publicados.
