<#
    push-oliver-fit.ps1
    -------------------
    Objetivo: commitar o candidato de QA da Fase 9 (se houver alterações
    pendentes) e enviar todos os commits locais (Fases 4-8 + Fase 9) para
    origin/main no GitHub, disparando o deploy automático na Vercel.

    Uso:
        1. Salve este arquivo em qualquer pasta (ex.: Downloads).
        2. Abra o PowerShell.
        3. Rode:  powershell -ExecutionPolicy Bypass -File .\push-oliver-fit.ps1

    O script para imediatamente em qualquer erro (git, rede, credenciais)
    e imprime o motivo — não segue adiante silenciosamente.
#>

$ErrorActionPreference = "Stop"

function Log($msg) {
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "[$timestamp] $msg"
}

# --- 1. Localizar o repositório -------------------------------------------
$candidatos = @(
    "$env:USERPROFILE\OneDrive\App_OliverFit",
    "$env:USERPROFILE\App_OliverFit"
)

$repo = $candidatos | Where-Object { Test-Path (Join-Path $_ ".git") } | Select-Object -First 1

if (-not $repo) {
    Log "ERRO: nenhum repositório git encontrado em:"
    $candidatos | ForEach-Object { Log "  - $_" }
    Log "Ajuste a variável `$candidatos` no script com o caminho correto e rode de novo."
    exit 1
}

Log "Repositório localizado: $repo"
Set-Location $repo

# --- 2. Confirmar que é de fato o repo certo -------------------------------
$remoto = git remote get-url origin
Log "Remote origin: $remoto"
if ($remoto -notmatch "yan1405/Oliver-fit") {
    Log "ERRO: o remote origin não aponta para yan1405/Oliver-fit. Abortando por segurança."
    exit 1
}

# --- 3. Estado atual --------------------------------------------------------
Log "Branch atual:"
git branch --show-current

Log "Commits locais ainda não enviados (origin/main..HEAD):"
git log origin/main..HEAD --oneline
if ($LASTEXITCODE -ne 0) {
    Log "AVISO: não foi possível comparar com origin/main (talvez seja necessário 'git fetch' primeiro)."
    Log "Rodando git fetch..."
    git fetch origin
    if ($LASTEXITCODE -ne 0) {
        Log "ERRO: git fetch falhou. Verifique sua conexão e credenciais do GitHub."
        exit 1
    }
    git log origin/main..HEAD --oneline
}

# --- 4. Commitar alterações pendentes (candidato de QA da Fase 9) ---------
$statusCurto = git status --porcelain
if ($statusCurto) {
    Log "Alterações não commitadas detectadas — criando commit de candidato de QA (Fase 9):"
    git status --short

    git add -A
    if ($LASTEXITCODE -ne 0) { Log "ERRO: git add falhou."; exit 1 }

    $mensagem = "feat(fase-9): candidato de QA - build final; teste em dispositivo fisico pendente"
    git commit -m $mensagem
    if ($LASTEXITCODE -ne 0) { Log "ERRO: git commit falhou."; exit 1 }

    Log "Commit criado: $mensagem"
} else {
    Log "Nenhuma alteração pendente no working tree — nada para commitar na Fase 9."
}

# --- 5. Push para o GitHub --------------------------------------------------
Log "Enviando para origin/main..."
git push origin main
if ($LASTEXITCODE -ne 0) {
    Log "ERRO: git push falhou. Causas comuns:"
    Log "  - Credenciais do GitHub expiradas/ausentes (rode 'git push' manualmente uma vez para reautenticar)."
    Log "  - origin/main tem commits que você não tem localmente (rode 'git pull --rebase origin main' e repita)."
    exit 1
}

Log "Push concluído com sucesso."
Log "A Vercel deve iniciar o build automaticamente via integração com o GitHub."
Log "Acompanhe em: https://vercel.com/ -> projeto oliver-fit -> aba Deployments."
