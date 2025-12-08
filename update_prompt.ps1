
$path = "App.tsx"
$content = Get-Content -Path $path -Raw -Encoding UTF8

$oldPrompt = @"
**REGRAS:**
1. Separe cada medida individual em um item do array
2. Se for "5 janelas de 1.20 x 2.10", crie 5 itens separados
3. Largura e Altura devem ser strings com vírgula como decimal (ex: "1,20")
4. Quantidade é sempre 1 para cada item
5. Local deve ser descritivo (ex: "Janela da Sala", "Vidro Fixo")
"@

$newPrompt = @"
**REGRAS CRÍTICAS DE AMBIENTE:**
1. O campo "local" deve SEMPRE incluir o ambiente mencionado (Sala, Quarto, Cozinha, etc).
2. Se a entrada for "5 janelas de 1.20 x 2.10 na sala", o local deve ser "Janela da Sala" para TODAS as 5 medidas.
3. Se a entrada for "2 vidros fixos 0.80x1.50 no escritório", o local deve ser "Vidro Fixo do Escritório".
4. Se não houver ambiente explícito, use uma descrição genérica (ex: "Janela", "Vidro").

**OUTRAS REGRAS:**
1. Separe cada medida individual em um item do array (quantidade sempre 1).
2. Se for "5 janelas...", crie 5 objetos separados no array.
3. Largura e Altura devem ser strings com vírgula como decimal (ex: "1,20").
"@

if ($content.Contains($oldPrompt)) {
    $content = $content.Replace($oldPrompt, $newPrompt)
    Set-Content -Path $path -Value $content -Encoding UTF8
    Write-Host "Prompt atualizado com sucesso."
} else {
    Write-Host "Prompt antigo não encontrado."
    # Debug: mostrar o que tem no arquivo perto de onde deveria estar
    $lines = Get-Content -Path $path
    $idx = 0
    foreach ($line in $lines) {
        if ($line -match "Sua tarefa é extrair TODAS as medidas") {
            Write-Host "Encontrado perto da linha $idx"
            for ($i = 0; $i -lt 15; $i++) {
                Write-Host $lines[$idx + $i]
            }
            break
        }
        $idx++
    }
}
