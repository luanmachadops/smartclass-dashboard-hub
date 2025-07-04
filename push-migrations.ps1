# Script para automatizar entrada de senha no Supabase
$password = "otKMMDfbnwhnMFHz"

# Definir variável de ambiente PGPASSFILE
$env:PGPASSFILE = "C:\Users\LUAN MACHADO\Documents\DEV\APLICATIVO ESCOLA MUSICA\smartclass-dashboard-hub\.pgpass"

# Executar comando com timeout
try {
    Write-Host "Executando npx supabase db push..."
    $process = Start-Process -FilePath "npx" -ArgumentList "supabase", "db", "push" -NoNewWindow -PassThru -RedirectStandardInput
    
    # Aguardar um pouco e enviar a senha
    Start-Sleep -Seconds 3
    
    if (!$process.HasExited) {
        # Tentar enviar a senha via stdin
        $process.StandardInput.WriteLine($password)
        $process.StandardInput.Close()
    }
    
    # Aguardar conclusão
    $process.WaitForExit(30000) # 30 segundos timeout
    
    Write-Host "Processo finalizado com código: $($process.ExitCode)"
} catch {
    Write-Host "Erro: $($_.Exception.Message)"
}

# Listar migrações locais
Write-Host "`n=== MIGRAÇÕES LOCAIS ==="
Get-ChildItem "supabase\migrations\*.sql" | ForEach-Object { $_.Name }

# Tentar listar migrações remotas
Write-Host "`n=== TENTANDO LISTAR MIGRAÇÕES REMOTAS ==="
npx supabase migration list --remote 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Não foi possível listar migrações remotas. Verifique a conexão."
}