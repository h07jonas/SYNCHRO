# ==============================================================================
# UNIVERSAL GIT MANAGER GUI (Antigravity 2)
# Projektunabhängiges, grafisches All-in-One Git-Tool für Windows.
# Automatische Erkennung von Pfaden, Remotes, Branches und Datei-Status.
# Bietet automatische Initialisierung für neue, git-lose Projektordner.
# ==============================================================================

[System.Windows.Forms.Application]::EnableVisualStyles()
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# UTF-8 Encoding für Konsole erzwingen
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# ------------------------------------------------------------------------------
# 1. Pfad- und Git-Erkennung (Dynamisch & Projektunabhängig)
# ------------------------------------------------------------------------------
if ($MyInvocation.MyCommand.Path) {
    $ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
} else {
    $ScriptPath = Get-Location
}
Set-Location $ScriptPath

# Prüfen, ob Git im aktuellen Ordner aktiv ist
function Test-GitRepository {
    return (Test-Path ".git")
}

# ------------------------------------------------------------------------------
# 2. GUI Form Design & Farbpalette (Premium Dark Theme / Cyberpunk Blue)
# ------------------------------------------------------------------------------
$ColorBg = [System.Drawing.Color]::FromArgb(24, 24, 26)           # Tiefdunkler Hintergrund
$ColorPanel = [System.Drawing.Color]::FromArgb(36, 36, 40)        # Panele / Eingabefelder
$ColorConsole = [System.Drawing.Color]::FromArgb(14, 14, 16)      # Konsolen-Log (Tiefschwarz)
$ColorText = [System.Drawing.Color]::FromArgb(235, 235, 240)      # Haupttext (Off-White)
$ColorAccent = [System.Drawing.Color]::FromArgb(0, 150, 255)      # Neon-Blau (Interaktionsfarbe)
$ColorGreen = [System.Drawing.Color]::FromArgb(46, 117, 89)       # Erfolg / Aktiv (Grün)
$ColorRed = [System.Drawing.Color]::FromArgb(180, 50, 50)         # Fehler / Warnung (Rot)
$ColorGray = [System.Drawing.Color]::FromArgb(120, 120, 125)      # Deaktivierter / Sekundärer Text

# Hauptfenster erstellen
$Form = New-Object System.Windows.Forms.Form
$Form.Text = "Antigravity 2 - Universal Git Controller"
$Form.Size = New-Object System.Drawing.Size(1020, 780)
$Form.StartPosition = "CenterScreen"
$Form.BackColor = $ColorBg
$Form.ForeColor = $ColorText
$Form.MinimumSize = New-Object System.Drawing.Size(950, 680)

# Typografische Hierarchie
$FontTitle = New-Object System.Drawing.Font("Segoe UI", 13, [System.Drawing.FontStyle]::Bold)
$FontHeader = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)
$FontRegular = New-Object System.Drawing.Font("Segoe UI", 9.5)
$FontConsole = New-Object System.Drawing.Font("Consolas", 9.5)

# ------------------------------------------------------------------------------
# 3. Hilfsfunktionen für Log & Git-Prozesse
# ------------------------------------------------------------------------------
function Write-Log {
    param(
        [string]$Message,
        [System.Drawing.Color]$Color = [System.Drawing.Color]::LightGray
    )
    $txtConsole.SelectionStart = $txtConsole.TextLength
    $txtConsole.SelectionLength = 0
    $txtConsole.SelectionColor = $Color
    $txtConsole.AppendText($Message + "`r`n")
    $txtConsole.ScrollToCaret()
}

function Invoke-Git {
    param([string]$ArgsString)
    $pinfo = New-Object System.Diagnostics.ProcessStartInfo
    $pinfo.FileName = "git"
    $pinfo.Arguments = $ArgsString
    $pinfo.UseShellExecute = $false
    $pinfo.RedirectStandardOutput = $true
    $pinfo.RedirectStandardError = $true
    $pinfo.CreateNoWindow = $true
    
    # UTF-8 Unterstützung für Git Ausgaben erzwingen
    try {
        $pinfo.StandardOutputEncoding = [System.Text.Encoding]::UTF8
        $pinfo.StandardErrorEncoding = [System.Text.Encoding]::UTF8
    } catch {}
    
    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = $pinfo
    
    try {
        $process.Start() | Out-Null
        $stdout = $process.StandardOutput.ReadToEnd()
        $stderr = $process.StandardError.ReadToEnd()
        $process.WaitForExit()
        
        return [PSCustomObject]@{
            ExitCode = $process.ExitCode
            Output = $stdout.Trim()
            Error = $stderr.Trim()
        }
    } catch {
        return [PSCustomObject]@{
            ExitCode = -1
            Output = ""
            Error = "Git ist auf diesem Computer nicht installiert oder im PATH nicht verfügbar."
        }
    }
}

# ------------------------------------------------------------------------------
# 4. GUI-Layout & Steuerelemente
# ------------------------------------------------------------------------------

