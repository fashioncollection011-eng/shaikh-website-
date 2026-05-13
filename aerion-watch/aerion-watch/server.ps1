$port = 8080
$endpoint = [System.Net.IPAddress]::Any
$listener = New-Object System.Net.Sockets.TcpListener($endpoint, $port)
try {
    $listener.Start()
    Write-Host "Server started on http://10.75.136.129:$port/"
    while ($true) {
        $client = $listener.AcceptTcpClient()
        $stream = $client.GetStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $request = $reader.ReadLine()
        
        if ($request -match "GET") {
            if (Test-Path "index.html") {
                $html = [System.IO.File]::ReadAllText("index.html")
                $header = "HTTP/1.1 200 OK`r`nContent-Type: text/html; charset=utf-8`r`nContent-Length: $([System.Text.Encoding]::UTF8.GetByteCount($html))`r`nConnection: close`r`n`r`n"
                $hBuffer = [System.Text.Encoding]::UTF8.GetBytes($header)
                $stream.Write($hBuffer, 0, $hBuffer.Length)
                $bBuffer = [System.Text.Encoding]::UTF8.GetBytes($html)
                $stream.Write($bBuffer, 0, $bBuffer.Length)
            }
        }
        $client.Close()
    }
} finally {
    $listener.Stop()
}
