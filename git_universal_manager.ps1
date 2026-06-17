# ==============================================================================
# UNIVERSAL GIT MANAGER GUI (Antigravity 2)
# Projektunabhängiges, grafisches All-in-One Git-Tool für Windows.
# Automatische Erkennung von Pfaden, Remotes, Branches und Datei-Status.
# Bietet automatische Initialisierung für neue, git-lose Projektordner.
# Unterstützt dynamische Light/Dark-Systemthemen und .gitkeep Synchronisierung.
# ==============================================================================

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[System.Windows.Forms.Application]::EnableVisualStyles()

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
# 2. System-Theme Erkennung (Light / Dark Mode)
# ------------------------------------------------------------------------------
function Get-ThemeColors {
    $lightTheme = 1
    try {
        $regVal = Get-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Themes\Personalize" -Name "AppsUseLightTheme" -ErrorAction SilentlyContinue
        if ($regVal -ne $null) {
            $lightTheme = $regVal.AppsUseLightTheme
        }
    } catch {}
    
    if ($lightTheme -eq 0) {
        # Dark Theme
        return [PSCustomObject]@{
            Bg = [System.Drawing.Color]::FromArgb(24, 24, 26)
            Panel = [System.Drawing.Color]::FromArgb(36, 36, 40)
            Console = [System.Drawing.Color]::FromArgb(14, 14, 16)
            Text = [System.Drawing.Color]::FromArgb(235, 235, 240)
            Accent = [System.Drawing.Color]::FromArgb(0, 150, 255)
            Green = [System.Drawing.Color]::FromArgb(46, 117, 89)
            Red = [System.Drawing.Color]::FromArgb(180, 50, 50)
            Gray = [System.Drawing.Color]::FromArgb(120, 120, 125)
        }
    } else {
        # Light Theme
        return [PSCustomObject]@{
            Bg = [System.Drawing.Color]::FromArgb(244, 244, 246)
            Panel = [System.Drawing.Color]::FromArgb(255, 255, 255)
            Console = [System.Drawing.Color]::FromArgb(233, 233, 237)
            Text = [System.Drawing.Color]::FromArgb(24, 24, 26)
            Accent = [System.Drawing.Color]::FromArgb(0, 102, 204)
            Green = [System.Drawing.Color]::FromArgb(60, 140, 109)
            Red = [System.Drawing.Color]::FromArgb(217, 56, 56)
            Gray = [System.Drawing.Color]::FromArgb(122, 122, 128)
        }
    }
}

$Colors = Get-ThemeColors

# ------------------------------------------------------------------------------
# 2.1. Hilfsfunktionen f$([char]252)r Log & Git-Prozesse
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
    
    # UTF-8 Unterst$([char]252)tzung f$([char]252)r Git-Ausgaben erzwingen
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
            Output   = $stdout.TrimEnd()
            Error    = $stderr.TrimEnd()
        }
    } catch {
        return [PSCustomObject]@{
            ExitCode = -1
            Output   = ""
            Error    = "Git ist auf diesem Computer nicht installiert oder im PATH nicht verf$([char]252)gbar."
        }
    }
}

# ------------------------------------------------------------------------------
# 3. GUI Form Design & Layout
# ------------------------------------------------------------------------------
$Form = New-Object System.Windows.Forms.Form
$Form.Text = "Universal Git Manager"
$Form.Size = New-Object System.Drawing.Size(1020, 780)
$Form.StartPosition = "CenterScreen"
$Form.BackColor = $Colors.Bg
$Form.ForeColor = $Colors.Text
$Form.MinimumSize = New-Object System.Drawing.Size(950, 680)

# Typografische Hierarchie
$FontTitle = New-Object System.Drawing.Font("Segoe UI", 13, [System.Drawing.FontStyle]::Bold)
$FontHeader = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)
$FontRegular = New-Object System.Drawing.Font("Segoe UI", 9.5)
$FontConsole = New-Object System.Drawing.Font("Consolas", 9.5)

# Header / Titel-Sektion
$lblTitle = New-Object System.Windows.Forms.Label
$lblTitle.Text = "UNIVERSAL GIT MANAGER"
$lblTitle.Font = $FontTitle
$lblTitle.ForeColor = $Colors.Accent
$lblTitle.Location = New-Object System.Drawing.Point(20, 15)
$lblTitle.Size = New-Object System.Drawing.Size(960, 30)
$Form.Controls.Add($lblTitle)

$lblPath = New-Object System.Windows.Forms.Label
$lblPath.Text = "Arbeitsverzeichnis: $ScriptPath"
$lblPath.Font = $FontRegular
$lblPath.ForeColor = $Colors.Gray
$lblPath.Location = New-Object System.Drawing.Point(20, 45)
$lblPath.Size = New-Object System.Drawing.Size(960, 20)
$Form.Controls.Add($lblPath)

# TabControl Container
$TabControl = New-Object System.Windows.Forms.TabControl
$TabControl.Location = New-Object System.Drawing.Point(20, 75)
$TabControl.Size = New-Object System.Drawing.Size(960, 440)
$TabControl.DrawMode = [System.Windows.Forms.TabDrawMode]::OwnerDrawFixed
$TabControl.Font = $FontHeader
$Form.Controls.Add($TabControl)

# Custom Drawing für Tabs (Matching Theme)
$TabControl.add_DrawItem({
    param($sender, $e)
    $g = $e.Graphics
    $tab = $sender.TabPages[$e.Index]
    
    $bgBrush = New-Object System.Drawing.SolidBrush($Colors.Bg)
    $panelBrush = New-Object System.Drawing.SolidBrush($Colors.Panel)
    $textBrush = New-Object System.Drawing.SolidBrush($Colors.Text)
    
    $rect = $sender.GetTabRect($e.Index)
    if ($sender.SelectedIndex -eq $e.Index) {
        $g.FillRectangle($panelBrush, $rect)
        $accentPen = New-Object System.Drawing.Pen($Colors.Accent, 3)
        $g.DrawLine($accentPen, $rect.Left, $rect.Bottom - 1, $rect.Right, $rect.Bottom - 1)
        $accentPen.Dispose()
    } else {
        $g.FillRectangle($bgBrush, $rect)
    }
    
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
    $g.DrawString($tab.Text, $FontHeader, $textBrush, (New-Object System.Drawing.RectangleF($rect.X, $rect.Y, $rect.Width, $rect.Height)), $sf)
    
    $bgBrush.Dispose()
    $panelBrush.Dispose()
    $textBrush.Dispose()
})

# TAB 1: Git-Schnittstelle
$tabGit = New-Object System.Windows.Forms.TabPage("Git-Schnittstelle")
$tabGit.BackColor = $Colors.Panel
$TabControl.TabPages.Add($tabGit)

# TAB 2: Versionsverlauf & Commits
$tabHistory = New-Object System.Windows.Forms.TabPage("Versionsverlauf")
$tabHistory.BackColor = $Colors.Panel
$TabControl.TabPages.Add($tabHistory)

# TAB 3: Ordner- & Repo-Explorer
$tabExplorer = New-Object System.Windows.Forms.TabPage("Ordner- & Repo-Explorer")
$tabExplorer.BackColor = $Colors.Panel
$TabControl.TabPages.Add($tabExplorer)

# TAB 4: Hilfe & Dokumentation
$tabHelp = New-Object System.Windows.Forms.TabPage("Hilfe & Dokumentation")
$tabHelp.BackColor = $Colors.Panel
$TabControl.TabPages.Add($tabHelp)


# ------------------------------------------------------------------------------
# CONTROLS FÜR TAB 1: Git-Schnittstelle
# ------------------------------------------------------------------------------

# INTERAKTIVES INITIALISIERUNGS-PANEL (Wird nur angezeigt, wenn kein .git Ordner existiert)
$panelInit = New-Object System.Windows.Forms.Panel
$panelInit.Location = New-Object System.Drawing.Point(10, 10)
$panelInit.Size = New-Object System.Drawing.Size(930, 100)
$panelInit.BackColor = $Colors.Bg
$panelInit.Visible = $false
$tabGit.Controls.Add($panelInit)

$lblInitTitle = New-Object System.Windows.Forms.Label
$lblInitTitle.Text = "DYNAMISCHER GIT-ASSISTENT: Projekt ist noch nicht initialisiert!"
$lblInitTitle.Font = $FontHeader
$lblInitTitle.ForeColor = $Colors.Red
$lblInitTitle.Location = New-Object System.Drawing.Point(15, 15)
$lblInitTitle.Size = New-Object System.Drawing.Size(600, 20)
$panelInit.Controls.Add($lblInitTitle)