# Header / Titel-Sektion
$lblTitle = New-Object System.Windows.Forms.Label
$lblTitle.Text = "UNIVERSAL GIT CONTROLLER (ANTIGRAVITY 2)"
$lblTitle.Font = $FontTitle
$lblTitle.ForeColor = $ColorAccent
$lblTitle.Location = New-Object System.Drawing.Point(20, 15)
$lblTitle.Size = New-Object System.Drawing.Size(960, 30)
$Form.Controls.Add($lblTitle)

$lblPath = New-Object System.Windows.Forms.Label
$lblPath.Text = "Arbeitsverzeichnis: $ScriptPath"
$lblPath.Font = $FontRegular
$lblPath.ForeColor = $ColorGray
$lblPath.Location = New-Object System.Drawing.Point(20, 45)
$lblPath.Size = New-Object System.Drawing.Size(960, 20)
$Form.Controls.Add($lblPath)

# INTERAKTIVES INITIALISIERUNGS-PANEL (Wird nur angezeigt, wenn kein .git Ordner existiert)
$panelInit = New-Object System.Windows.Forms.Panel
$panelInit.Location = New-Object System.Drawing.Point(20, 75)
$panelInit.Size = New-Object System.Drawing.Size(960, 110)
$panelInit.BackColor = $ColorPanel
$panelInit.Visible = $false
$Form.Controls.Add($panelInit)

$lblInitTitle = New-Object System.Windows.Forms.Label
$lblInitTitle.Text = "DYNAMISCHER GIT-ASSISTENT: Projekt ist noch nicht initialisiert!"
$lblInitTitle.Font = $FontHeader
$lblInitTitle.ForeColor = $ColorRed
$lblInitTitle.Location = New-Object System.Drawing.Point(15, 15)
$lblInitTitle.Size = New-Object System.Drawing.Size(600, 20)
$panelInit.Controls.Add($lblInitTitle)

$lblInitUrl = New-Object System.Windows.Forms.Label
$lblInitUrl.Text = "GitHub Repository URL (Optional):"
$lblInitUrl.Font = $FontRegular
$lblInitUrl.Location = New-Object System.Drawing.Point(15, 45)
$lblInitUrl.Size = New-Object System.Drawing.Size(250, 20)
$panelInit.Controls.Add($lblInitUrl)

$txtInitUrl = New-Object System.Windows.Forms.TextBox
$txtInitUrl.Location = New-Object System.Drawing.Point(15, 70)
$txtInitUrl.Size = New-Object System.Drawing.Size(550, 25)
$txtInitUrl.BackColor = $ColorBg
$txtInitUrl.ForeColor = $ColorText
$txtInitUrl.BorderStyle = "FixedSingle"
$txtInitUrl.Font = $FontRegular
$panelInit.Controls.Add($txtInitUrl)

$btnInitRun = New-Object System.Windows.Forms.Button
$btnInitRun.Text = "Repository initialisieren"
$btnInitRun.Location = New-Object System.Drawing.Point(585, 45)
$btnInitRun.Size = New-Object System.Drawing.Size(355, 50)
$btnInitRun.BackColor = $ColorGreen
$btnInitRun.FlatStyle = "Flat"
$btnInitRun.FlatAppearance.BorderSize = 0
$btnInitRun.Font = $FontHeader
$btnInitRun.TextAlign = [System.Drawing.ContentAlignment]::MiddleLeft
$btnInitRun.Padding = New-Object System.Windows.Forms.Padding(45, 0, 0, 0)
$panelInit.Controls.Add($btnInitRun)


# STANDARD-PROJEKT-PANEL (Wird angezeigt, wenn Git aktiv ist)
$panelMain = New-Object System.Windows.Forms.Panel
$panelMain.Location = New-Object System.Drawing.Point(20, 75)
$panelMain.Size = New-Object System.Drawing.Size(960, 110)
$panelMain.BackColor = $ColorPanel
$panelMain.Visible = $false
$Form.Controls.Add($panelMain)

$lblRepoInfoTitle = New-Object System.Windows.Forms.Label
$lblRepoInfoTitle.Text = "AKTIVES REPOSITORY STATUS"
$lblRepoInfoTitle.Font = $FontHeader
$lblRepoInfoTitle.ForeColor = $ColorGreen
$lblRepoInfoTitle.Location = New-Object System.Drawing.Point(15, 15)
$lblRepoInfoTitle.Size = New-Object System.Drawing.Size(300, 20)
$panelMain.Controls.Add($lblRepoInfoTitle)

$lblRemoteInfo = New-Object System.Windows.Forms.Label
$lblRemoteInfo.Text = "GitHub Remote-Ziel: Nicht verknüpft"
$lblRemoteInfo.Font = $FontRegular
$lblRemoteInfo.ForeColor = $ColorText
$lblRemoteInfo.Location = New-Object System.Drawing.Point(15, 45)
$lblRemoteInfo.Size = New-Object System.Drawing.Size(600, 20)
$panelMain.Controls.Add($lblRemoteInfo)

