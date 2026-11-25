# Instala a Ana no Windows (PowerShell)
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "==> verificando Node" -ForegroundColor Cyan
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
  Write-Host "Node.js nao encontrado. Baixe em https://nodejs.org (versao 20 ou maior) e rode de novo." -ForegroundColor Yellow
  exit 1
}
$versao = [int](node -p "process.versions.node.split('.')[0]")
if ($versao -lt 20) {
  Write-Host "Seu Node e $versao. Precisa ser 20 ou maior." -ForegroundColor Yellow
  exit 1
}
Write-Host "    Node $(node -v) ok" -ForegroundColor Green

Write-Host "==> preparando pastas" -ForegroundColor Cyan
foreach ($p in @("projetos","memoria","skills")) { New-Item -ItemType Directory -Force -Path $p | Out-Null }

if (-not (Test-Path ".env")) {
  Copy-Item ".env.example" ".env"
  Write-Host "    criei o arquivo .env" -ForegroundColor Green
} else {
  Write-Host "    .env ja existe, mantive o seu" -ForegroundColor Green
}

Write-Host "==> testando o nucleo (nao gasta credito)" -ForegroundColor Cyan
node src/teste.js

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "Pronto. Falta um passo: coloque sua chave da OpenAI no .env"
Write-Host ""
Write-Host "  abra o arquivo .env e preencha: OPENAI_API_KEY=sk-..."
Write-Host ""
Write-Host "Depois rode:"
Write-Host "  node src/index.js      -> conversar no terminal"
Write-Host "  node src/whatsapp.js   -> atender no WhatsApp"
Write-Host "======================================================" -ForegroundColor Cyan
