# RELATORIO_PADRONIZACAO_IMAGENS

## O que foi ajustado
- Todas as imagens dos cards passaram a ocupar a mesma área visual.
- A área de imagem foi padronizada em `240px` de altura.
- As imagens agora usam `object-fit: contain`.
- O fallback deixou de mostrar "Imagem em breve" e passou a exibir um placeholder profissional.

## Regra de fallback
Quando não existe imagem:
- mostra o logo do O Que Cabe
- mostra o texto `Imagem indisponível`

## Resultado esperado
- Samsung
- Motorola
- Xiaomi
- Positivo

todos aparecem com a mesma moldura visual, sem desalinhamento entre cards.

## Observação
A busca e a origem dos produtos não foram alteradas.