$btnChangeRemote = New-Object System.Windows.Forms.Button
$btnChangeRemote.Text = "GitHub-Link $([char]228)ndern"
$btnChangeRemote.Location = New-Object System.Drawing.Point(15, 70)
$btnChangeRemote.Size = New-Object System.Drawing.Size(180, 28)
$btnChangeRemote.BackColor = $ColorBg
$btnChangeRemote.FlatStyle = "Flat"
$btnChangeRemote.FlatAppearance.BorderSize = 0
$btnChangeRemote.Font = $FontRegular
$btnChangeRemote.TextAlign = [System.Drawing.ContentAlignment]::MiddleLeft
$btnChangeRemote.Padding = New-Object System.Windows.Forms.Padding(25, 0, 0, 0)
$panelMain.Controls.Add($btnChangeRemote)


# ARBEITSBEREICH: Dateien & Steuerung
$lblFiles = New-Object System.Windows.Forms.Label
$lblFiles.Text = "Dateiauswahl (Staging):"
$lblFiles.Font = $FontHeader
$lblFiles.Location = New-Object System.Drawing.Point(20, 200)
$lblFiles.Size = New-Object System.Drawing.Size(450, 20)
$Form.Controls.Add($lblFiles)

# Geänderte Dateien Liste
$FileListBox = New-Object System.Windows.Forms.CheckedListBox
$FileListBox.Location = New-Object System.Drawing.Point(20, 230)
$FileListBox.Size = New-Object System.Drawing.Size(450, 240)
$FileListBox.BackColor = $ColorPanel
$FileListBox.ForeColor = $ColorText
$FileListBox.BorderStyle = "FixedSingle"
$FileListBox.Font = $FontRegular
$FileListBox.Anchor = "Top, Bottom, Left"
$FileListBox.CheckOnClick = $true
$Form.Controls.Add($FileListBox)

# Schnellauswahl-Buttons
$btnSelectAll = New-Object System.Windows.Forms.Button
$btnSelectAll.Text = "Alle ausw$([char]228)hlen"
$btnSelectAll.Location = New-Object System.Drawing.Point(20, 480)
$btnSelectAll.Size = New-Object System.Drawing.Size(215, 28)
$btnSelectAll.BackColor = $ColorPanel
$btnSelectAll.FlatStyle = "Flat"
$btnSelectAll.FlatAppearance.BorderSize = 0
$btnSelectAll.Font = $FontRegular
$btnSelectAll.Anchor = "Bottom, Left"
$btnSelectAll.TextAlign = [System.Drawing.ContentAlignment]::MiddleLeft
$btnSelectAll.Padding = New-Object System.Windows.Forms.Padding(30, 0, 0, 0)
$Form.Controls.Add($btnSelectAll)

$btnDeselectAll = New-Object System.Windows.Forms.Button
$btnDeselectAll.Text = "Auswahl aufheben"
$btnDeselectAll.Location = New-Object System.Drawing.Point(255, 480)
$btnDeselectAll.Size = New-Object System.Drawing.Size(215, 28)
$btnDeselectAll.BackColor = $ColorPanel
$btnDeselectAll.FlatStyle = "Flat"
$btnDeselectAll.FlatAppearance.BorderSize = 0
$btnDeselectAll.Font = $FontRegular
$btnDeselectAll.Anchor = "Bottom, Left"
$btnDeselectAll.TextAlign = [System.Drawing.ContentAlignment]::MiddleLeft
$btnDeselectAll.Padding = New-Object System.Windows.Forms.Padding(30, 0, 0, 0)
$Form.Controls.Add($btnDeselectAll)


# Rechte Spalte: Steuerung & Commit
$lblBranch = New-Object System.Windows.Forms.Label
$lblBranch.Text = "Ziel-Branch:"
$lblBranch.Font = $FontHeader
$lblBranch.Location = New-Object System.Drawing.Point(490, 200)
$lblBranch.Size = New-Object System.Drawing.Size(200, 20)
$Form.Controls.Add($lblBranch)

$cmbBranches = New-Object System.Windows.Forms.ComboBox
$cmbBranches.Location = New-Object System.Drawing.Point(490, 230)
$cmbBranches.Size = New-Object System.Drawing.Size(350, 25)
$cmbBranches.BackColor = $ColorPanel
$cmbBranches.ForeColor = $ColorText
$cmbBranches.FlatStyle = "Flat"
$cmbBranches.Font = $FontRegular
$cmbBranches.DropDownStyle = "DropDownList"
$Form.Controls.Add($cmbBranches)

$btnNewBranch = New-Object System.Windows.Forms.Button
$btnNewBranch.Text = "Neu..."
$btnNewBranch.Location = New-Object System.Drawing.Point(850, 229)
$btnNewBranch.Size = New-Object System.Drawing.Size(110, 26)
$btnNewBranch.BackColor = $ColorPanel
$btnNewBranch.FlatStyle = "Flat"
$btnNewBranch.FlatAppearance.BorderSize = 0
$btnNewBranch.Font = $FontRegular
$btnNewBranch.TextAlign = [System.Drawing.ContentAlignment]::MiddleLeft
$btnNewBranch.Padding = New-Object System.Windows.Forms.Padding(25, 0, 0, 0)
$Form.Controls.Add($btnNewBranch)

