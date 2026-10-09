# POS 360 - instala la impresion directa en esta PC.
#
# Se corre una vez, en PowerShell, en la computadora que tiene la termica:
#   irm https://sanjuantecnologia.com/shop/app/impresora/instalar.ps1 | iex
#
# Baja el programa a %LOCALAPPDATA%\POS360, anota la impresora termica, lo deja
# arrancando con Windows y lo prende. Correrlo de nuevo actualiza el programa.
# No pide permisos de administrador. Solo ASCII (ver pos360-impresora.ps1).

& {
    $Origen   = 'https://sanjuantecnologia.com/shop/app/impresora'
    $Carpeta  = Join-Path $env:LOCALAPPDATA 'POS360'
    $Programa = Join-Path $Carpeta 'pos360-impresora.ps1'
    $PS       = Join-Path $PSHOME 'powershell.exe'

    try {
        New-Item -ItemType Directory -Force -Path $Carpeta | Out-Null
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -UseBasicParsing "$Origen/pos360-impresora.ps1" -OutFile $Programa
    } catch {
        Write-Host "No se pudo bajar el programa: $($_.Exception.Message)" -ForegroundColor Red
        return
    }

    # La termica, si se la reconoce por el nombre; si no, la predeterminada.
    $todas = @(Get-CimInstance Win32_Printer)
    $elegida = $todas | Where-Object { $_.Name -match 'POS|Hasar|Termica|Thermal|Receipt|Ticket|80mm|58mm|TM-|XP-|IT-?0' } | Select-Object -First 1
    if (-not $elegida) { $elegida = $todas | Where-Object { $_.Default } | Select-Object -First 1 }
    if (-not $elegida) { Write-Host 'No hay impresoras instaladas en esta PC.' -ForegroundColor Red; return }
    Set-Content -Path (Join-Path $Carpeta 'impresora.txt') -Value $elegida.Name

    # Arranque con Windows: un acceso directo en la carpeta Inicio del usuario.
    $argumentos = "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$Programa`""
    $shell = New-Object -ComObject WScript.Shell
    $acceso = $shell.CreateShortcut((Join-Path ([Environment]::GetFolderPath('Startup')) 'POS360 impresora.lnk'))
    $acceso.TargetPath = $PS
    $acceso.Arguments = $argumentos
    $acceso.WindowStyle = 7
    $acceso.Save()

    # Si ya estaba corriendo una version anterior, se cierra y arranca la nueva.
    Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" |
        Where-Object { $_.CommandLine -like '*pos360-impresora.ps1*' } |
        ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
    Start-Sleep -Milliseconds 500
    Start-Process -FilePath $PS -ArgumentList $argumentos -WindowStyle Hidden

    $estado = $null
    for ($i = 0; $i -lt 10 -and -not $estado; $i++) {
        Start-Sleep -Seconds 1
        try { $estado = Invoke-RestMethod -UseBasicParsing 'http://127.0.0.1:17891/estado' } catch { }
    }
    if ($estado) {
        Write-Host ''
        Write-Host "Listo. POS 360 imprime directo en: $($estado.impresora)" -ForegroundColor Green
        Write-Host 'En POS 360: Impresion > Directa > Ticket de prueba.'
    } else {
        Write-Host 'El programa no respondio. Revisar el registro en:' -ForegroundColor Red
        Write-Host (Join-Path $Carpeta 'registro.txt')
    }
}
