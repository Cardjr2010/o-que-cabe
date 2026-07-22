# Prova Busca Multifuente - 20 Produtos

Data: 22/07/2026

## Script executado

```powershell
node scripts/run-multisource-shopping-lab.mjs
```

## Resumo

- 20 consultas executadas
- Fontes planejadas por consulta: catálogo + Mercado Livre direto + Amazon direta quando a categoria exige
- Gecko não participou por falta de configuração

## Leituras principais

- `iPhone 17 256GB`: 0 aceitos
- `iPhone 17 Pro Max 256GB`: 0 aceitos
- `Galaxy S25 256GB`: 0 aceitos
- `Xiaomi BE6500`: 0 aceitos
- `notebook Lenovo i5 16GB`: 0 aceitos depois do endurecimento de CPU
- `TV Samsung 55`: 0 aceitos depois do bloqueio de falso positivo
- `TV LG OLED`: 4 aceitos via catálogo
- `casa até 50`: refinamento, sem produto incompatível

## Conclusão

O laboratório está conservador. Hoje ele prefere devolver zero oferta válida a promover produto errado. Isso é a decisão correta até as fontes externas ficarem operacionais de verdade.