$lblInitUrl = New-Object System.Windows.Forms.Label
$lblInitUrl.Text = "GitHub Repository URL (Optional):"
$lblInitUrl.Font = $FontRegular
$lblInitUrl.Location = New-Object System.Drawing.Point(15, 42)
$lblInitUrl.Size = New-Object System.Drawing.Size(250, 20)
$panelInit.Controls.Add($lblInitUrl)

$txtInitUrl = New-Object System.Windows.Forms.TextBox
$txtInitUrl.Location = New-Object System.Drawing.Point(15, 65)
$txtInitUrl.Size = New-Object System.Drawing.Size(520, 25)
$txtInitUrl.BackColor = $Colors.Panel
$txtInitUrl.ForeColor = $Colors.Text
$txtInitUrl.BorderStyle = "FixedSingle"
$txtInitUrl.Font = $FontRegular
$panelInit.Controls.Add($txtInitUrl)

$btnInitRun = New-Object System.Windows.Forms.Button
$btnInitRun.Text = "Repository initialisieren"
$btnInitRun.Location = New-Object System.Drawing.Point(555, 42)
$btnInitRun.Size = New-Object System.Drawing.Size(355, 48)
$btnInitRun.BackColor = $Colors.Green
$btnInitRun.ForeColor = [System.Drawing.Color]::White
$btnInitRun.FlatStyle = "Flat"
$btnInitRun.FlatAppearance.BorderSize = 0
$btnInitRun.Font = $FontHeader
$btnInitRun.TextAlign = [System.Drawing.ContentAlignment]::MiddleLeft
$btnInitRun.Padding = New-Object System.Windows.Forms.Padding(45, 0, 0, 0)
$panelInit.Controls.Add($btnInitRun)


# STANDARD-PROJEKT-PANEL (Wird angezeigt, wenn Git aktiv ist)
$panelMain = New-Object System.Windows.Forms.Panel
$panelMain.Location = New-Object System.Drawing.Point(10, 10)
$panelMain.Size = New-Object System.Drawing.Size(930, 100)
$panelMain.BackColor = $Colors.Bg
$panelMain.Visible = $false
$tabGit.Controls.Add($panelMain)

$lblRepoInfoTitle = New-Object System.Windows.Forms.Label
$lblRepoInfoTitle.Text = "AKTIVER REPOSITORY STATUS"
$lblRepoInfoTitle.Font = $FontHeader
$lblRepoInfoTitle.ForeColor = $Colors.Green
$lblRepoInfoTitle.Location = New-Object System.Drawing.Point(15, 15)
$lblRepoInfoTitle.Size = New-Object System.Drawing.Size(300, 20)
$panelMain.Controls.Add($lblRepoInfoTitle)

$lblRemoteInfo = New-Object System.Windows.Forms.Label
$lblRemoteInfo.Text = "GitHub Remote-Ziel: Nicht verknüpft"
$lblRemoteInfo.Font = $FontRegular
$lblRemoteInfo.ForeColor = $Colors.Text
$lblRemoteInfo.Location = New-Object System.Drawing.Point(15, 42)
$lblRemoteInfo.Size = New-Object System.Drawing.Size(600, 20)
$panelMain.Controls.Add($lblRemoteInfo)

$btnChangeRemote = New-Object System.Windows.Forms.Button
$btnChangeRemote.Text = "GitHub-Link $([char]228)ndern"
$btnChangeRemote.Location = New-Object System.Drawing.Point(15, 65)
$btnChangeRemote.Size = New-Object System.Drawing.Size(180, 28)
$btnChangeRemote.BackColor = $Colors.Panel
$btnChangeRemote.FlatStyle = "Flat"
$btnChangeRemote.FlatAppearance.BorderSize = 0
$btnChangeRemote.Font = $FontRegular
$btnChangeRemote.TextAlign = [System.Drawing.ContentAlignment]::MiddleLeft
$btnChangeRemote.Padding = New-Object System.Windows.Forms.Padding(25, 0, 0, 0)
$panelMain.Controls.Add($btnChangeRemote)


# Staging & Dateiauswahl
$lblFiles = New-Object System.Windows.Forms.Label
$lblFiles.Text = "Dateiauswahl (Staging):"
$lblFiles.Font = $FontHeader
$lblFiles.Location = New-Object System.Drawing.Point(10, 125)
$lblFiles.Size = New-Object System.Drawing.Size(430, 20)
$tabGit.Controls.Add($lblFiles)

$FileListBox = New-Object System.Windows.Forms.CheckedListBox
$FileListBox.Location = New-Object System.Drawing.Point(10, 150)
$FileListBox.Size = New-Object System.Drawing.Size(430, 200)
$FileListBox.BackColor = $Colors.Bg
$FileListBox.ForeColor = $Colors.Text
$FileListBox.BorderStyle = "FixedSingle"
$FileListBox.Font = $FontRegular
$FileListBox.CheckOnClick = $true
$tabGit.Controls.Add($FileListBox)

$btnSelectAll = New-Object System.Windows.Forms.Button
$btnSelectAll.Text = "Alle ausw$([char]228)hlen"
$btnSelectAll.Location = New-Object System.Drawing.Point(10, 360)
$btnSelectAll.Size = New-Object System.Drawing.Size(205, 28)
$btnSelectAll.BackColor = $Colors.Bg
$btnSelectAll.FlatStyle = "Flat"
$btnSelectAll.FlatAppearance.BorderSize = 0
$btnSelectAll.Font = $FontRegular
$btnSelectAll.TextAlign = [System.Drawing.ContentAlignment]::MiddleLeft
$btnSelectAll.Padding = New-Object System.Windows.Forms.Padding(30, 0, 0, 0)
$tabGit.Controls.Add($btnSelectAll)

$btnDeselectAll = New-Object System.Windows.Forms.Button
$btnDeselectAll.Text = "Auswahl aufheben"
$btnDeselectAll.Location = New-Object System.Drawing.Point(235, 360)
$btnDeselectAll.Size = New-Object System.Drawing.Size(205, 28)
$btnDeselectAll.BackColor = $Colors.Bg
$btnDeselectAll.FlatStyle = "Flat"
$btnDeselectAll.FlatAppearance.BorderSize = 0
$btnDeselectAll.Font = $FontRegular
$btnDeselectAll.TextAlign = [System.Drawing.ContentAlignment]::MiddleLeft
$btnDeselectAll.Padding = New-Object System.Windows.Forms.Padding(30, 0, 0, 0)
$tabGit.Controls.Add($btnDeselectAll)


# Rechte Spalte: Branches, Commit & Actions
$lblBranch = New-Object System.Windows.Forms.Label
$lblBranch.Text = "Ziel-Branch:"
$lblBranch.Font = $FontHeader
$lblBranch.Location = New-Object System.Drawing.Point(470, 125)
$lblBranch.Size = New-Object System.Drawing.Size(200, 20)
$tabGit.Controls.Add($lblBranch)

$cmbBranches = New-Object System.Windows.Forms.ComboBox
$cmbBranches.Location = New-Object System.Drawing.Point(470, 150)
$cmbBranches.Size = New-Object System.Drawing.Size(250, 25)
$cmbBranches.BackColor = $Colors.Bg
$cmbBranches.ForeColor = $Colors.Text
$cmbBranches.FlatStyle = "Flat"
$cmbBranches.Font = $FontRegular
$cmbBranches.DropDownStyle = "DropDownList"
$tabGit.Controls.Add($cmbBranches)

$btnMergeBranch = New-Object System.Windows.Forms.Button
$btnMergeBranch.Text = "Merge..."
$btnMergeBranch.Location = New-Object System.Drawing.Point(725, 149)
$btnMergeBranch.Size = New-Object System.Drawing.Size(95, 26)
$btnMergeBranch.BackColor = $Colors.Bg
$btnMergeBranch.FlatStyle = "Flat"
$btnMergeBranch.FlatAppearance.BorderSize = 0
$btnMergeBranch.Font = $FontRegular
$btnMergeBranch.TextAlign = [System.Drawing.ContentAlignment]::MiddleLeft
$btnMergeBranch.Padding = New-Object System.Windows.Forms.Padding(25, 0, 0, 0)
$tabGit.Controls.Add($btnMergeBranch)

