# Quay song song: chia video thành N đoạn (mỗi đoạn 1 trình duyệt), rồi nối lại không mã hóa lại.
# .\render-par.ps1 -Comp comp/full.html -Out full/video_silent.mp4 -Duration 191.2 [-N 4] [-Fps 60]
param([string]$Comp, [string]$Out, [double]$Duration, [int]$N = 4, [int]$Fps = 60)
$dir = Join-Path (Split-Path $Out) 'parts'
New-Item -ItemType Directory -Force $dir | Out-Null
# ranh giới đoạn làm tròn theo số khung để nối khít
$frames = [math]::Round($Duration * $Fps)
$per = [math]::Ceiling($frames / $N)
$jobs = @()
for ($i = 0; $i -lt $N; $i++) {
  $f0 = $i * $per; $f1 = [math]::Min($frames, ($i + 1) * $per)
  if ($f0 -ge $f1) { break }
  $from = $f0 / $Fps; $to = $f1 / $Fps
  $part = Join-Path $dir ("part{0}.mp4" -f $i)
  $log = Join-Path $dir ("part{0}.log" -f $i)
  $jobs += Start-Process -FilePath node -ArgumentList @('render.js', $Comp, $part, '--fps', $Fps, '--from', $from, '--to', $to, '--port', (5190 + $i)) -WorkingDirectory $PSScriptRoot -RedirectStandardOutput $log -NoNewWindow -PassThru
}
$jobs | Wait-Process
$list = Join-Path $dir 'list.txt'
Get-ChildItem $dir -Filter 'part*.mp4' | Sort-Object Name | ForEach-Object { "file '$($_.Name)'" } | Out-File -Encoding ascii $list
$ff = python -I -c "import imageio_ffmpeg as f;print(f.get_ffmpeg_exe())"
& $ff -y -loglevel error -f concat -safe 0 -i $list -c copy $Out
Write-Output "Xong: $Out"

