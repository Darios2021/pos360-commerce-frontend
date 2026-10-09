# POS 360 - impresion directa en la termica del mostrador.
#
# Copia del programa de Sazonik (sazonik/public/impresora), con puerto,
# carpeta y origenes propios: los dos pueden convivir en la misma PC.
#
# Por el navegador, el ticket le llega a la impresora como una imagen y la
# termica (4 KB de memoria, 220 mm/s) se queda sin datos a mitad de renglon:
# salen lineas partidas. Este programa recibe de la web el ticket ya armado
# como texto ESC/POS (src/modules/pos/utils/escpos.js) y se lo pasa a la impresora en crudo
# (RAW), sin el driver de Windows de por medio.
#
# Escucha SOLO en 127.0.0.1:17891 (no se ve desde la red) y solo acepta
# pedidos de las paginas de POS 360.
#   GET  /estado    -> {"ok":true,"impresora":"...","version":"1"}
#   POST /imprimir  -> cuerpo: los bytes en base64
#
# Se instala con instalar.ps1 y arranca solo con Windows.
# El archivo va solo en ASCII: PowerShell 5.1 lee los .ps1 sin BOM como ANSI.

$Puerto  = 17891
$Version = '1'
$Carpeta = Join-Path $env:LOCALAPPDATA 'POS360'
$Config  = Join-Path $Carpeta 'impresora.txt'
$Registro = Join-Path $Carpeta 'registro.txt'

$Permitidos = '^(https://(www\.)?sanjuantecnologia\.com|https://pos360-frontend\.cingulado\.org|http://(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?)$'

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class Pos360Crudo {
    const string W = "winspool.drv";
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public class DOCINFO { public string pDocName; public string pOutputFile; public string pDataType; }
    [DllImport(W, CharSet = CharSet.Unicode, SetLastError = true)] static extern bool OpenPrinter(string n, out IntPtr h, IntPtr d);
    [DllImport(W, SetLastError = true)] static extern bool ClosePrinter(IntPtr h);
    [DllImport(W, CharSet = CharSet.Unicode, SetLastError = true)] static extern int StartDocPrinter(IntPtr h, int l, DOCINFO d);
    [DllImport(W, SetLastError = true)] static extern bool EndDocPrinter(IntPtr h);
    [DllImport(W, SetLastError = true)] static extern bool StartPagePrinter(IntPtr h);
    [DllImport(W, SetLastError = true)] static extern bool EndPagePrinter(IntPtr h);
    [DllImport(W, SetLastError = true)] static extern bool WritePrinter(IntPtr h, byte[] b, int n, out int w);
    public static string Enviar(string impresora, byte[] datos) {
        IntPtr h;
        if (!OpenPrinter(impresora, out h, IntPtr.Zero)) return "ERROR al abrir la impresora (" + Marshal.GetLastWin32Error() + ")";
        try {
            DOCINFO d = new DOCINFO(); d.pDocName = "POS360 ticket"; d.pDataType = "RAW";
            if (StartDocPrinter(h, 1, d) == 0) return "ERROR al iniciar (" + Marshal.GetLastWin32Error() + ")";
            StartPagePrinter(h);
            int w; bool ok = WritePrinter(h, datos, datos.Length, out w);
            EndPagePrinter(h); EndDocPrinter(h);
            return ok ? "OK" : "ERROR al escribir (" + Marshal.GetLastWin32Error() + ")";
        } finally { ClosePrinter(h); }
    }
}
"@

function Anotar([string]$texto) {
    try {
        if ((Test-Path $Registro) -and (Get-Item $Registro).Length -gt 200KB) { Remove-Item $Registro -Force }
        Add-Content -Path $Registro -Value ((Get-Date -Format 'yyyy-MM-dd HH:mm:ss') + ' ' + $texto)
    } catch { }
}

function Obtener-Impresora {
    if (Test-Path $Config) {
        $n = (Get-Content $Config -TotalCount 1)
        if ($n) { return $n.Trim() }
    }
    $p = Get-CimInstance Win32_Printer | Where-Object { $_.Default } | Select-Object -First 1
    if ($p) { return $p.Name }
    return ''
}