$btnNewBranch = New-Object System.Windows.Forms.Button
$btnNewBranch.Text = "Neu..."
$btnNewBranch.Location = New-Object System.Drawing.Point(825, 149)
$btnNewBranch.Size = New-Object System.Drawing.Size(105, 26)
$btnNewBranch.BackColor = $Colors.Bg
$btnNewBranch.FlatStyle = "Flat"
$btnNewBranch.FlatAppearance.BorderSize = 0
$btnNewBranch.Font = $FontRegular
$btnNewBranch.TextAlign = [System.Drawing.ContentAlignment]::MiddleLeft
$btnNewBranch.Padding = New-Object System.Windows.Forms.Padding(25, 0, 0, 0)
$tabGit.Controls.Add($btnNewBranch)

$lblCommit = New-Object System.Windows.Forms.Label
$lblCommit.Text = "Commit-Beschreibung:"
$lblCommit.Font = $FontHeader
$lblCommit.Location = New-Object System.Drawing.Point(470, 185)
$lblCommit.Size = New-Object System.Drawing.Size(400, 20)
$tabGit.Controls.Add($lblCommit)

$txtCommitMsg = New-Object System.Windows.Forms.TextBox
$txtCommitMsg.Multiline = $true
$txtCommitMsg.ScrollBars = "Vertical"
$txtCommitMsg.Location = New-Object System.Drawing.Point(470, 210)
$txtCommitMsg.Size = New-Object System.Drawing.Size(460, 80)
$txtCommitMsg.BackColor = $Colors.Bg
$txtCommitMsg.ForeColor = $Colors.Text
$txtCommitMsg.BorderStyle = "FixedSingle"
$txtCommitMsg.Font = $FontRegular
$tabGit.Controls.Add($txtCommitMsg)

$btnRefresh = New-Object System.Windows.Forms.Button
$btnRefresh.Text = "Aktualisieren"
$btnRefresh.Location = New-Object System.Drawing.Point(470, 305)
$btnRefresh.Size = New-Object System.Drawing.Size(140, 32)
$btnRefresh.BackColor = $Colors.Bg
$btnRefresh.FlatStyle = "Flat"
$btnRefresh.FlatAppearance.BorderSize = 0
$btnRefresh.Font = $FontHeader
$btnRefresh.TextAlign = [System.Drawing.ContentAlignment]::MiddleLeft
$btnRefresh.Padding = New-Object System.Windows.Forms.Padding(35, 0, 0, 0)
$tabGit.Controls.Add($btnRefresh)

$btnPull = New-Object System.Windows.Forms.Button
$btnPull.Text = "Herunterladen (Pull)"
$btnPull.Location = New-Object System.Drawing.Point(620, 305)
$btnPull.Size = New-Object System.Drawing.Size(160, 32)
$btnPull.BackColor = $Colors.Bg
$btnPull.FlatStyle = "Flat"
$btnPull.FlatAppearance.BorderSize = 0
$btnPull.Font = $FontHeader
$btnPull.TextAlign = [System.Drawing.ContentAlignment]::MiddleLeft
$btnPull.Padding = New-Object System.Windows.Forms.Padding(35, 0, 0, 0)
$tabGit.Controls.Add($btnPull)

$btnPush = New-Object System.Windows.Forms.Button
$btnPush.Text = "HOCHLADEN (Commit & Push)"
$btnPush.Location = New-Object System.Drawing.Point(470, 347)
$btnPush.Size = New-Object System.Drawing.Size(460, 40)
$btnPush.BackColor = $Colors.Accent
$btnPush.ForeColor = [System.Drawing.Color]::White
$btnPush.FlatStyle = "Flat"
$btnPush.FlatAppearance.BorderSize = 0
$btnPush.Font = New-Object System.Drawing.Font("Segoe UI", 10.5, [System.Drawing.FontStyle]::Bold)
$btnPush.TextAlign = [System.Drawing.ContentAlignment]::MiddleLeft
$btnPush.Padding = New-Object System.Windows.Forms.Padding(130, 0, 0, 0)
$tabGit.Controls.Add($btnPush)


# ------------------------------------------------------------------------------
# CONTROLS FÜR TAB 2: Versionsverlauf & Commits
# ------------------------------------------------------------------------------

# Commit ListBox
$HistoryListBox = New-Object System.Windows.Forms.ListBox
$HistoryListBox.Location = New-Object System.Drawing.Point(10, 15)
$HistoryListBox.Size = New-Object System.Drawing.Size(450, 390)
$HistoryListBox.BackColor = $Colors.Bg
$HistoryListBox.ForeColor = $Colors.Text
$HistoryListBox.BorderStyle = "FixedSingle"
$HistoryListBox.Font = $FontRegular
$tabHistory.Controls.Add($HistoryListBox)

# Details RichTextBox
$txtCommitDetails = New-Object System.Windows.Forms.RichTextBox
$txtCommitDetails.Location = New-Object System.Drawing.Point(480, 15)
$txtCommitDetails.Size = New-Object System.Drawing.Size(450, 340)
$txtCommitDetails.BackColor = $Colors.Bg
$txtCommitDetails.ForeColor = $Colors.Text
$txtCommitDetails.Font = $FontConsole
$txtCommitDetails.ReadOnly = $true
$txtCommitDetails.BorderStyle = "FixedSingle"
$tabHistory.Controls.Add($txtCommitDetails)

# Refresh Button
$btnRefreshHistory = New-Object System.Windows.Forms.Button
$btnRefreshHistory.Text = "Verlauf laden"
$btnRefreshHistory.Location = New-Object System.Drawing.Point(480, 370)
$btnRefreshHistory.Size = New-Object System.Drawing.Size(160, 35)
$btnRefreshHistory.BackColor = $Colors.Bg
$btnRefreshHistory.FlatStyle = "Flat"
$btnRefreshHistory.FlatAppearance.BorderSize = 0
$btnRefreshHistory.Font = $FontHeader
$btnRefreshHistory.TextAlign = [System.Drawing.ContentAlignment]::MiddleLeft
$btnRefreshHistory.Padding = New-Object System.Windows.Forms.Padding(35, 0, 0, 0)
$tabHistory.Controls.Add($btnRefreshHistory)


# ------------------------------------------------------------------------------
# CONTROLS FÜR TAB 3: Ordner- & Repo-Explorer
# ------------------------------------------------------------------------------

# Linke Seite: Folder TreeView
$treeView = New-Object System.Windows.Forms.TreeView
$treeView.Location = New-Object System.Drawing.Point(10, 15)
$treeView.Size = New-Object System.Drawing.Size(450, 370)
$treeView.BackColor = $Colors.Bg
$treeView.ForeColor = $Colors.Text
$treeView.BorderStyle = "FixedSingle"
$treeView.LineColor = $Colors.Accent
$treeView.Font = $FontRegular
$tabExplorer.Controls.Add($treeView)

# Rechte Seite: Directory Operations
$lblExplorerTitle = New-Object System.Windows.Forms.Label
$lblExplorerTitle.Text = "VERZEICHNIS-STEUERUNG"
$lblExplorerTitle.Font = $FontHeader
$lblExplorerTitle.ForeColor = $Colors.Accent
$lblExplorerTitle.Location = New-Object System.Drawing.Point(480, 15)
$lblExplorerTitle.Size = New-Object System.Drawing.Size(450, 25)
$tabExplorer.Controls.Add($lblExplorerTitle)

$btnCreateFolder = New-Object System.Windows.Forms.Button
$btnCreateFolder.Text = "Neuen Ordner erstellen"
$btnCreateFolder.Location = New-Object System.Drawing.Point(480, 50)
$btnCreateFolder.Size = New-Object System.Drawing.Size(450, 35)
$btnCreateFolder.BackColor = $Colors.Bg
$btnCreateFolder.FlatStyle = "Flat"
$btnCreateFolder.FlatAppearance.BorderSize = 0
$btnCreateFolder.Font = $FontHeader
$btnCreateFolder.TextAlign = [System.Drawing.ContentAlignment]::MiddleLeft
$btnCreateFolder.Padding = New-Object System.Windows.Forms.Padding(35, 0, 0, 0)
$tabExplorer.Controls.Add($btnCreateFolder)

