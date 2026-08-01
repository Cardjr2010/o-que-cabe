# Importacao Telegram Magalu

Gerado em: 2026-08-01T00:03:27.845Z
Arquivo analisado: C:\Users\cardj\Downloads\Telegram Desktop\ChatExport_2026-07-31 (2)\messages.html
Data filtrada: 31.07.2026

## Resultado da importacao

- Candidatos com preco e codigo: 9
- Produtos aceitos com link direto: 8
- Rejeitados: 0
- Magalu adicionados nesta rodada: 8

## Categorias aceitas

- casa: 3
- celular: 1
- informatica: 1
- beleza_moda: 3

## Produtos aceitos

- Balanca Digital Bioimpedancia Bluetooth com App Medicao Corporal Completa - Star Produtos | R$ 19,90 | casa
- Smartphone Samsung Galaxy A36 5G 128gb 6GB RAM Tela 67 Camera 50mp Branco | R$ 1.437,26 | celular
- Mantinha Cobertor Soft Casal Ultra Macio Luxo Aconchego 200m X 180m 01 Peca Zelimari | R$ 19,90 | casa
- Impressora Epson Ecotank L1250 Tanque DE Tinta WI FI USB | R$ 844,55 | informatica
- Perfume Masculino Polo Club Parfum Green 100ml Year ONE Perfumes | R$ 97,95 | beleza_moda
- Guarda Roupa Casal Madesa Monaco 3 Portas DE Correr COM Espelho | R$ 922,23 | casa
- Coffret Jean Paul Gaultier Classique KIT Perfume Masculino EDT Creme Corporal | R$ 559,00 | beleza_moda
- Gaultier Divine Jean Paul Gaultier Perfume Feminino EAU DE Parfum | R$ 417,24 | beleza_moda

Todos os aceitos possuem pagina direta validada em Magazine Voce com o slug de afiliado `heroisderessaca`.

## Inventario apos importacao

- Produtos publicados: 2.216
- Produtos analisados: 3.151

### Fontes publicadas

- Info Store - Informatica: 1.462
- Amazon: 337
- Mercado Livre: 207
- Saldao da Informatica: 202
- Magalu: 8

## Validacao de busca

- `impressora epson ecotank l1250`: retorna produto real Magalu por R$ 844,55 como primeira opcao.
- `guarda roupa madesa`: retorna produto real Magalu por R$ 922,23.
- `perfume gaultier`: retorna produto real Magalu.
- `balanca digital bioimpedancia`: retorna produto real Magalu.
- `galaxy a36`: encontra oferta real; o OQC ainda pode priorizar outra fonte se ela for melhor para o usuario.
- `banheiro organizado ate 250`: nao mostra mais telefone, gabinete, PartyBox ou item incompatível. Sem produto confirmado, a resposta fica limpa.

## Correcao de relevancia

A busca de casa/banheiro foi endurecida para nao aceitar produto apenas por estar em departamento generico "Casa". Para consultas como `banheiro organizado`, apenas itens semanticamente ligados a banheiro ou organizacao de banheiro podem aparecer.

Tambem foi corrigido um falso positivo em que `PartyBox` era aceito por conter a palavra `box`. Agora `box`, `pia`, `nicho`, `espelho`, `gabinete`, `prateleira`, `armario` e `organizador` so contam para banheiro quando aparecem ligados a banheiro/lavabo.

## Validacao tecnica

- `node --test`: 174/174 testes aprovados.
- `node --check public/app.js`: OK.
- `node --check api/web.js`: OK.
- `node --check server.mjs`: OK.
- `node --check src/engines/RankingEngine.js`: OK.
- `node --check scripts/import-telegram-magalu-export.mjs`: OK.
