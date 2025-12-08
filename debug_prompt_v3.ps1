
$path = "App.tsx"
$lines = Get-Content -Path $path -Encoding UTF8
$found = $false
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match "medidas" -and $lines[$i] -match "janelas") {
        Write-Host "Encontrado na linha $i"
        for ($j = 0; $j -lt 20; $j++) {
            if ($i + $j -lt $lines.Count) {
                Write-Host "Linha $($i+$j): $($lines[$i+$j])"
            }
        }
        $found = $true
        break
    }
}

if (-not $found) {
    Write-Host "Texto de medidas não encontrado."
}