$btnSyncEmpty = New-Object System.Windows.Forms.Button
$btnSyncEmpty.Text = "Leere Ordner tracken (.gitkeep)"
$btnSyncEmpty.Location = New-Object System.Drawing.Point(480, 100)
$btnSyncEmpty.Size = New-Object System.Drawing.Size(450, 35)
$btnSyncEmpty.BackColor = $Colors.Bg
$btnSyncEmpty.FlatStyle = "Flat"
$btnSyncEmpty.FlatAppearance.BorderSize = 0
$btnSyncEmpty.Font = $FontHeader
$btnSyncEmpty.TextAlign = [System.Drawing.ContentAlignment]::MiddleLeft
$btnSyncEmpty.Padding = New-Object System.Windows.Forms.Padding(35, 0, 0, 0)
$tabExplorer.Controls.Add($btnSyncEmpty)

$lblFolderInfo = New-Object System.Windows.Forms.Label
$lblFolderInfo.Text = "Ordner-Explorer & Synchronisationshilfe:`r`n`r`n1. Ordner erstellen: Waehlen Sie einen Ordner im Verzeichnisbaum aus und klicken Sie auf 'Neuen Ordner erstellen', um ein Unterverzeichnis anzulegen.`r`n`r`n2. Leere Ordner tracken: Git ignoriert leere Verzeichnisse standardmaessig. Der Assistent sucht rekursiv nach leeren Ordnern und legt darin eine unsichtbare '.gitkeep'-Datei ab, damit der Ordner auf GitHub hochgeladen und synchronisiert werden kann."
$lblFolderInfo.Font = $FontRegular
$lblFolderInfo.ForeColor = $Colors.Text
$lblFolderInfo.Location = New-Object System.Drawing.Point(480, 155)
$lblFolderInfo.Size = New-Object System.Drawing.Size(450, 230)
$tabExplorer.Controls.Add($lblFolderInfo)


# ------------------------------------------------------------------------------
# CONTROLS FÜR TAB 3: Hilfe & Dokumentation
# ------------------------------------------------------------------------------
$txtHelp = New-Object System.Windows.Forms.RichTextBox
$txtHelp.Location = New-Object System.Drawing.Point(10, 15)
$txtHelp.Size = New-Object System.Drawing.Size(930, 370)
$txtHelp.BackColor = $Colors.Bg
$txtHelp.ForeColor = $Colors.Text
$txtHelp.Font = $FontConsole
$txtHelp.ReadOnly = $true
$txtHelp.BorderStyle = "None"
$tabHelp.Controls.Add($txtHelp)

$txtHelp.Text = @"
================================================================================
UNIVERSAL GIT MANAGER - DOKUMENTATION & SYSTEM-HILFE
================================================================================

Dieses Tool ist ein projektunabhaengiger, grafischer Git-Assistent, der automatisch 
das aktuelle Arbeitsverzeichnis liest und alle Operationen dynamisch ausfuehrt.

FEATURES & BEDIENUNG:

1. DATEIAUSWAHL (STAGING):
   - Auf der linken Seite sehen Sie alle neu erstellten, geaenderten oder geloeschten Dateien.
   - Waehlen Sie die Dateien aus, die Sie mit dem naechsten Commit sichern moechten.
   - Verwenden Sie die Buttons "Alle auswaehlen" oder "Auswahl aufheben" zur schnellen Massensteuerung.

2. COMMIT & UPLOAD (PUSH):
   - Geben Sie eine kurze, verstaendliche Commit-Beschreibung ein.
   - Waehlen Sie im Dropdown den Ziel-Branch aus. Der aktuell aktive Branch wird automatisch vorausgewaehlt.
   - Klicken Sie auf "HOCHLADEN (Commit & Push)", um Ihre Aenderungen lokal zu sichern und direkt auf GitHub zu pushen.

3. HERUNTERLADEN (PULL):
   - Laden Sie die neuesten Aenderungen des ausgewaehlten Branches von GitHub herunter, um Ihr lokales Repository zu aktualisieren.

4. GITHUB-LINK ÄNDERN:
   - Klicken Sie auf "GitHub-Link aendern", um das Remote-Ziel ("origin") Ihres Projekts anzupassen oder zu entfernen.

5. PROJEKT-EXPLORER:
   - Der Reiter "Ordner- & Repo-Explorer" zeigt die komplette Ordner- und Dateistruktur des aktuellen Arbeitsverzeichnisses.
   - Sie koennen neue Ordner direkt in der Struktur anlegen. Selektieren Sie hierzu einen Ordner im Baum und klicken Sie auf "Neuen Ordner erstellen".
   - Git unterstuetzt standardmaessig keine leeren Ordner. Klicken Sie auf "Leere Ordner tracken (.gitkeep)", um leere Verzeichnisse mit einer Platzhalter-Datei zu versehen, sodass Git diese synchronisieren kann.
"@


# ------------------------------------------------------------------------------
# GLOBAL CONSOLE LOG (Unteres Panel des Formulars)
# ------------------------------------------------------------------------------
$lblLog = New-Object System.Windows.Forms.Label
$lblLog.Text = "Echtzeit-Aktivit$([char]228)tsprotokoll:"
$lblLog.Font = $FontHeader
$lblLog.Location = New-Object System.Drawing.Point(20, 525)
$lblLog.Size = New-Object System.Drawing.Size(940, 20)
$lblLog.Anchor = "Bottom, Left"
$Form.Controls.Add($lblLog)

$txtConsole = New-Object System.Windows.Forms.RichTextBox
$txtConsole.Location = New-Object System.Drawing.Point(20, 550)
$txtConsole.Size = New-Object System.Drawing.Size(960, 170)
$txtConsole.BackColor = $Colors.Console
$txtConsole.ForeColor = $Colors.Text
$txtConsole.Font = $FontConsole
$txtConsole.ReadOnly = $true
$txtConsole.BorderStyle = "None"
$txtConsole.Anchor = "Bottom, Left, Right"
$Form.Controls.Add($txtConsole)


# ------------------------------------------------------------------------------
# 4. GDI+ Vektor-Grafik-Zeichnungen (Keine Emojis)
# ------------------------------------------------------------------------------

# Refresh History Button Icon (Circular Arrow)
$btnRefreshHistory.Add_Paint({
    param($sender, $e)
    $g = $e.Graphics
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $pen = New-Object System.Drawing.Pen($Colors.Text, 2)
    $rect = New-Object System.Drawing.Rectangle(12, 10, 14, 14)
    $g.DrawArc($pen, $rect, -45, 270)
    
    $brush = New-Object System.Drawing.SolidBrush($Colors.Text)
    $p1 = New-Object System.Drawing.PointF(22, 7)
    $p2 = New-Object System.Drawing.PointF(26, 11)
    $p3 = New-Object System.Drawing.PointF(21, 14)
    $g.FillPolygon($brush, ($p1, $p2, $p3))
    
    $pen.Dispose()
    $brush.Dispose()
})

# Merge Button Icon (Branch Curve)
$btnMergeBranch.Add_Paint({
    param($sender, $e)
    $g = $e.Graphics
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $pen = New-Object System.Drawing.Pen($Colors.Text, 1.8)
    $brush = New-Object System.Drawing.SolidBrush($Colors.Text)
    
    $g.DrawLine($pen, 8, 5, 8, 20)
    $g.DrawBezier($pen, 16, 5, 14, 10, 10, 12, 8, 14)
    
    $g.FillEllipse($brush, 6, 4, 4, 4)
    $g.FillEllipse($brush, 14, 4, 4, 4)
    $g.FillEllipse($brush, 6, 18, 4, 4)
    
    $pen.Dispose()
    $brush.Dispose()
})

# Refresh Button Icon (Circular Arrow)
$btnRefresh.Add_Paint({
    param($sender, $e)
    $g = $e.Graphics
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $pen = New-Object System.Drawing.Pen($Colors.Text, 2)
    $rect = New-Object System.Drawing.Rectangle(12, 9, 14, 14)
    $g.DrawArc($pen, $rect, -45, 270)
    
    $brush = New-Object System.Drawing.SolidBrush($Colors.Text)
    $p1 = New-Object System.Drawing.PointF(22, 6)
    $p2 = New-Object System.Drawing.PointF(26, 10)
    $p3 = New-Object System.Drawing.PointF(21, 13)
    $g.FillPolygon($brush, ($p1, $p2, $p3))
    
    $pen.Dispose()
    $brush.Dispose()
})

