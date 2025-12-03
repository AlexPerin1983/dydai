# Tarefa: Correção do Bug no Modal de Filmes e Integração de IA

## Objetivo
Corrigir o erro que impedia a abertura do modal de IA a partir do modal de filmes e implementar a funcionalidade básica de captura de IA.

## Status
- [x] Identificar a causa do erro "Cannot read properties of undefined (reading 'aiConfig')"
- [x] Adicionar props `aiData` e `onOpenAIModal` ao componente `FilmModal` em `App.tsx`
- [x] Criar estados `isAIFilmModalOpen` e `aiFilmData` em `App.tsx`
- [x] Implementar função `handleProcessAIFilmInput` (placeholder)
- [x] Importar e renderizar `AIFilmModal` em `App.tsx`
- [x] Validar a correção (via análise estática)

## Próximos Passos
- [x] Implementar a lógica real de processamento de IA para filmes em `handleProcessAIFilmInput`
- [ ] Testar a captura de imagem e preenchimento automático
