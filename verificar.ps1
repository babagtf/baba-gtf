# ============================================================
# verificar.ps1 — Diagnóstico da auditoria BABA GTF
# ============================================================

$raiz = Split-Path -Parent $MyInvocation.MyCommand.Path
Write-Host ""
Write-Host "Verificando projeto em: $raiz" -ForegroundColor Cyan
Write-Host ""

$checks = @(
  # --- Arquivos novos devem existir ---
  @{ Tipo='file';  Caminho="$raiz\src\config\admins.ts"; Desc='Arquivo src/config/admins.ts' }
  @{ Tipo='file';  Caminho="$raiz\src\lib\audit.ts";     Desc='Arquivo src/lib/audit.ts' }

  # --- admins.ts deve ter os 5 e-mails ---
  @{ Tipo='regex'; Caminho="$raiz\src\config\admins.ts"; Padrao='luidesmatheusdev@gmail\.com'; Desc='admins.ts -> Luides' }
  @{ Tipo='regex'; Caminho="$raiz\src\config\admins.ts"; Padrao='baba\.gtf\.videos@gmail\.com'; Desc='admins.ts -> BABA GTF Vídeos' }
  @{ Tipo='regex'; Caminho="$raiz\src\config\admins.ts"; Padrao='vinijr18@gmail\.com';           Desc='admins.ts -> Vini JR' }
  @{ Tipo='regex'; Caminho="$raiz\src\config\admins.ts"; Padrao='fabiodoamordivino@gmail\.com';  Desc='admins.ts -> Fábio do Amor Divino' }
  @{ Tipo='regex'; Caminho="$raiz\src\config\admins.ts"; Padrao='rizmario@gmail\.com';           Desc='admins.ts -> Rizmário' }

  # --- audit.ts exporta as duas funções ---
  @{ Tipo='regex'; Caminho="$raiz\src\lib\audit.ts"; Padrao='export function getAuditFields';   Desc='audit.ts -> getAuditFields()' }
  @{ Tipo='regex'; Caminho="$raiz\src\lib\audit.ts"; Padrao='export function getAnularFields';  Desc='audit.ts -> getAnularFields()' }
  @{ Tipo='regex'; Caminho="$raiz\src\lib\audit.ts"; Padrao='editedByName';                     Desc='audit.ts -> grava editedByName' }
  @{ Tipo='regex'; Caminho="$raiz\src\lib\audit.ts"; Padrao='anuladoPorNome';                   Desc='audit.ts -> grava anuladoPorNome' }

  # --- types.ts tem os campos novos ---
  @{ Tipo='regex'; Caminho="$raiz\src\types.ts"; Padrao='editedBy\?';       Desc='types.ts -> editedBy?' }
  @{ Tipo='regex'; Caminho="$raiz\src\types.ts"; Padrao='editedByName\?';   Desc='types.ts -> editedByName?' }
  @{ Tipo='regex'; Caminho="$raiz\src\types.ts"; Padrao='anuladoPor\?';     Desc='types.ts -> anuladoPor?' }
  @{ Tipo='regex'; Caminho="$raiz\src\types.ts"; Padrao='anuladoPorNome\?'; Desc='types.ts -> anuladoPorNome?' }

  # --- firebase.ts valida admin ---
  @{ Tipo='regex'; Caminho="$raiz\src\firebase.ts"; Padrao='isAdminEmail'; Desc='firebase.ts -> verifica isAdminEmail' }
  @{ Tipo='regex'; Caminho="$raiz\src\firebase.ts"; Padrao='ACESSO_NEGADO'; Desc='firebase.ts -> lança ACESSO_NEGADO' }

  # --- useAuthStore tem campo erro ---
  @{ Tipo='regex'; Caminho="$raiz\src\store\useAuthStore.ts"; Padrao='erro';       Desc='useAuthStore -> tem campo erro' }
  @{ Tipo='regex'; Caminho="$raiz\src\store\useAuthStore.ts"; Padrao='isAdminEmail'; Desc='useAuthStore -> revalida admin' }

  # --- Login.tsx mostra erro ---
  @{ Tipo='regex'; Caminho="$raiz\src\pages\Login.tsx"; Padrao='erro'; Desc='Login.tsx -> mostra Alert de erro' }

  # --- format.ts usa os campos novos ---
  @{ Tipo='regex'; Caminho="$raiz\src\lib\format.ts"; Padrao='editedByName';   Desc='format.ts -> usa editedByName' }
  @{ Tipo='regex'; Caminho="$raiz\src\lib\format.ts"; Padrao='anuladoPorNome'; Desc='format.ts -> usa anuladoPorNome' }

  # --- Mini-diffs aplicados nos 6 componentes ---
  @{ Tipo='regex'; Caminho="$raiz\src\pages\Grade.tsx";                       Padrao='getAuditFields';  Desc='Grade.tsx -> usa getAuditFields' }
  @{ Tipo='regex'; Caminho="$raiz\src\pages\Grade.tsx";                       Padrao='getAnularFields'; Desc='Grade.tsx -> usa getAnularFields' }
  @{ Tipo='regex'; Caminho="$raiz\src\components\LancamentoEditModal.tsx";    Padrao='getAuditFields';  Desc='LancamentoEditModal.tsx -> usa getAuditFields' }
  @{ Tipo='regex'; Caminho="$raiz\src\pages\Lancamentos.tsx";                 Padrao='getAuditFields';  Desc='Lancamentos.tsx -> usa getAuditFields' }
  @{ Tipo='regex'; Caminho="$raiz\src\pages\Lancamentos.tsx";                 Padrao='getAnularFields'; Desc='Lancamentos.tsx -> usa getAnularFields' }
  @{ Tipo='regex'; Caminho="$raiz\src\components\DespesaEditModal.tsx";       Padrao='getAuditFields';  Desc='DespesaEditModal.tsx -> usa getAuditFields' }
  @{ Tipo='regex'; Caminho="$raiz\src\pages\Despesas.tsx";                    Padrao='getAuditFields';  Desc='Despesas.tsx -> usa getAuditFields' }
  @{ Tipo='regex'; Caminho="$raiz\src\pages\Despesas.tsx";                    Padrao='getAnularFields'; Desc='Despesas.tsx -> usa getAnularFields' }
  @{ Tipo='regex'; Caminho="$raiz\src\pages\Associados.tsx";                  Padrao='getAuditFields';  Desc='Associados.tsx -> usa getAuditFields' }
)