# Pull Button Icon (Downward Arrow + Bottom Line)
$btnPull.Add_Paint({
    param($sender, $e)
    $g = $e.Graphics
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $pen = New-Object System.Drawing.Pen($Colors.Text, 2)
    $g.DrawLine($pen, 12, 23, 26, 23)
    $g.DrawLine($pen, 19, 8, 19, 20)
    $g.DrawLine($pen, 15, 16, 19, 20)
    $g.DrawLine($pen, 23, 16, 19, 20)
    $pen.Dispose()
})

# Push Button Icon (Upward Arrow + Bottom Line)
$btnPush.Add_Paint({
    param($sender, $e)
    $g = $e.Graphics
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, 2.5)
    
    $g.DrawLine($pen, 98, 28, 112, 28)
    $g.DrawLine($pen, 105, 28, 105, 12)
    $g.DrawLine($pen, 101, 17, 105, 12)
    $g.DrawLine($pen, 109, 17, 105, 12)
    
    $pen.Dispose()
})

# New Branch Button Icon (Fork/Tree Diagram)
$btnNewBranch.Add_Paint({
    param($sender, $e)
    $g = $e.Graphics
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $pen = New-Object System.Drawing.Pen($Colors.Text, 2)
    $brush = New-Object System.Drawing.SolidBrush($Colors.Text)
    
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
    $pen = New-Object System.Drawing.Pen($Colors.Text, 1.5)
    
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
    $pen = New-Object System.Drawing.Pen($Colors.Text, 1.5)
    $g.DrawRectangle($pen, 10, 7, 13, 13)
    
    $penCheck = New-Object System.Drawing.Pen($Colors.Green, 2)
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
    $pen = New-Object System.Drawing.Pen($Colors.Text, 1.5)
    $g.DrawRectangle($pen, 10, 7, 13, 13)
    
    $penCross = New-Object System.Drawing.Pen($Colors.Red, 1.5)
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
    
    $g.DrawLine($pen, 15, 16, 23, 16)
    $g.DrawLine($pen, 23, 16, 26, 19)
    $g.DrawLine($pen, 26, 19, 35, 19)
    $g.DrawLine($pen, 35, 19, 35, 31)
    $g.DrawLine($pen, 35, 31, 15, 31)
    $g.DrawLine($pen, 15, 31, 15, 16)
    
    $g.DrawLine($pen, 21, 25, 29, 25)
    $g.DrawLine($pen, 25, 21, 25, 29)
    
    $pen.Dispose()
})

# Create Folder Button Icon (Folder Outline + Plus)
$btnCreateFolder.Add_Paint({
    param($sender, $e)
    $g = $e.Graphics
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $pen = New-Object System.Drawing.Pen($Colors.Text, 1.5)
    
    # Folder
    $g.DrawLine($pen, 12, 12, 17, 12)
    $g.DrawLine($pen, 17, 12, 19, 15)
    $g.DrawLine($pen, 19, 15, 27, 15)
    $g.DrawLine($pen, 27, 15, 27, 24)
    $g.DrawLine($pen, 27, 24, 12, 24)
    $g.DrawLine($pen, 12, 24, 12, 12)
    
    # Plus inside folder
    $g.DrawLine($pen, 17, 19, 23, 19)
    $g.DrawLine($pen, 20, 16, 20, 22)
    
    $pen.Dispose()
})

# Sync Empty Folders Button Icon (Folder Outline + Refresh Loop)
$btnSyncEmpty.Add_Paint({
    param($sender, $e)
    $g = $e.Graphics
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $pen = New-Object System.Drawing.Pen($Colors.Text, 1.5)
    
    # Folder
    $g.DrawLine($pen, 12, 12, 17, 12)
    $g.DrawLine($pen, 17, 12, 19, 15)
    $g.DrawLine($pen, 19, 15, 27, 15)
    $g.DrawLine($pen, 27, 15, 27, 24)
    $g.DrawLine($pen, 27, 24, 12, 24)
    $g.DrawLine($pen, 12, 24, 12, 12)
    
    # Sync circle
    $rect = New-Object System.Drawing.Rectangle(16, 15, 8, 8)
    $g.DrawArc($pen, $rect, 0, 270)
    
    $pen.Dispose()
})


# ------------------------------------------------------------------------------
# 5. Business Logic & Git Events
# ------------------------------------------------------------------------------

$script:IsPopulatingBranches = $false