function Leer-Pedido($s) {
    $buf = New-Object byte[] 65536
    $ms = New-Object IO.MemoryStream
    $fin = -1
    $txt = ''
    while ($fin -lt 0) {
        $n = $s.Read($buf, 0, $buf.Length)
        if ($n -le 0) { return $null }
        $ms.Write($buf, 0, $n)
        $txt = [Text.Encoding]::ASCII.GetString($ms.ToArray())
        $fin = $txt.IndexOf("`r`n`r`n")
        if ($ms.Length -gt 2MB) { return $null }
    }
    $lineas = $txt.Substring(0, $fin) -split "`r`n"
    $primera = $lineas[0] -split ' '
    $cab = @{}
    foreach ($l in ($lineas | Select-Object -Skip 1)) {
        $i = $l.IndexOf(':')
        if ($i -gt 0) { $cab[$l.Substring(0, $i).Trim().ToLower()] = $l.Substring($i + 1).Trim() }
    }
    $largo = 0
    if ($cab['content-length']) { $largo = [int]$cab['content-length'] }
    if ($largo -gt 2MB) { return $null }
    $inicio = $fin + 4
    while (($ms.Length - $inicio) -lt $largo) {
        $n = $s.Read($buf, 0, $buf.Length)
        if ($n -le 0) { break }
        $ms.Write($buf, 0, $n)
    }
    $todo = $ms.ToArray()
    $cuerpo = [Text.Encoding]::ASCII.GetString($todo, $inicio, [Math]::Min($largo, $todo.Length - $inicio))
    return @{ metodo = $primera[0]; ruta = $primera[1]; cab = $cab; cuerpo = $cuerpo }
}

function Responder($s, [int]$codigo, [string]$estado, [string]$cuerpo, [string]$origen) {
    $h = "HTTP/1.1 $codigo $estado`r`n"
    if ($origen) {
        $h += "Access-Control-Allow-Origin: $origen`r`nVary: Origin`r`n"
        $h += "Access-Control-Allow-Methods: GET, POST, OPTIONS`r`n"
        $h += "Access-Control-Allow-Headers: content-type`r`n"
        $h += "Access-Control-Allow-Private-Network: true`r`n"
    }
    $b = [Text.Encoding]::UTF8.GetBytes($cuerpo)
    $h += "Content-Type: application/json; charset=utf-8`r`nCache-Control: no-store`r`n"
    $h += "Content-Length: $($b.Length)`r`nConnection: close`r`n`r`n"
    $hb = [Text.Encoding]::ASCII.GetBytes($h)
    $s.Write($hb, 0, $hb.Length)
    if ($b.Length) { $s.Write($b, 0, $b.Length) }
    $s.Flush()
}

$escucha = New-Object Net.Sockets.TcpListener([Net.IPAddress]::Loopback, $Puerto)
try { $escucha.Start() } catch { Anotar "El puerto $Puerto ya esta en uso: hay otro programa corriendo."; exit 0 }
Anotar "Arranca, version $Version, impresora: $(Obtener-Impresora)"

while ($true) {
    $cliente = $null
    try {
        $cliente = $escucha.AcceptTcpClient()
        $cliente.ReceiveTimeout = 5000
        $cliente.SendTimeout = 5000
        $s = $cliente.GetStream()
        $p = Leer-Pedido $s
        if ($p) {
            $origen = $p.cab['origin']
            if ($origen -and ($origen -notmatch $Permitidos)) {
                Responder $s 403 'Forbidden' '{"ok":false,"error":"origen no permitido"}' $null
            } elseif ($p.metodo -eq 'OPTIONS') {
                Responder $s 204 'No Content' '' $origen
            } elseif ($p.metodo -eq 'GET' -and $p.ruta -eq '/estado') {
                $j = @{ ok = $true; impresora = (Obtener-Impresora); version = $Version } | ConvertTo-Json -Compress
                Responder $s 200 'OK' $j $origen
            } elseif ($p.metodo -eq 'POST' -and $p.ruta -eq '/imprimir') {
                $datos = [Convert]::FromBase64String($p.cuerpo.Trim())
                $res = [Pos360Crudo]::Enviar((Obtener-Impresora), $datos)
                if ($res -ne 'OK') { Anotar $res }
                $j = @{ ok = ($res -eq 'OK'); detalle = $res } | ConvertTo-Json -Compress
                Responder $s 200 'OK' $j $origen
            } else {
                Responder $s 404 'Not Found' '{"ok":false,"error":"ruta"}' $origen
            }
        }
    } catch {
        Anotar ("Error: " + $_.Exception.Message)
    } finally {
        if ($cliente) { $cliente.Close() }
    }
}
