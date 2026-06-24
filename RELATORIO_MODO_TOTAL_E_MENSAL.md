# RELATORIO_MODO_TOTAL_E_MENSAL

## Objetivo
Validar os dois modos do MVP do Mercado Livre:
- orçamento mensal
- orçamento total

## Validação local

### 1. tv — mensal — R$ 200 — 12x
- endpoint: `/api/search?q=tv&mode=monthly&monthly=200&months=12&source=mercadolivre`
- retornou produtos: sim
- origem: demo
- quantidade CABE: 2
- quantidade APERTADO: 0
- quantidade NÃO CABE: 0
- primeiro produto: Samsung Crystal TV 50"
- preço: R$ 499,00
- link existe: sim

### 2. tv — total — R$ 500
- endpoint: `/api/search?q=tv&mode=total&totalBudget=500&source=mercadolivre`
- retornou produtos: sim
- origem: demo
- quantidade CABE: 1
- quantidade APERTADO: 1
- quantidade NÃO CABE: 0
- primeiro produto: Samsung Crystal TV 50"
- preço: R$ 499,00
- link existe: sim

### 3. relogio — total — R$ 300
- endpoint: `/api/search?q=relogio&mode=total&totalBudget=300&source=mercadolivre`
- retornou produtos: sim
- origem: demo
- quantidade CABE: 2
- quantidade APERTADO: 0
- quantidade NÃO CABE: 0
- primeiro produto: Samsung Galaxy Watch
- preço: R$ 299,00
- link existe: sim

### 4. celular — mensal — R$ 80 — 12x
- endpoint: `/api/search?q=celular&mode=monthly&monthly=80&months=12&source=mercadolivre`
- retornou produtos: sim
- origem: demo
- quantidade CABE: 7
- quantidade APERTADO: 0
- quantidade NÃO CABE: 0
- primeiro produto: Samsung Galaxy A05
- preço: R$ 499,00
- link existe: sim

### 5. notebook — mensal — R$ 250 — 10x
- endpoint: `/api/search?q=notebook&mode=monthly&monthly=250&months=10&source=mercadolivre`
- retornou produtos: sim
- origem: demo
- quantidade CABE: 1
- quantidade APERTADO: 0
- quantidade NÃO CABE: 0
- primeiro produto: Notebook Lenovo IdeaPad 3
- preço: R$ 1.499,00
- link existe: sim

## Observação
- O MVP ficou focado em Mercado Livre.
- O seletor de origem e o bloco da Amazon foram ocultados da home.
- A busca agora aceita os modos `monthly` e `total`.
