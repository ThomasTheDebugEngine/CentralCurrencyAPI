
$currentLocation = Get-Location

function Get-ConfigPath{
    Process{
        $CfgFileName = "mongod.cfg"

        $RefIndex = $PSScriptRoot.LastIndexOf("\") #get reference point to construct cfg file path
        $CfgPath = $PSScriptRoot.Substring(0,$RefIndex) + "\" + $CfgFileName

        return $CfgPath.ToString()
    }
}

function Set-StorageParams($FullCfgPath){
    Process{
        $DataRelPath = "\db\data"
        $LogRelPath = "\db\logs\mongod.log"
        
        
        $RootPath = $PSScriptRoot.Substring(0,$PSScriptRoot.LastIndexOf("\"))
        $FullDataPath = $RootPath + $DataRelPath
        $FullLogPath = $RootPath + $LogRelPath

        $FullDataString = "dbPath: " + $FullDataPath + " #Auto generated"
        $FullLogString = " path: " + $FullLogPath + " #Auto generated"
        
        (Get-Content -path $FullCfgPath -Raw) -replace "dbPath:.*", $FullDataString | Set-Content $FullCfgPath
        (Get-Content -Path $FullCfgPath -Raw) -replace "[^db]path:.*", $FullLogString | Set-Content $FullCfgPath
        
        $Newtext = (Get-Content -Path $FullCfgPath -Raw) -replace "(?s)`r`n\s*$"
        [system.io.file]::WriteAllText($FullCfgPath, $Newtext)        
    }
}


if($currentLocation -ne $PSScriptRoot){
    Write-Host "Getting server directory..."

    cd $PSScriptRoot; cd .. # last cd is to leave the terminal at server root dir

    $RetCfgPath = Get-ConfigPath
    Set-StorageParams -FullCfgPath $RetCfgPath
}
elseif($currentLocation -eq $PSScriptRoot){
    Write-Host "CWD valid skipping directory initialisation"
    
    $RetCfgPath = Get-ConfigPath
    Set-StorageParams -FullCfgPath $RetCfgPath
}
else{
    Write-Host "Unknown ERROR @ CWD initialisation"
}

$args = "/k mongod --config " + $RetCfgPath
Write-Host "TEST IS: " $args

Start-Process -Verb runAs -FilePath "cmd.exe" -ArgumentList $args