$lblCommit = New-Object System.Windows.Forms.Label
$lblCommit.Text = "Commit-Beschreibung:"
$lblCommit.Font = $FontHeader
$lblCommit.Location = New-Object System.Drawing.Point(490, 270)
$lblCommit.Size = New-Object System.Drawing.Size(400, 20)
$Form.Controls.Add($lblCommit)

$txtCommitMsg = New-Object System.Windows.Forms.TextBox
$txtCommitMsg.Multiline = $true
$txtCommitMsg.ScrollBars = "Vertical"
$txtCommitMsg.Location = New-Object System.Drawing.Point(490, 300)
$txtCommitMsg.Size = New-Object System.Drawing.Size(470, 100)
$txtCommitMsg.BackColor = $ColorPanel
$txtCommitMsg.ForeColor = $ColorText
$txtCommitMsg.BorderStyle = "FixedSingle"
$txtCommitMsg.Font = $FontRegular
$txtCommitMsg.Anchor = "Top, Left, Right"
$Form.Controls.Add($txtCommitMsg)

# Aktionsbuttons
$btnRefresh = New-Object System.Windows.Forms.Button
$btnRefresh.Text = "Aktualisieren"
$btnRefresh.Location = New-Object System.Drawing.Point(490, 415)
$btnRefresh.Size = New-Object System.Drawing.Size(140, 35)
$btnRefresh.BackColor = $ColorPanel
$btnRefresh.FlatStyle = "Flat"
$btnRefresh.FlatAppearance.BorderSize = 0
$btnRefresh.Font = $FontHeader
$btnRefresh.TextAlign = [System.Drawing.ContentAlignment]::MiddleLeft
$btnRefresh.Padding = New-Object System.Windows.Forms.Padding(35, 0, 0, 0)
$Form.Controls.Add($btnRefresh)

$btnPull = New-Object System.Windows.Forms.Button
$btnPull.Text = "Herunterladen (Pull)"
$btnPull.Location = New-Object System.Drawing.Point(640, 415)
$btnPull.Size = New-Object System.Drawing.Size(160, 35)
$btnPull.BackColor = $ColorPanel
$btnPull.FlatStyle = "Flat"
$btnPull.FlatAppearance.BorderSize = 0
$btnPull.Font = $FontHeader
$btnPull.TextAlign = [System.Drawing.ContentAlignment]::MiddleLeft
$btnPull.Padding = New-Object System.Windows.Forms.Padding(35, 0, 0, 0)
$Form.Controls.Add($btnPull)

$btnPush = New-Object System.Windows.Forms.Button
$btnPush.Text = "HOCHLADEN (Commit & Push)"
$btnPush.Location = New-Object System.Drawing.Point(490, 463)
$btnPush.Size = New-Object System.Drawing.Size(470, 45)
$btnPush.BackColor = $ColorAccent
$btnPush.FlatStyle = "Flat"
$btnPush.FlatAppearance.BorderSize = 0
$btnPush.Font = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Bold)
$btnPush.Anchor = "Top, Left, Right"
$btnPush.TextAlign = [System.Drawing.ContentAlignment]::MiddleLeft
$btnPush.Padding = New-Object System.Windows.Forms.Padding(130, 0, 0, 0)
$Form.Controls.Add($btnPush)

# Konsolen Log (Unteres Panel)
$lblLog = New-Object System.Windows.Forms.Label
$lblLog.Text = "Echtzeit-Aktivit$([char]228)tsprotokoll:"
$lblLog.Font = $FontHeader
$lblLog.Location = New-Object System.Drawing.Point(20, 520)
$lblLog.Size = New-Object System.Drawing.Size(940, 20)
$lblLog.Anchor = "Bottom, Left"
$Form.Controls.Add($lblLog)

$txtConsole = New-Object System.Windows.Forms.RichTextBox
$txtConsole.Location = New-Object System.Drawing.Point(20, 545)
$txtConsole.Size = New-Object System.Drawing.Size(960, 175)
$txtConsole.BackColor = $ColorConsole
$txtConsole.ForeColor = [System.Drawing.Color]::LightGray
$txtConsole.Font = $FontConsole
$txtConsole.ReadOnly = $true
$txtConsole.BorderStyle = "None"
$txtConsole.Anchor = "Bottom, Left, Right"
$Form.Controls.Add($txtConsole)

# ------------------------------------------------------------------------------
# 5. GDI+ Vektor-Grafik-Zeichnungen (Keine Emojis)
# ------------------------------------------------------------------------------

