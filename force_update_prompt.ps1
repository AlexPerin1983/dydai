
$path = "App.tsx"
# Ler como array de strings para facilitar manipulação por linha se necessário, mas Raw é melhor para regex
$content = Get-Content -Path $path -Raw -Encoding UTF8

# Regex para encontrar o bloco do prompt, sendo flexível com caracteres estranhos
# Procura por "const prompt =" seguido por crase, qualquer coisa até "retorne: []`;"
$regex = "(?s)const prompt = `.*?retorne: \[\]`;"

$newPrompt = @"
const prompt = ``Você é um assistente especialista em extração de medidas de janelas/vidros para instalação de películas.

Sua tarefa é extrair TODAS as medidas mencionadas e retornar um array JSON com cada medida individual.

**REGRAS CRÍTICAS DE AMBIENTE:**
1. O campo "local" deve SEMPRE incluir o ambiente mencionado (Sala, Quarto, Cozinha, etc).
2. Se a entrada for "5 janelas de 1.20 x 2.10 na sala", o local deve ser "Janela da Sala" para TODAS as 5 medidas.
3. Se a entrada for "2 vidros fixos 0.80x1.50 no escritório", o local deve ser "Vidro Fixo do Escritório".
4. Se não houver ambiente explícito, use uma descrição genérica (ex: "Janela", "Vidro").

**OUTRAS REGRAS:**
1. Separe cada medida individual em um item do array (quantidade sempre 1).
2. Se for "5 janelas...", crie 5 objetos separados no array.
3. Largura e Altura devem ser strings com vírgula como decimal (ex: "1,20").

FORMATO DE RESPOSTA (JSON PURO):
[
  { "local": "Janela da Sala", "largura": "1,20", "altura": "2,10", "quantidade": 1 },
  { "local": "Janela da Sala", "largura": "1,20", "altura": "2,10", "quantidade": 1 }
]

Se não conseguir extrair, retorne: []``;
"@

# Ajustar crases no newPrompt (PowerShell usa crase para escape, então usei `` para representar ` literal no here-string, mas aqui preciso ajustar)
# Na verdade, no here-string @" "@, crase não precisa de escape se não for variável. Mas vou usar replace para garantir.
$newPrompt = $newPrompt.Replace('``', '`')

if ($content -match $regex) {
    $content = $content -replace $regex, $newPrompt
    Set-Content -Path $path -Value $content -Encoding UTF8
    Write-Host "Prompt atualizado com sucesso via Regex."
} else {
    Write-Host "Prompt não encontrado via Regex."
}