# Aktualisiert die Dropdown-Auswahl für Branches
$UpdateBranches = {
    $script:IsPopulatingBranches = $true
    $cmbBranches.Items.Clear()
    if (-not (Test-GitRepository)) { 
        $script:IsPopulatingBranches = $false
        return 
    }
    
    # Lokale Branches auslesen
    $BranchResult = Invoke-Git "branch --format='%(refname:short)'"
    if ($BranchResult.ExitCode -eq 0) {
        $Branches = $BranchResult.Output -split "`r?`n" | Where-Object { $_ -ne "" }
        foreach ($Branch in $Branches) {
            $CleanBranch = $Branch.Trim("'").Trim()
            [void]$cmbBranches.Items.Add($CleanBranch)
        }
    }
    
    # Aktiven Branch ermitteln und selektieren
    $CurrentBranchResult = Invoke-Git "branch --show-current"
    if ($CurrentBranchResult.ExitCode -eq 0 -and $CurrentBranchResult.Output) {
        $CurrentBranch = $CurrentBranchResult.Output.Trim("'").Trim()
        $Idx = $cmbBranches.Items.IndexOf($CurrentBranch)
        if ($Idx -ge 0) {
            $cmbBranches.SelectedIndex = $Idx
        }
    } else {
        [void]$cmbBranches.Items.Add("main")
        $cmbBranches.SelectedIndex = 0
    }
    $script:IsPopulatingBranches = $false
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
    
    # Pr$([char]252)fen, ob wir Commits vor/nach Remote haben (ahead/behind)
    $AheadCount = 0
    $BehindCount = 0
    $StatusB = Invoke-Git "status -b --porcelain"
    if ($StatusB.ExitCode -eq 0 -and $StatusB.Output -match "\[(.*)\]") {
        $Details = $Matches[1]
        if ($Details -match "ahead\s+(\d+)") {
            $AheadCount = [int]$Matches[1]
        }
        if ($Details -match "behind\s+(\d+)") {
            $BehindCount = [int]$Matches[1]
        }
    }
    
    # Git Status abrufen
    $GitStatus = Invoke-Git "status --porcelain"
    if ($GitStatus.ExitCode -ne 0) {
        Write-Log "Fehler beim Abrufen des Git-Status:" $Colors.Red
        Write-Log $GitStatus.Error $Colors.Red
        return
    }
    
    $Lines = $GitStatus.Output -split "`r?`n" | Where-Object { $_ -ne "" }
    
    # ListBox befüllen falls Änderungen vorhanden
    foreach ($Line in $Lines) {
        if ($Line -match "^(.{2})\s+(.*)$") {
            $Flag = $Matches[1]
            $FilePath = $Matches[2]
        } else {
            continue
        }
        
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
    
    # Push Button Zustand anpassen
    if ($Lines.Count -gt 0) {
        $btnPush.Text = "HOCHLADEN (Commit & Push)"
        $btnPush.Enabled = $true
        $btnPush.BackColor = $Colors.Accent
        Write-Log "Status aktualisiert. $($Lines.Count) $([char]196)nderungen gefunden." $Colors.Accent
    } else {
        if ($AheadCount -gt 0) {
            $btnPush.Text = "AUSSTEHENDE COMMITS PUSHEN ($AheadCount Commit(s) hochladen)"
            $btnPush.Enabled = $true
            $btnPush.BackColor = $Colors.Accent
            Write-Log "Status: Lokales Repository hat $AheadCount ausstehende(n) Commit(s) zum Hochladen (Push)." $Colors.Accent
        } else {
            $btnPush.Text = "HOCHLADEN (Commit & Push)"
            $btnPush.Enabled = $false
            $btnPush.BackColor = $Colors.Bg
            Write-Log "Status: Alles sauber! Keine ungesicherten $([char]196)nderungen vorhanden." $Colors.Green
        }
    }
    
    if ($BehindCount -gt 0) {
        Write-Log "HINWEIS: Auf GitHub sind $BehindCount neuere(r) Commit(s) vorhanden. Bitte 'Herunterladen (Pull)' ausf$([char]252)hren!" $Colors.Accent
    }
}

# Lokale TreeView-Ordnerstruktur befüllen
function Populate-FolderNode {
    param($dirNode, $path)
    try {
        $dirs = [System.IO.Directory]::GetDirectories($path)
        foreach ($d in $dirs) {
            $dirName = Split-Path $d -Leaf
            if ($dirName -eq ".git") { continue }
            $subNode = New-Object System.Windows.Forms.TreeNode($dirName)
            $subNode.Tag = $d
            [void]$dirNode.Nodes.Add($subNode)
            Populate-FolderNode $subNode $d
        }
        $files = [System.IO.Directory]::GetFiles($path)
        foreach ($f in $files) {
            $fileName = Split-Path $f -Leaf
            $fileNode = New-Object System.Windows.Forms.TreeNode($fileName)
            $fileNode.Tag = $f
            $fileNode.ForeColor = $Colors.Gray
            [void]$dirNode.Nodes.Add($fileNode)
        }
    } catch {}
}

$UpdateTreeView = {
    $treeView.Nodes.Clear()
    $rootNode = New-Object System.Windows.Forms.TreeNode("Projekt-Wurzelordner")
    $rootNode.Tag = $ScriptPath
    [void]$treeView.Nodes.Add($rootNode)
    Populate-FolderNode $rootNode $ScriptPath
    $rootNode.Expand()
}

# Aktualisiert den Commit-Verlauf (Versionsverlauf)
$UpdateHistory = {
    $HistoryListBox.Items.Clear()
    $txtCommitDetails.Clear()
    if (-not (Test-GitRepository)) { return }
    
    $LogRes = Invoke-Git "log -n 50 --oneline"
    if ($LogRes.ExitCode -eq 0 -and $LogRes.Output) {
        $Commits = $LogRes.Output -split "`r?`n" | Where-Object { $_ -ne "" }
        foreach ($Commit in $Commits) {
            [void]$HistoryListBox.Items.Add($Commit)
        }
    } else {
        [void]$HistoryListBox.Items.Add("Keine Commits vorhanden oder Fehler beim Laden.")
    }
}

# Hilfsdialog fuer die Branch-Auswahl beim Merge
function Show-BranchSelectionDialog {
    param(
        [string]$Title,
        [string]$Prompt,
        [System.Collections.ArrayList]$BranchList
    )
    
    $dialog = New-Object System.Windows.Forms.Form
    $dialog.Text = $Title
    $dialog.Size = New-Object System.Drawing.Size(350, 180)
    $dialog.StartPosition = "CenterParent"
    $dialog.FormBorderStyle = "FixedDialog"
    $dialog.MaximizeBox = $false
    $dialog.MinimizeBox = $false
    $dialog.BackColor = $Colors.Panel
    $dialog.ForeColor = $Colors.Text
    
    $lblPrompt = New-Object System.Windows.Forms.Label
    $lblPrompt.Text = $Prompt
    $lblPrompt.Location = New-Object System.Drawing.Point(20, 15)
    $lblPrompt.Size = New-Object System.Drawing.Size(300, 20)
    $lblPrompt.Font = $FontHeader
    $dialog.Controls.Add($lblPrompt)
    
    $cmbSelect = New-Object System.Windows.Forms.ComboBox
    $cmbSelect.Location = New-Object System.Drawing.Point(20, 45)
    $cmbSelect.Size = New-Object System.Drawing.Size(290, 25)
    $cmbSelect.DropDownStyle = "DropDownList"
    $cmbSelect.BackColor = $Colors.Bg
    $cmbSelect.ForeColor = $Colors.Text
    $cmbSelect.FlatStyle = "Flat"
    $cmbSelect.Font = $FontRegular
    foreach ($item in $BranchList) {
        [void]$cmbSelect.Items.Add($item)
    }
    if ($cmbSelect.Items.Count -gt 0) {
        $cmbSelect.SelectedIndex = 0
    }
    $dialog.Controls.Add($cmbSelect)
    
    $btnOk = New-Object System.Windows.Forms.Button
    $btnOk.Text = "Merge"
    $btnOk.DialogResult = "OK"
    $btnOk.Location = New-Object System.Drawing.Point(120, 95)
    $btnOk.Size = New-Object System.Drawing.Size(90, 30)
    $btnOk.BackColor = $Colors.Accent
    $btnOk.ForeColor = [System.Drawing.Color]::White
    $btnOk.FlatStyle = "Flat"
    $btnOk.FlatAppearance.BorderSize = 0
    $btnOk.Font = $FontHeader
    $dialog.Controls.Add($btnOk)
    
    $btnCancel = New-Object System.Windows.Forms.Button
    $btnCancel.Text = "Abbrechen"
    $btnCancel.DialogResult = "Cancel"
    $btnCancel.Location = New-Object System.Drawing.Point(220, 95)
    $btnCancel.Size = New-Object System.Drawing.Size(90, 30)
    $btnCancel.BackColor = $Colors.Bg
    $btnCancel.ForeColor = $Colors.Text
    $btnCancel.FlatStyle = "Flat"
    $btnCancel.FlatAppearance.BorderSize = 0
    $btnCancel.Font = $FontRegular
    $dialog.Controls.Add($btnCancel)
    
    $dialog.AcceptButton = $btnOk
    $dialog.CancelButton = $btnCancel
    
    $result = $dialog.ShowDialog()
    if ($result -eq "OK") {
        return $cmbSelect.SelectedItem
    }
    return $null
}

# Merge-Event
$DoMergeBranch = {
    if (-not (Test-GitRepository)) { return }
    
    $CurrentBranchRes = Invoke-Git "branch --show-current"
    if ($CurrentBranchRes.ExitCode -ne 0 -or -not $CurrentBranchRes.Output) {
        [System.Windows.Forms.MessageBox]::Show("Konnte den aktuellen Branch nicht ermitteln.", "Fehler", "OK", "Error") | Out-Null
        return
    }
    $CurrentBranch = $CurrentBranchRes.Output.Trim("'").Trim()
    
    $BranchResult = Invoke-Git "branch --format='%(refname:short)'"
    if ($BranchResult.ExitCode -ne 0) {
        [System.Windows.Forms.MessageBox]::Show("Fehler beim Laden der Branches.", "Fehler", "OK", "Error") | Out-Null
        return
    }
    
    $OtherBranches = New-Object System.Collections.ArrayList
    $Branches = $BranchResult.Output -split "`r?`n" | Where-Object { $_ -ne "" }
    foreach ($Branch in $Branches) {
        $CleanB = $Branch.Trim("'").Trim()
        if ($CleanB -ne $CurrentBranch) {
            [void]$OtherBranches.Add($CleanB)
        }
    }
    
    if ($OtherBranches.Count -eq 0) {
        [System.Windows.Forms.MessageBox]::Show("Es gibt keine anderen lokalen Branches zum Zusammenfuehren.", "Keine Auswahl", "OK", "Information") | Out-Null
        return
    }
    
    $SelectedBranchToMerge = Show-BranchSelectionDialog -Title "Git Branch Zusammenfuehrung (Merge)" -Prompt ("Zusammenfuehren in Branch '" + $CurrentBranch + "':") -BranchList $OtherBranches
    if ($SelectedBranchToMerge -ne $null) {
        $Confirm = [System.Windows.Forms.MessageBox]::Show("Moechten Sie den Branch '" + $SelectedBranchToMerge + "' wirklich in '" + $CurrentBranch + "' mergen?", "Merge bestoetigen", "YesNo", "Question")
        if ($Confirm -eq "Yes") {
            Write-Log ("=== START MERGE: Merge '" + $SelectedBranchToMerge + "' in '" + $CurrentBranch + "' ===") $Colors.Accent
            $Form.Enabled = $false
            $MergeResult = Invoke-Git ("merge --no-edit " + $SelectedBranchToMerge)
            $Form.Enabled = $true
            
            if ($MergeResult.ExitCode -eq 0) {
                if ($MergeResult.Output) { Write-Log $MergeResult.Output $Colors.Text }
                Write-Log "=== Merge erfolgreich beendet! ===" $Colors.Green
            } else {
                if ($MergeResult.Error) { Write-Log $MergeResult.Error $Colors.Red }
                if ($MergeResult.Output) { Write-Log $MergeResult.Output $Colors.Red }
                Write-Log "=== MERGE-FEHLER: Eventuell gibt es Konflikte. Bitte loesen Sie diese in den betroffenen Dateien! ===" $Colors.Red
                [System.Windows.Forms.MessageBox]::Show("Merge fehlgeschlagen oder Konflikte aufgetreten.`n`nBitte pruefen Sie das AktivitÃ¤tsprotokoll.", "Merge Konflikt/Fehler", "OK", "Warning") | Out-Null
            }
            & $DoRefreshAll
        }
    }
}

# Event-Handler für automatischen Branch-Wechsel bei Auswahl
$cmbBranches_SelectedIndexChanged = {
    if ($script:IsPopulatingBranches) { return }
    
    $SelectedBranch = $cmbBranches.SelectedItem
    if (-not $SelectedBranch) { return }
    
    $CurrentBranchResult = Invoke-Git "branch --show-current"
    $CurrentBranch = $CurrentBranchResult.Output.Trim("'").Trim()
    if ($CurrentBranch -eq $SelectedBranch) { return }
    
    Write-Log ("Wechsle zu Branch '" + $SelectedBranch + "'...") $Colors.Accent
    $Form.Enabled = $false
    $Result = Invoke-Git ("checkout " + $SelectedBranch)
    $Form.Enabled = $true
    
    if ($Result.ExitCode -eq 0) {
        Write-Log ("Erfolgreich zu Branch '" + $SelectedBranch + "' gewechselt.") $Colors.Green
        & $UpdateStatus
        & $UpdateHistory
    } else {
        Write-Log ("Fehler beim Wechseln des Branches:") $Colors.Red
        Write-Log $Result.Error $Colors.Red
        
        $script:IsPopulatingBranches = $true
        $Idx = $cmbBranches.Items.IndexOf($CurrentBranch)
        if ($Idx -ge 0) {
            $cmbBranches.SelectedIndex = $Idx
        }
        $script:IsPopulatingBranches = $false
        
        [System.Windows.Forms.MessageBox]::Show("Wechseln fehlgeschlagen. Haben Sie eventuell ungesicherte Aenderungen?`n`nDetails:`n" + $Result.Error, "Fehler beim Branch-Wechsel", "OK", "Error") | Out-Null
    }
}

# Unified Refresh Action
$DoRefreshAll = {
    $RemoteCheck = Invoke-Git "remote"
    if ($RemoteCheck.ExitCode -eq 0 -and -not [string]::IsNullOrEmpty($RemoteCheck.Output)) {
        Invoke-Git "fetch origin" | Out-Null
    }
    & $UpdateBranches
    & $UpdateStatus
    & $UpdateTreeView
    & $UpdateHistory
}

# Pull-Event (Synchronisierung von Remote)
$DoPull = {
    $SelectedBranch = $cmbBranches.SelectedItem
    if (-not $SelectedBranch) { $SelectedBranch = "main" }
    
    Write-Log "=== START PULL: Lade $([char]196)nderungen f$([char]252)r '$SelectedBranch' herunter ===" $Colors.Accent
    $Form.Enabled = $false
    
    $RemoteCheck = Invoke-Git "remote"
    if ([string]::IsNullOrEmpty($RemoteCheck.Output)) {
        Write-Log "Fehler: Es ist kein Remote-Server ('origin') mit diesem Repository verkn$([char]252)pft!" $Colors.Red
        $Form.Enabled = $true
        return
    }
    
    $Result = Invoke-Git "pull origin $SelectedBranch --no-edit"
    if ($Result.ExitCode -eq 0) {
        if ($Result.Output) { Write-Log $Result.Output $Colors.Text }
        Write-Log "=== Pull erfolgreich beendet! ===" $Colors.Green
    } else {
        if ($Result.Error) { Write-Log $Result.Error $Colors.Red }
        Write-Log "Fehler beim Herunterladen." $Colors.Red
        Write-Log "TIPP: Pruefen Sie Ihre Internetverbindung und ob der Remote-Branch auf GitHub existiert." $Colors.Accent
    }
    
    $Form.Enabled = $true
    & $UpdateStatus
}

# Push/Commit-Event (Übertragung auf GitHub)
$DoPush = {
    $CheckedItems = $FileListBox.CheckedItems
    
    $IsPushOnly = $false
    if ($CheckedItems.Count -eq 0) {
        $AheadCheck = 0
        $StatusB = Invoke-Git "status -b --porcelain"
        if ($StatusB.ExitCode -eq 0 -and $StatusB.Output -match "\[ahead\s+(\d+)\]") {
            $AheadCheck = [int]$Matches[1]
        }
        
        if ($AheadCheck -gt 0) {
            $IsPushOnly = $true
        } else {
            [System.Windows.Forms.MessageBox]::Show("Bitte w$([char]228)hle mindestens eine Datei zum Sichern aus.", "Keine Auswahl", "OK", "Warning") | Out-Null
            return
        }
    }
    
    if (-not $IsPushOnly) {
        $Comment = $txtCommitMsg.Text.Trim()
        if ([string]::IsNullOrEmpty($Comment)) {
            [System.Windows.Forms.MessageBox]::Show("Bitte gib einen $([char]196)nderungskommentar ein.", "Kommentar fehlt", "OK", "Warning") | Out-Null
            return
        }
    }
    
    $SelectedBranch = $cmbBranches.SelectedItem
    if (-not $SelectedBranch) { $SelectedBranch = "main" }
    
    $Form.Enabled = $false
    
    $Success = $true
    if (-not $IsPushOnly) {
        Write-Log "=== START UPLOAD: Sichern auf Branch '$SelectedBranch' ===" $Colors.Accent
        
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
                    Write-Log "Fehler beim Hinzuf$([char]252)gen von $CleanPath" $Colors.Red
                }
            }
        }
        
        # 2. Commit erzeugen
        Write-Log "Erstelle Commit..."
        $EscapedComment = $Comment -replace '"', '\"'
        $CommitResult = Invoke-Git "commit -m `"$EscapedComment`""
        
        if ($CommitResult.ExitCode -eq 0) {
            Write-Log $CommitResult.Output $Colors.Green
        } else {
            Write-Log "Fehler beim Commit:" $Colors.Red
            Write-Log $CommitResult.Error $Colors.Red
            $Success = $false
        }
    } else {
        Write-Log "=== START PUSH: Pushe ausstehende lokale Commits auf Branch '$SelectedBranch' ===" $Colors.Accent
    }
    
    if ($Success) {
        # 3. Push ausführen
        Write-Log "Übertrage Daten zu GitHub (Push auf '$SelectedBranch')..."
        $PushResult = Invoke-Git "push origin $SelectedBranch"
        
        if ($PushResult.ExitCode -eq 0) {
            Write-Log "=== ERFOLG: Daten wurden sicher auf GitHub hochgeladen! ===" $Colors.Green
            if (-not $IsPushOnly) {
                $txtCommitMsg.Text = ""
            }
        } else {
            Write-Log "Fehler beim Hochladen zu GitHub:" $Colors.Red
            Write-Log $PushResult.Error $Colors.Red
            Write-Log "TIPP: Bitte pr$([char]252)fen Sie Ihre Internetverbindung. Da Ihr Commit lokal bereits erstellt wurde, k$([char]246)nnen Sie den Push $([char]252)ber diesen Button erneut versuchen, sobald die Verbindung wiederhergestellt ist." $Colors.Accent
        }
    }
    
    $Form.Enabled = $true
    & $UpdateStatus
    & $UpdateBranches
}

# Branch Erstellung
$DoNewBranch = {
    $NewBranchName = [Microsoft.VisualBasic.Interaction]::InputBox("Gib den Namen des neuen Branches ein (keine Leerzeichen):", "Neuer Git-Branch", "")
    if ($NewBranchName -ne $null) {
        $NewBranchName = $NewBranchName.Trim()
        
        if (-not [string]::IsNullOrEmpty($NewBranchName)) {
            if ($NewBranchName -match "\s") {
                [System.Windows.Forms.MessageBox]::Show("Der Branch-Name darf keine Leerzeichen enthalten.", "Eingabefehler", "OK", "Error") | Out-Null
                return
            }
            
            Write-Log "Erstelle Branch '$NewBranchName' und wechsle..." $Colors.Accent
            $Result = Invoke-Git "checkout -b $NewBranchName"
            if ($Result.ExitCode -eq 0) {
                Write-Log "Branch '$NewBranchName' erfolgreich erstellt!" $Colors.Green
                & $UpdateBranches
            } else {
                Write-Log "Fehler beim Erstellen:" $Colors.Red
                Write-Log $Result.Error $Colors.Red
            }
        }
    }
}

# Initialisierungs-Assistent ausführen
$DoInitRepository = {
    $Url = $txtInitUrl.Text.Trim()
    
    Write-Log "=== INITIALISIERUNG START ===" $Colors.Accent
    
    # 1. git init
    $InitRes = Invoke-Git "init"
    if ($InitRes.ExitCode -eq 0) {
        Write-Log "Git-Repository erfolgreich lokal initialisiert." $Colors.Green
    } else {
        Write-Log "Fehler bei 'git init': $($InitRes.Error)" $Colors.Red
        return
    }
    
    # 2. Standardbranch definieren
    Invoke-Git "config --global init.defaultBranch main" | Out-Null
    $BranchRes = Invoke-Git "branch -M main"
    if ($BranchRes.ExitCode -eq 0) {
        Write-Log "Haupt-Branch auf 'main' definiert." $Colors.Green
    }
    
    # 3. Remote URL verknüpfen (falls eingegeben)
    if (-not [string]::IsNullOrEmpty($Url)) {
        $RemoteRes = Invoke-Git "remote add origin `"$Url`""
        if ($RemoteRes.ExitCode -eq 0) {
            Write-Log "Verkn$([char]252)pft mit Remote URL: $Url" $Colors.Green
        } else {
            Write-Log "Fehler beim Verkn$([char]252)pfen der Remote URL: $($RemoteRes.Error)" $Colors.Red
        }
    }
    
    # 4. Status neu einlesen
    $IsGitRepo = Test-Path ".git"
    & $DoRefreshAll
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
                Write-Log "GitHub Remote-Link erfolgreich ge$([char]228)ndert auf: $NewUrl" $Colors.Green
                & $UpdateStatus
            } else {
                Write-Log "Fehler beim Hinzuf$([char]252)gen des Remotes: $($AddRes.Error)" $Colors.Red
            }
        } else {
            Write-Log "GitHub Remote-Link gel$([char]246)scht. Es ist kein Ziel mehr hinterlegt." $Colors.Accent
            & $UpdateStatus
        }
    }
}