$ok = 0
$fail = 0
$faltando = @()

foreach ($c in $checks) {
  if ($c.Tipo -eq 'file') {
    if (Test-Path $c.Caminho) {
      Write-Host "[OK]  " -ForegroundColor Green -NoNewline
      Write-Host $c.Desc
      $ok++
    } else {
      Write-Host "[X]   " -ForegroundColor Red -NoNewline
      Write-Host "$($c.Desc) -> NAO EXISTE"
      $fail++
      $faltando += $c.Desc
    }
    continue
  }

  if (-not (Test-Path $c.Caminho)) {
    Write-Host "[X]   " -ForegroundColor Red -NoNewline
    Write-Host "$($c.Desc) -> ARQUIVO NAO EXISTE"
    $fail++
    $faltando += $c.Desc
    continue
  }

  $conteudo = Get-Content $c.Caminho -Raw -ErrorAction SilentlyContinue
  if ($conteudo -match $c.Padrao) {
    Write-Host "[OK]  " -ForegroundColor Green -NoNewline
    Write-Host $c.Desc
    $ok++
  } else {
    Write-Host "[X]   " -ForegroundColor Red -NoNewline
    Write-Host "$($c.Desc) -> NAO ENCONTRADO"
    $fail++
    $faltando += $c.Desc
  }
}

Write-Host ""
Write-Host "===== RESUMO =====" -ForegroundColor Cyan
Write-Host "OK:     $ok" -ForegroundColor Green
if ($fail -gt 0) {
  Write-Host "Falhas: $fail" -ForegroundColor Red
  Write-Host ""
  Write-Host "Itens que precisam ser corrigidos:" -ForegroundColor Yellow
  $faltando | ForEach-Object { Write-Host " - $_" -ForegroundColor Yellow }
} else {
  Write-Host "Falhas: 0 (tudo aplicado!)" -ForegroundColor Green
}
Write-Host ""

# Extra: procurar badges() antigo no JSX
Write-Host "===== Possivel bug de renderizacao =====" -ForegroundColor Cyan
$arquivos = Get-ChildItem -Path "$raiz\src" -Recurse -Filter "*.tsx" -ErrorAction SilentlyContinue
$suspeitos = 0
foreach ($arq in $arquivos) {
  $c = Get-Content $arq.FullName -Raw
  if ($c -match '\{badges\(' -or $c -match '\{Utils\.badges\(') {
    Write-Host "[!] $($arq.Name) usa {badges(...)} ou {Utils.badges(...)} diretamente em JSX" -ForegroundColor Yellow
    Write-Host "    (React escapa HTML: badge nao vira elemento)" -ForegroundColor DarkYellow
    $suspeitos++
  }
}
if ($suspeitos -eq 0) {
  Write-Host "OK: nenhum arquivo .tsx usa {badges()} em JSX (todos usam <Tag> ou componente React)" -ForegroundColor Green
}
Write-Host ""