# Refresh Button Icon (Circular Arrow)
$btnRefresh.Add_Paint({
    param($sender, $e)
    $g = $e.Graphics
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $pen = New-Object System.Drawing.Pen($ColorText, 2)
    $rect = New-Object System.Drawing.Rectangle(12, 10, 14, 14)
    $g.DrawArc($pen, $rect, -45, 270)
    
    $brush = New-Object System.Drawing.SolidBrush($ColorText)
    $p1 = New-Object System.Drawing.PointF(22, 7)
    $p2 = New-Object System.Drawing.PointF(26, 11)
    $p3 = New-Object System.Drawing.PointF(21, 14)
    $g.FillPolygon($brush, ($p1, $p2, $p3))
    
    $pen.Dispose()
    $brush.Dispose()
})

# Pull Button Icon (Downward Arrow + Bottom Line)
$btnPull.Add_Paint({
    param($sender, $e)
    $g = $e.Graphics
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $pen = New-Object System.Drawing.Pen($ColorText, 2)
    $g.DrawLine($pen, 12, 24, 26, 24)
    $g.DrawLine($pen, 19, 9, 19, 21)
    $g.DrawLine($pen, 15, 17, 19, 21)
    $g.DrawLine($pen, 23, 17, 19, 21)
    $pen.Dispose()
})

# Push Button Icon (Upward Arrow + Bottom Line)
$btnPush.Add_Paint({
    param($sender, $e)
    $g = $e.Graphics
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, 2.5)
    
    # Position relativ zu Text-Start zeichnen (ca. X = 100)
    $g.DrawLine($pen, 98, 31, 112, 31)
    $g.DrawLine($pen, 105, 31, 105, 15)
    $g.DrawLine($pen, 101, 20, 105, 15)
    $g.DrawLine($pen, 109, 20, 105, 15)
    
    $pen.Dispose()
})

# New Branch Button Icon (Fork/Tree Diagram)
$btnNewBranch.Add_Paint({
    param($sender, $e)
    $g = $e.Graphics
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $pen = New-Object System.Drawing.Pen($ColorText, 2)
    $brush = New-Object System.Drawing.SolidBrush($ColorText)
    
    $g.DrawLine($pen, 10, 18, 10, 8)
    $g.DrawBezier($pen, 10, 13, 13, 13, 14, 11, 14, 8)
    
    $g.FillEllipse($brush, 8, 16, 4, 4)
    $g.FillEllipse($brush, 8, 6, 4, 4)
    $g.FillEllipse($brush, 12, 6, 4, 4)
    
    $pen.Dispose()
    $brush.Dispose()
})

# Change Remote Button Icon (Pencil Edit Icon)
$btnChangeRemote.Add_Paint({
    param($sender, $e)
    $g = $e.Graphics
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $pen = New-Object System.Drawing.Pen($ColorText, 1.5)
    
    $g.DrawLine($pen, 8, 20, 11, 20)
    $g.DrawLine($pen, 8, 20, 8, 17)
    $g.DrawLine($pen, 8, 17, 15, 10)
    $g.DrawLine($pen, 11, 20, 18, 13)
    $g.DrawLine($pen, 15, 10, 18, 13)
    
    $pen.Dispose()
})

# Select All Button Icon (Checkmark in Box)
$btnSelectAll.Add_Paint({
    param($sender, $e)
    $g = $e.Graphics
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $pen = New-Object System.Drawing.Pen($ColorText, 1.5)
    $g.DrawRectangle($pen, 10, 7, 13, 13)
    
    $penCheck = New-Object System.Drawing.Pen($ColorGreen, 2)
    $g.DrawLine($penCheck, 13, 13, 16, 17)
    $g.DrawLine($penCheck, 16, 17, 21, 9)
    
    $pen.Dispose()
    $penCheck.Dispose()
})

# Deselect All Button Icon (Cross in Box)
$btnDeselectAll.Add_Paint({
    param($sender, $e)
    $g = $e.Graphics
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $pen = New-Object System.Drawing.Pen($ColorText, 1.5)
    $g.DrawRectangle($pen, 10, 7, 13, 13)
    
    $penCross = New-Object System.Drawing.Pen($ColorRed, 1.5)
    $g.DrawLine($penCross, 13, 10, 20, 17)
    $g.DrawLine($penCross, 20, 10, 13, 17)
    
    $pen.Dispose()
    $penCross.Dispose()
})

# Init Run Button Icon (Folder + Plus Sign)
$btnInitRun.Add_Paint({
    param($sender, $e)
    $g = $e.Graphics
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, 2)
    
    $g.DrawLine($pen, 15, 17, 23, 17)
    $g.DrawLine($pen, 23, 17, 26, 20)
    $g.DrawLine($pen, 26, 20, 35, 20)
    $g.DrawLine($pen, 35, 20, 35, 32)
    $g.DrawLine($pen, 35, 32, 15, 32)
    $g.DrawLine($pen, 15, 32, 15, 17)
    
    $g.DrawLine($pen, 21, 26, 29, 26)
    $g.DrawLine($pen, 25, 22, 25, 30)
    
    $pen.Dispose()
})


# ------------------------------------------------------------------------------
# 6. Business Logic & Git Events
# ------------------------------------------------------------------------------

