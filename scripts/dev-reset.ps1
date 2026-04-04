$ErrorActionPreference = 'Stop'

function Stop-PortProcess {
  param(
    [Parameter(Mandatory = $true)]
    [int]$Port
  )

  $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
  if (-not $connections) {
    Write-Host "Port $Port is already free."
    return
  }

  $processIds = $connections | Select-Object -ExpandProperty OwningProcess -Unique
  foreach ($processId in $processIds) {
    try {
      Stop-Process -Id $processId -Force -ErrorAction Stop
      Write-Host "Stopped process $processId on port $Port."
    } catch {
      Write-Warning "Could not stop process $processId on port ${Port}: $($_.Exception.Message)"
    }
  }
}

Stop-PortProcess -Port 3000
Stop-PortProcess -Port 8080

$env:PORT = '3000'
$env:FRONTEND_URL = 'http://localhost:8080'
$env:VITE_API_URL = 'http://localhost:3000/api/v1'
$env:VITE_SOCKET_URL = 'http://localhost:3000'

Write-Host 'Starting backend on http://localhost:3000 and frontend on http://localhost:8080 ...'
npm run dev:services
