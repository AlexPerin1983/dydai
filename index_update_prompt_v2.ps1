
$path = "App.tsx"
$content = Get-Content -Path $path -Raw -Encoding UTF8

$startMarker = 'const prompt = `'
$endMarker = 'retorne: []`;'

$startIndex = $content.LastIndexOf($startMarker)

if ($startIndex -ge 0) {
    $endIndex = $content.IndexOf($endMarker, $startIndex)
    if ($endIndex -ge 0) {
        $endIndex += $endMarker.Length
        
        Write-Host "Encontrado bloco de $startIndex até $endIndex"
        
        $newPrompt = @'
const prompt = `Você é um assistente especialista em extração de medidas de janelas/vidros para instalação de películas.

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

Se não conseguir extrair, retorne: []`;
'@
        
        $before = $content.Substring(0, $startIndex)
        $after = $content.Substring($endIndex)
        
        $newContent = $before + $newPrompt + $after
        Set-Content -Path $path -Value $newContent -Encoding UTF8
        Write-Host "Atualizado com sucesso via índices."
    } else {
        Write-Host "Marcador de fim não encontrado."
    }
} else {
    Write-Host "Marcador de início não encontrado."
}