# Aktualisiert die Dropdown-Auswahl für Branches
$UpdateBranches = {
    $cmbBranches.Items.Clear()
    if (-not (Test-GitRepository)) { return }
    
    # Lokale Branches auslesen
    $BranchResult = Invoke-Git "branch --format='%(refname:short)'"
    if ($BranchResult.ExitCode -eq 0) {
        $Branches = $BranchResult.Output -split "`r?`n" | Where-Object { $_ -ne "" }
        foreach ($Branch in $Branches) {
            [void]$cmbBranches.Items.Add($Branch)
        }
    }
    
    # Aktiven Branch ermitteln und selektieren
    $CurrentBranchResult = Invoke-Git "branch --show-current"
    if ($CurrentBranchResult.ExitCode -eq 0 -and $CurrentBranchResult.Output) {
        $CurrentBranch = $CurrentBranchResult.Output
        $Idx = $cmbBranches.Items.IndexOf($CurrentBranch)
        if ($Idx -ge 0) {
            $cmbBranches.SelectedIndex = $Idx
        }
    } else {
        [void]$cmbBranches.Items.Add("main")
        $cmbBranches.SelectedIndex = 0
    }
}

# Status-Update für das gesamte Verzeichnis (Git Status)
$UpdateStatus = {
    $FileListBox.Items.Clear()
    
    if (-not (Test-GitRepository)) {
        $panelInit.Visible = $true
        $panelMain.Visible = $false
        $btnPull.Enabled = $false
        $btnPush.Enabled = $false
        $btnNewBranch.Enabled = $false
        $cmbBranches.Enabled = $false
        return
    }
    
    $panelInit.Visible = $false
    $panelMain.Visible = $true
    $btnPull.Enabled = $true
    $btnPush.Enabled = $true
    $btnNewBranch.Enabled = $true
    $cmbBranches.Enabled = $true
    
    # Zeige Remote URL im Hauptpanel an
    $RemoteUrl = Invoke-Git "remote get-url origin"
    if ($RemoteUrl.ExitCode -eq 0) {
        $lblRemoteInfo.Text = "GitHub Remote-Ziel: $($RemoteUrl.Output)"
    } else {
        $lblRemoteInfo.Text = "GitHub Remote-Ziel: Kein Remote-Link ('origin') hinterlegt!"
    }
    
    # Git Status abrufen
    $GitStatus = Invoke-Git "status --porcelain"
    if ($GitStatus.ExitCode -ne 0) {
        Write-Log "Fehler beim Abrufen des Git-Status:" $ColorRed
        Write-Log $GitStatus.Error $ColorRed
        return
    }
    
    $Lines = $GitStatus.Output -split "`r?`n" | Where-Object { $_ -ne "" }
    
    if ($Lines.Count -eq 0) {
        Write-Log "Status: Alles sauber! Keine ungesicherten $([char]196)nderungen vorhanden." $ColorGreen
        return
    }
    
    foreach ($Line in $Lines) {
        $Flag = $Line.Substring(0, 2)
        $FilePath = $Line.Substring(3).Trim()
        
        $FriendlyStatus = ""
        switch -wildcard ($Flag) {
            "M*" { $FriendlyStatus = "[G$([char]228)ndert]  " }
            " M" { $FriendlyStatus = "[G$([char]228)ndert]  " }
            "A*" { $FriendlyStatus = "[Neu]       " }
            " A" { $FriendlyStatus = "[Neu]       " }
            "??" { $FriendlyStatus = "[Neu]       " }
            "D*" { $FriendlyStatus = "[Gel$([char]246)scht]  " }
            " D" { $FriendlyStatus = "[Gel$([char]246)scht]  " }
            "R*" { $FriendlyStatus = "[Umbenannt] " }
            default { $FriendlyStatus = "[Modifiziert] " }
        }
        
        $ItemText = "$FriendlyStatus $FilePath"
        $Index = $FileListBox.Items.Add($ItemText)
        $FileListBox.SetItemChecked($Index, $true)
    }
    Write-Log "Status aktualisiert. $($Lines.Count) $([char]196)nderungen gefunden." $ColorAccent
}

# Unified Refresh Action
$DoRefreshAll = {
    & $UpdateBranches
    & $UpdateStatus
}

# Pull-Event (Synchronisierung von Remote)
$DoPull = {
    $SelectedBranch = $cmbBranches.SelectedItem
    if (-not $SelectedBranch) { $SelectedBranch = "main" }
    
    Write-Log "=== START PULL: Lade $([char]196)nderungen f$([char]252)r '$SelectedBranch' herunter ===" $ColorAccent
    $Form.Enabled = $false
    
    $RemoteCheck = Invoke-Git "remote"
    if ([string]::IsNullOrEmpty($RemoteCheck.Output)) {
        Write-Log "Fehler: Es ist kein Remote-Server ('origin') mit diesem Repository verkn$([char]252)pft!" $ColorRed
        $Form.Enabled = $true
        return
    }
    
    $Result = Invoke-Git "pull origin $SelectedBranch"
    if ($Result.ExitCode -eq 0) {
        if ($Result.Output) { Write-Log $Result.Output $ColorText }
        Write-Log "=== Pull erfolgreich beendet! ===" $ColorGreen
    } else {
        if ($Result.Error) { Write-Log $Result.Error $ColorRed }
        Write-Log "Fehler beim Herunterladen." $ColorRed
    }
    
    $Form.Enabled = $true
    & $UpdateStatus
}