# Neuen Ordner im Explorer erstellen
$DoCreateFolder = {
    $selectedNode = $treeView.SelectedNode
    $targetPath = $ScriptPath
    if ($selectedNode -ne $null) {
        # Falls Datei ausgewählt ist, übergeordneten Ordner nehmen
        if (Test-Path $selectedNode.Tag -PathType Leaf) {
            $targetPath = Split-Path $selectedNode.Tag -Parent
        } else {
            $targetPath = $selectedNode.Tag
        }
    }
    
    $folderName = [Microsoft.VisualBasic.Interaction]::InputBox("Geben Sie den Namen des neuen Ordners ein:", "Ordner erstellen", "")
    if ($folderName -ne $null) {
        $folderName = $folderName.Trim()
        if (-not [string]::IsNullOrEmpty($folderName)) {
            $newPath = Join-Path $targetPath $folderName
            if (-not (Test-Path $newPath)) {
                try {
                    New-Item -ItemType Directory -Path $newPath | Out-Null
                    Write-Log "Ordner erfolgreich erstellt: $(Split-Path $newPath -Leaf)" $Colors.Green
                    & $UpdateTreeView
                } catch {
                    [System.Windows.Forms.MessageBox]::Show("Fehler beim Erstellen des Ordners.", "Fehler", "OK", "Error") | Out-Null
                }
            } else {
                [System.Windows.Forms.MessageBox]::Show("Der Ordner existiert bereits.", "Hinweis", "OK", "Information") | Out-Null
            }
        }
    }
}

