# ============================================================
# SIGD - Script de inicio rápido
# Uso: Click derecho > "Ejecutar con PowerShell"
#      O en consola: .\start.ps1
# ============================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SIGD - Sistema de Gestion Documental  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ── PASO 1: Levantar Docker ──────────────────────────────────
Write-Host "[1/3] Levantando servicios Docker..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\infra\docker"
docker-compose up -d postgres redis minio elasticsearch

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Docker no esta corriendo. Abre Docker Desktop primero." -ForegroundColor Red
    Read-Host "Presiona ENTER para salir"
    exit 1
}

Write-Host "OK - Docker levantado" -ForegroundColor Green
Write-Host ""

# ── PASO 2: Esperar a que PostgreSQL este listo ──────────────
Write-Host "[2/3] Esperando que PostgreSQL este listo..." -ForegroundColor Yellow
$intentos = 0
do {
    Start-Sleep -Seconds 3
    $intentos++
    $estado = docker inspect --format="{{.State.Health.Status}}" sigd_postgres 2>$null
    Write-Host "  Estado PostgreSQL: $estado (intento $intentos/15)"
} while ($estado -ne "healthy" -and $intentos -lt 15)

if ($estado -ne "healthy") {
    Write-Host "ADVERTENCIA: PostgreSQL puede no estar listo. Continuando de todas formas..." -ForegroundColor Yellow
} else {
    Write-Host "OK - PostgreSQL listo" -ForegroundColor Green
}
Write-Host ""

# ── PASO 3: Backend en nueva ventana ────────────────────────
Write-Host "[3/3] Iniciando Backend y Frontend..." -ForegroundColor Yellow

$backendPath = "$PSScriptRoot\backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "
    Write-Host '=== BACKEND (NestJS - Puerto 3001) ===' -ForegroundColor Cyan;
    Set-Location '$backendPath';
    npm run start:dev
"

Start-Sleep -Seconds 2

$frontendPath = "$PSScriptRoot\frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "
    Write-Host '=== FRONTEND (Next.js - Puerto 3000) ===' -ForegroundColor Cyan;
    Set-Location '$frontendPath';
    npm run dev
"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Todo iniciado! URLs disponibles:      " -ForegroundColor Green
Write-Host "  Frontend:  http://localhost:3000       " -ForegroundColor Green
Write-Host "  Backend:   http://localhost:3001       " -ForegroundColor Green
Write-Host "  Swagger:   http://localhost:3001/api   " -ForegroundColor Green
Write-Host "  MinIO:     http://localhost:9001       " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Se abrieron 2 ventanas nuevas de PowerShell." -ForegroundColor White
Write-Host "Espera ~30 segundos a que el backend termine de iniciar." -ForegroundColor White
Write-Host ""
Read-Host "Presiona ENTER para cerrar esta ventana"
