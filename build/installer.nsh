!macro preInit
  ; Set default installation directory to $LOCALAPPDATA\Programs\xdlwebcast
  SetRegView 64
  StrCpy $INSTDIR "$LOCALAPPDATA\Programs\xdlwebcast"
!macroend

!macro customInstall
  ; Add registry key to run as administrator
  WriteRegStr HKCU "Software\Microsoft\Windows NT\CurrentVersion\AppCompatFlags\Layers" "$INSTDIR\${APP_EXECUTABLE_FILENAME}" "RUNASADMIN"
  WriteRegStr HKLM "Software\Microsoft\Windows NT\CurrentVersion\AppCompatFlags\Layers" "$INSTDIR\${APP_EXECUTABLE_FILENAME}" "RUNASADMIN"
!macroend
