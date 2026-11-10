# Craft - build script
#
# Downloads dependencies into libs/ on first run, then compiles src/ into out/.
# No Maven or Gradle required; only a JDK on PATH.

$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$root = $PSScriptRoot
$libs = Join-Path $root 'libs'
$out  = Join-Path $root 'out'
$src  = Join-Path $root 'src'

$LWJGL_VERSION = '3.3.6'
$JOML_VERSION  = '1.10.9'
$REPO          = 'https://repo1.maven.org/maven2'

$lwjglModules = @('lwjgl', 'lwjgl-glfw', 'lwjgl-opengl', 'lwjgl-stb', 'lwjgl-openal')

# ---------------------------------------------------------------- dependencies

$downloads = New-Object System.Collections.ArrayList
foreach ($m in $lwjglModules) {
    foreach ($classifier in @('', '-natives-windows')) {
        $name = "$m-$LWJGL_VERSION$classifier.jar"
        [void]$downloads.Add(@{
            File = $name
            Url  = "$REPO/org/lwjgl/$m/$LWJGL_VERSION/$name"
        })
    }
}
[void]$downloads.Add(@{
    File = "joml-$JOML_VERSION.jar"
    Url  = "$REPO/org/joml/joml/$JOML_VERSION/joml-$JOML_VERSION.jar"
})

if (-not (Test-Path $libs)) { New-Item -ItemType Directory -Path $libs | Out-Null }

$fetched = 0
foreach ($d in $downloads) {
    $dest = Join-Path $libs $d.File
    if (Test-Path $dest) { continue }

    Write-Host "  fetching $($d.File)"
    $tmp = "$dest.part"
    try {
        Invoke-WebRequest -Uri $d.Url -OutFile $tmp -UseBasicParsing
        Move-Item -Path $tmp -Destination $dest -Force
        $fetched++
    } catch {
        if (Test-Path $tmp) { Remove-Item $tmp -Force }
        Write-Host ''
        Write-Host "Failed to download $($d.File)" -ForegroundColor Red
        Write-Host "  from $($d.Url)" -ForegroundColor Red
        Write-Host "  $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

if ($fetched -gt 0) {
    Write-Host "Downloaded $fetched dependencies into libs/" -ForegroundColor Green
}

# -------------------------------------------------------------------- compile

$sources = @(Get-ChildItem -Path $src -Filter *.java -Recurse | ForEach-Object { $_.FullName })
if ($sources.Count -eq 0) {
    Write-Host 'No Java sources found under src/' -ForegroundColor Red
    exit 1
}

if (Test-Path $out) { Remove-Item -Recurse -Force $out }
New-Item -ItemType Directory -Path $out | Out-Null

# javac argfiles treat backslash as an escape character, so use forward slashes.
# Write without a BOM: PowerShell 5.1's -Encoding utf8 emits one, and javac would read
# it as part of the first filename.
$argfile = Join-Path $out 'sources.txt'
$lines = $sources | ForEach-Object { '"' + ($_ -replace '\\', '/') + '"' }
[System.IO.File]::WriteAllLines($argfile, $lines, (New-Object System.Text.UTF8Encoding($false)))

& javac -d $out -cp "$libs\*" -encoding UTF-8 --release 17 -nowarn "@$argfile"
if ($LASTEXITCODE -ne 0) {
    Write-Host 'Compilation failed.' -ForegroundColor Red
    exit 1
}

Remove-Item $argfile -Force
Write-Host "Compiled $($sources.Count) source files into out/" -ForegroundColor Green
Write-Host 'Run the game with:  .\run.bat'