# Push/Commit-Event (Übertragung auf GitHub)
$DoPush = {
    $CheckedItems = $FileListBox.CheckedItems
    if ($CheckedItems.Count -eq 0) {
        [System.Windows.Forms.MessageBox]::Show("Bitte w$([char]228)hle mindestens eine Datei zum Sichern aus.", "Keine Auswahl", "OK", "Warning") | Out-Null
        return
    }
    
    $Comment = $txtCommitMsg.Text.Trim()
    if ([string]::IsNullOrEmpty($Comment)) {
        [System.Windows.Forms.MessageBox]::Show("Bitte gib einen $([char]196)nderungskommentar ein.", "Kommentar fehlt", "OK", "Warning") | Out-Null
        return
    }
    
    $SelectedBranch = $cmbBranches.SelectedItem
    if (-not $SelectedBranch) { $SelectedBranch = "main" }
    
    Write-Log "=== START UPLOAD: Sichern auf Branch '$SelectedBranch' ===" $ColorAccent
    $Form.Enabled = $false
    
    # 1. Staging der selektierten Dateien
    foreach ($Item in $CheckedItems) {
        $CleanPath = $Item -replace "^\[.*?\]\s+", ""
        if ($CleanPath -match " -> ") {
            $Parts = $CleanPath -split " -> "
            $OldPath = $Parts[0].Trim()
            $NewPath = $Parts[1].Trim()
            Write-Log "Verschiebung registrieren: $OldPath -> $NewPath"
            Invoke-Git "add `"$OldPath`""
            Invoke-Git "add `"$NewPath`""
        } else {
            Write-Log "Hinzuf$([char]252)gen: $CleanPath"
            $AddResult = Invoke-Git "add `"$CleanPath`""
            if ($AddResult.ExitCode -ne 0) {
                Write-Log "Fehler beim Hinzuf$([char]252)gen von $CleanPath" $ColorRed
            }
        }
    }
    
    # 2. Commit erzeugen
    Write-Log "Erstelle Commit..."
    $EscapedComment = $Comment -replace '"', '\"'
    $CommitResult = Invoke-Git "commit -m `"$EscapedComment`""
    
    if ($CommitResult.ExitCode -eq 0) {
        Write-Log $CommitResult.Output $ColorGreen
        
        # 3. Push ausführen
        Write-Log "Übertrage Daten zu GitHub (Push auf '$SelectedBranch')..."
        $PushResult = Invoke-Git "push origin $SelectedBranch"
        
        if ($PushResult.ExitCode -eq 0) {
            Write-Log "=== ERFOLG: $([char]196)nderungen wurden sicher auf GitHub hochgeladen! ===" $ColorGreen
            $txtCommitMsg.Text = ""
        } else {
            Write-Log "Fehler beim Hochladen zu GitHub:" $ColorRed
            Write-Log $PushResult.Error $ColorRed
            Write-Log "Hinweis: Falls es der erste Push dieses Branches ist, nutzt Git eventuell die Upstream-Zuordnung." $ColorText
        }
    } else {
        Write-Log "Fehler beim Commit:" $ColorRed
        Write-Log $CommitResult.Error $ColorRed
    }
    
    $Form.Enabled = $true
    & $UpdateStatus
    & $UpdateBranches
}

# Branch Erstellung
$DoNewBranch = {
    $NewBranchName = [Microsoft.VisualBasic.Interaction]::InputBox("Gib den Namen des neuen Branches ein (keine Leerzeichen):", "Neuer Git-Branch", "")
    $NewBranchName = $NewBranchName.Trim()
    
    if (-not [string]::IsNullOrEmpty($NewBranchName)) {
        if ($NewBranchName -match "\s") {
            [System.Windows.Forms.MessageBox]::Show("Der Branch-Name darf keine Leerzeichen enthalten.", "Eingabefehler", "OK", "Error") | Out-Null
            return
        }
        
        Write-Log "Erstelle Branch '$NewBranchName' und wechsle..." $ColorAccent
        $Result = Invoke-Git "checkout -b $NewBranchName"
        if ($Result.ExitCode -eq 0) {
            Write-Log "Branch '$NewBranchName' erfolgreich erstellt!" $ColorGreen
            & $UpdateBranches
        } else {
            Write-Log "Fehler beim Erstellen:" $ColorRed
            Write-Log $Result.Error $ColorRed
        }
    }
}

# Initialisierungs-Assistent ausführen
$DoInitRepository = {
    $Url = $txtInitUrl.Text.Trim()
    
    Write-Log "=== INITIALISIERUNG START ===" $ColorAccent
    
    # 1. git init
    $InitRes = Invoke-Git "init"
    if ($InitRes.ExitCode -eq 0) {
        Write-Log "Git-Repository erfolgreich lokal initialisiert." $ColorGreen
    } else {
        Write-Log "Fehler bei 'git init': $($InitRes.Error)" $ColorRed
        return
    }
    
    # 2. Standardbranch definieren
    Invoke-Git "config --global init.defaultBranch main" | Out-Null
    $BranchRes = Invoke-Git "branch -M main"
    if ($BranchRes.ExitCode -eq 0) {
        Write-Log "Haupt-Branch auf 'main' definiert." $ColorGreen
    }
    
    # 3. Remote URL verknüpfen (falls eingegeben)
    if (-not [string]::IsNullOrEmpty($Url)) {
        $RemoteRes = Invoke-Git "remote add origin `"$Url`""
        if ($RemoteRes.ExitCode -eq 0) {
            Write-Log "Verkn$([char]252)pft mit Remote URL: $Url" $ColorGreen
        } else {
            Write-Log "Fehler beim Verkn$([char]252)pfen der Remote URL: $($RemoteRes.Error)" $ColorRed
        }
    }
    
    # 4. Status neu einlesen
    $IsGitRepo = Test-Path ".git"
    & $UpdateBranches
    & $UpdateStatus
}

# Remote-Link bearbeiten / hinzufügen
$DoChangeRemote = {
    $CurrentRemote = ""
    $RemoteUrl = Invoke-Git "remote get-url origin"
    if ($RemoteUrl.ExitCode -eq 0) { $CurrentRemote = $RemoteUrl.Output }
    
    $NewUrl = [Microsoft.VisualBasic.Interaction]::InputBox("Gib die neue GitHub Remote-URL ein:", "GitHub-Verkn$([char]252)pfung $([char]228)ndern", $CurrentRemote)
    if ($NewUrl -ne $null) {
        $NewUrl = $NewUrl.Trim()
        
        # Bestehendes Remote löschen falls vorhanden
        if (-not [string]::IsNullOrEmpty($CurrentRemote)) {
            Invoke-Git "remote remove origin" | Out-Null
        }
        
        if (-not [string]::IsNullOrEmpty($NewUrl)) {
            $AddRes = Invoke-Git "remote add origin `"$NewUrl`""
            if ($AddRes.ExitCode -eq 0) {
                Write-Log "GitHub Remote-Link erfolgreich ge$([char]228)ndert auf: $NewUrl" $ColorGreen
                & $UpdateStatus
            } else {
                Write-Log "Fehler beim Hinzuf$([char]252)gen des Remotes: $($AddRes.Error)" $ColorRed
            }
        } else {
            Write-Log "GitHub Remote-Link gel$([char]246)scht. Es ist kein Ziel mehr hinterlegt." $ColorAccent
            & $UpdateStatus
        }
    }
}

# Schnellauswahl Buttons Click Events
$btnSelectAll.Add_Click({
    for ($i = 0; $i -lt $FileListBox.Items.Count; $i++) {
        $FileListBox.SetItemChecked($i, $true)
    }
})

$btnDeselectAll.Add_Click({
    for ($i = 0; $i -lt $FileListBox.Items.Count; $i++) {
        $FileListBox.SetItemChecked($i, $false)
    }
})


# ------------------------------------------------------------------------------
# 7. Event-Verknüpfungen & Start der GUI
# ------------------------------------------------------------------------------
$btnRefresh.Add_Click($DoRefreshAll)
$btnPull.Add_Click($DoPull)
$btnPush.Add_Click($DoPush)
$btnNewBranch.Add_Click($DoNewBranch)
$btnInitRun.Add_Click($DoInitRepository)
$btnChangeRemote.Add_Click($DoChangeRemote)

[void][System.Reflection.Assembly]::LoadWithPartialName("Microsoft.VisualBasic")

# Laden des Formulars
$Form.Add_Load({
    Write-Log "==================================================================" $ColorAccent
    Write-Log " UNIVERSAL GIT MANAGER (ANTIGRAVITY 2) GESTARTET" $ColorAccent
    Write-Log "==================================================================" $ColorAccent
    
    # Prüfen, ob Git auf dem Rechner verfügbar ist
    $GitCheck = Invoke-Git "--version"
    if ($GitCheck.ExitCode -ne 0) {
        Write-Log "KRITISCHER FEHLER: Git wurde auf diesem PC nicht im Umgebungspfad (PATH) gefunden!" $ColorRed
        Write-Log "Bitte installiere Git f$([char]252)r Windows oder f$([char]252)ge es deinem PATH hinzu." $ColorText
        $Form.Enabled = $false
        return
    }
    
    if (Test-GitRepository) {
        Write-Log "Projekt-Schnittstelle: Lokales Git-Repository erkannt." $ColorGreen
        & $UpdateBranches
        & $UpdateStatus
    } else {
        $panelInit.Visible = $true
        Write-Log "HINWEIS: Dieses Arbeitsverzeichnis ist noch kein Git-Repository!" $ColorRed
        Write-Log "Nutze den obigen Assistenten zur sofortigen Einrichtung." $ColorText
    }
})

$Form.ShowDialog() | Out-Null
