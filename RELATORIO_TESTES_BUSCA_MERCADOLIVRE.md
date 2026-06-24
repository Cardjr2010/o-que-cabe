# RELATORIO_TESTES_BUSCA_MERCADOLIVRE

## Objetivo
Validar a busca do Mercado Livre com transparência de preço, parcela estimada, imagem e origem dos dados.

## Resultado da validação local

### 1. relógio — R$ 200 — 12x
- endpoint chamado: `/api/search?q=rel%C3%B3gio&monthly=200&months=12&source=mercadolivre`
- quantidade de produtos retornados: 0
- quantidade CABE: 0
- quantidade APERTADO: 0
- quantidade NÃO CABE: 0
- primeiro produto retornado: nenhum
- preço total: não aplicável
- parcela estimada: não aplicável
- permalink existe? não
- imagem existe? não
- dataMode: demo

### 2. celular — R$ 80 — 12x
- endpoint chamado: `/api/search?q=celular&monthly=80&months=12&source=mercadolivre`
- quantidade de produtos retornados: 5
- quantidade CABE: 5
- quantidade APERTADO: 0
- quantidade NÃO CABE: 0
- primeiro produto retornado: Samsung Galaxy A05
- preço total: R$ 499,00
- parcela estimada: R$ 41,58
- permalink existe? sim
- imagem existe? sim
- dataMode: demo

### 3. notebook — R$ 250 — 10x
- endpoint chamado: `/api/search?q=notebook&monthly=250&months=10&source=mercadolivre`
- quantidade de produtos retornados: 1
- quantidade CABE: 1
- quantidade APERTADO: 0
- quantidade NÃO CABE: 0
- primeiro produto retornado: Notebook Lenovo IdeaPad 3
- preço total: R$ 1.499,00
- parcela estimada: R$ 124,92
- permalink existe? sim
- imagem existe? não
- dataMode: demo

### 4. air fryer — R$ 60 — 10x
- endpoint chamado: `/api/search?q=air%20fryer&monthly=60&months=10&source=mercadolivre`
- quantidade de produtos retornados: 1
- quantidade CABE: 1
- quantidade APERTADO: 0
- quantidade NÃO CABE: 0
- primeiro produto retornado: Air Fryer 4L
- preço total: R$ 329,00
- parcela estimada: R$ 27,42
- permalink existe? sim
- imagem existe? não
- dataMode: demo

### 5. tablet — R$ 70 — 12x
- endpoint chamado: `/api/search?q=tablet&monthly=70&months=12&source=mercadolivre`
- quantidade de produtos retornados: 1
- quantidade CABE: 0
- quantidade APERTADO: 1
- quantidade NÃO CABE: 0
- primeiro produto retornado: Tablet Samsung Galaxy Tab A9
- preço total: R$ 899,00
- parcela estimada: R$ 74,92
- permalink existe? sim
- imagem existe? não
- dataMode: demo

## Observação
Na validação local, a busca do Mercado Livre caiu para a base demo quando a resposta real não foi usada na sessão de teste. A interface já diferencia `DADOS REAIS DO MERCADO LIVRE` e `DEMONSTRAÇÃO MERCADO LIVRE`, e o botão usa o permalink correto quando ele existe.
