@echo off
title ChromaPulse Local Server
echo ============================================================
echo Starting ChromaPulse Web Toy Local Server...
echo Open your browser at: http://localhost:8080
echo Press Ctrl+C to stop the server.
echo ============================================================
powershell -NoProfile -ExecutionPolicy Bypass -Command "$listener = New-Object System.Net.HttpListener; $listener.Prefixes.Add('http://localhost:8080/'); $listener.Start(); Write-Host 'Server running at http://localhost:8080/'; Start-Process 'http://localhost:8080/'; while ($listener.IsListening) { $context = $listener.GetContext(); $req = $context.Request; $res = $context.Response; $path = $req.Url.LocalPath; if ($path -eq '/') { $path = '/index.html' }; $local = Join-Path (Get-Location) $path.TrimStart('/'); if (Test-Path $local -PathType Leaf) { $bytes = [System.IO.File]::ReadAllBytes($local); $ext = [System.IO.Path]::GetExtension($local); if ($ext -eq '.html') { $res.ContentType = 'text/html' } elseif ($ext -eq '.js') { $res.ContentType = 'application/javascript' } elseif ($ext -eq '.css') { $res.ContentType = 'text/css' } elseif ($ext -eq '.mp3') { $res.ContentType = 'audio/mpeg' } elseif ($ext -eq '.png') { $res.ContentType = 'image/png' }; $res.ContentLength64 = $bytes.Length; $res.OutputStream.Write($bytes, 0, $bytes.Length) } else { $res.StatusCode = 404 }; $res.OutputStream.Close() }"
pause
