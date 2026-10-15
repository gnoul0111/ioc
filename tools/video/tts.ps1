# Gọi tts.py lặp lại (mỗi lần 1 tiến trình mới) tới khi đủ giọng cho mọi câu.
# .\tts.ps1 <lines.json> <outdir>
param([string]$Lines, [string]$OutDir, [int]$MaxTries = 40)
$py = Join-Path $PSScriptRoot 'tts.py'
for ($i = 0; $i -lt $MaxTries; $i++) {
  python -I -X utf8 $py $Lines $OutDir
  if ($LASTEXITCODE -eq 0) { exit 0 }
  Start-Sleep -Seconds 4
}
Write-Output "Hết lượt thử, vẫn còn câu thiếu giọng"
exit 1
