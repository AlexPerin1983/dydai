---
description: Deploy para produção e reversão de emergência
---

# Deploy para Produção - Versão Segura

## Ponto de Salvamento Atual
- **Tag de Segurança**: `v-producao-2025-12-07`
- **Commit**: `ffd2453`
- **Branch**: `refactor/hooks-optimization`
- **Data**: 07/12/2025

## Como Fazer Deploy para Produção

### 1. Merge para a branch principal (main)
```bash
git checkout main
git merge refactor/hooks-optimization
git push origin main
```

### 2. Build da aplicação
```bash
npm run build
```

### 3. Deploy (dependendo da plataforma)
Se estiver usando Vercel, Netlify ou GitHub Pages, siga o processo específico da plataforma.

## Como Reverter para a Versão Anterior em Caso de Bugs

### Opção 1: Reverter usando a tag de segurança
```bash
# Voltar para a tag de segurança
git checkout v-producao-2025-12-07

# Criar uma nova branch a partir da tag
git checkout -b hotfix/rollback-producao

# Fazer force push para main (CUIDADO!)
git checkout main
git reset --hard v-producao-2025-12-07
git push origin main --force
```

### Opção 2: Reverter apenas o último commit
```bash
git revert HEAD
git push origin main
```

### Opção 3: Criar um commit de reversão específico
```bash
# Ver o hash do commit problemático
git log --oneline

# Reverter commit específico
git revert <commit-hash>
git push origin main
```

## Checklist Pré-Deploy
- [ ] Todos os testes passaram
- [ ] Build local funciona corretamente (`npm run build`)
- [ ] Não há erros no console
- [ ] Funcionalidades principais testadas
- [ ] Tag de segurança criada
- [ ] Backup do código anterior salvo

## Checklist Pós-Deploy
- [ ] Aplicação carrega corretamente
- [ ] Todas as funcionalidades principais funcionam
- [ ] Não há erros críticos no console
- [ ] Performance está adequada
- [ ] Mobile responsivo funciona

## Contato de Emergência
Se encontrar bugs críticos em produção, execute:
```bash
git checkout main
git reset --hard v-producao-2025-12-07
git push origin main --force
```

**IMPORTANTE**: O comando `--force` sobrescreve o histórico. Use apenas em emergências!