# Leere Ordner tracken (.gitkeep hinzufügen)
$DoSyncEmptyFolders = {
    Write-Log "Suche nach leeren Ordnern..." $Colors.Accent
    
    $script:createdCount = 0
    
    function Scan-EmptyDirs {
        param($path)
        $items = Get-ChildItem -Path $path -Force
        
        $hasFiles = $false
        $subDirs = @()
        
        foreach ($item in $items) {
            if ($item.PSIsContainer) {
                if ($item.Name -ne ".git") {
                    $subDirs += $item.FullName
                }
            } else {
                if ($item.Name -ne ".gitkeep") {
                    $hasFiles = $true
                }
            }
        }
        
        # Falls Blattordner und komplett leer
        if (-not $hasFiles -and $subDirs.Count -eq 0) {
            $gitkeepPath = Join-Path $path ".gitkeep"
            if (-not (Test-Path $gitkeepPath)) {
                try {
                    New-Item -ItemType File -Path $gitkeepPath -Force | Out-Null
                    $relFolder = $path.Replace($ScriptPath, "")
                    Write-Log "Leerer Ordner getrackt: $relFolder" $Colors.Green
                    $script:createdCount++
                } catch {}
            }
        } else {
            foreach ($sub in $subDirs) {
                Scan-EmptyDirs $sub
            }
        }
    }
    
    Scan-EmptyDirs $ScriptPath
    
    if ($script:createdCount -gt 0) {
        Write-Log "Synchronisation fertig! $($script:createdCount) leere Ordner wurden mit einer .gitkeep-Datei versehen und koennen hochgeladen werden." $Colors.Green
        & $UpdateTreeView
        & $UpdateStatus
    } else {
        Write-Log "Keine leeren Ordner gefunden, die noch nicht getrackt sind." $Colors.Gray
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
# 6. Event-Verknüpfungen & Start der GUI
# ------------------------------------------------------------------------------
$btnRefresh.Add_Click($DoRefreshAll)
$btnPull.Add_Click($DoPull)
$btnPush.Add_Click($DoPush)
$btnNewBranch.Add_Click($DoNewBranch)
$btnInitRun.Add_Click($DoInitRepository)
$btnChangeRemote.Add_Click($DoChangeRemote)
$btnCreateFolder.Add_Click($DoCreateFolder)
$btnSyncEmpty.Add_Click($DoSyncEmptyFolders)

# Neue Event-Verknuepfungen fuer Branch-Management & Commit-Verlauf
$btnMergeBranch.Add_Click($DoMergeBranch)
$btnRefreshHistory.Add_Click($UpdateHistory)
$cmbBranches.add_SelectedIndexChanged($cmbBranches_SelectedIndexChanged)

$HistoryListBox.add_SelectedIndexChanged({
    $Selected = $HistoryListBox.SelectedItem
    if ($Selected -and $Selected -ne "Keine Commits vorhanden oder Fehler beim Laden.") {
        if ($Selected -match "^([a-f0-9]+)\s+(.*)$") {
            $Hash = $Matches[1]
            $ShowRes = Invoke-Git ("show --stat " + $Hash)
            if ($ShowRes.ExitCode -eq 0) {
                $txtCommitDetails.Text = $ShowRes.Output
            } else {
                $txtCommitDetails.Text = "Fehler beim Laden des Commits: " + $ShowRes.Error
            }
        }
    }
})

[void][System.Reflection.Assembly]::LoadWithPartialName("Microsoft.VisualBasic")

# Laden des Formulars
$Form.Add_Load({
    Write-Log "==================================================================" $Colors.Accent
    Write-Log " UNIVERSAL GIT MANAGER GESTARTET" $Colors.Accent
    Write-Log "==================================================================" $Colors.Accent
    
    # Prüfen, ob Git auf dem Rechner verfügbar ist
    $GitCheck = Invoke-Git "--version"
    if ($GitCheck.ExitCode -ne 0) {
        Write-Log "KRITISCHER FEHLER: Git wurde auf diesem PC nicht im Umgebungspfad (PATH) gefunden!" $Colors.Red
        Write-Log "Bitte installiere Git f$([char]252)r Windows oder f$([char]252)ge es deinem PATH hinzu." $Colors.Text
        $Form.Enabled = $false
        return
    }
    
    if (Test-GitRepository) {
        Write-Log "Projekt-Schnittstelle: Lokales Git-Repository erkannt." $Colors.Green
        & $DoRefreshAll
    } else {
        $panelInit.Visible = $true
        Write-Log "HINWEIS: Dieses Arbeitsverzeichnis ist noch kein Git-Repository!" $Colors.Red
        Write-Log "Nutze den obigen Assistenten zur sofortigen Einrichtung." $Colors.Text
        & $UpdateTreeView
    }
})

$Form.ShowDialog() | Out-Null
