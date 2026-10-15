# Open the docx in Word: update the table of contents + page numbers, save, optionally export PDF for preview.
# Usage (from ioc root):  Start-Process powershell -ArgumentList '-ExecutionPolicy','Bypass','-File','tools\vhtt_doc_finalize.ps1','-Docx',"$PWD\docs\VHTT_SoVanHoaTheThao\VHTT_MO_TA_CHI_TIEU.docx",'-Pdf','<out.pdf>' -Wait
# (Word COM must run in its own process; paths are passed as arguments because PowerShell 5 misreads non-ASCII text in .ps1 files.)
param([Parameter(Mandatory = $true)][string]$Docx, [string]$Pdf = "", [string]$Log = "")
$ErrorActionPreference = 'Stop'
function L($m) { if ($Log) { $m | Out-File -FilePath $Log -Append -Encoding utf8 } }
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
try {
  $d = $word.Documents.Open($Docx, $false, $false, $false)
  L "opened"
  foreach ($t in $d.TablesOfContents) { $t.Update() }
  $d.Repaginate()
  foreach ($t in $d.TablesOfContents) { $t.UpdatePageNumbers() }
  $d.Save()
  L ("saved, pages " + $d.ComputeStatistics(2))
  if ($Pdf) { $d.ExportAsFixedFormat($Pdf, 17); L "pdf" }
  $d.Close()
} catch { L ("ERROR " + $_.Exception.Message) } finally { $word.Quit() }
