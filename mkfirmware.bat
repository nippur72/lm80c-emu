set DEST=rom.asm
set VER=r312
set LM80CPATH=..\LM80C
echo ; > %DEST%
type %LM80CPATH%\include\bootloader\bootloader-%VER%.asm >> %DEST%
type %LM80CPATH%\include\vdp\vdp-%VER%.asm >> %DEST%
type %LM80CPATH%\include\psg\psg-%VER%.asm >> %DEST%
type %LM80CPATH%\include\basic\basic32k-%VER%.asm >> %DEST%
type %LM80CPATH%\include\utils\utils-r11.asm >> %DEST%
type %LM80CPATH%\include\vdp\6x8fonts-r14.asm >> %DEST%
type %LM80CPATH%\include\vdp\8x8fonts-r17.asm >> %DEST%
type %LM80CPATH%\include\vdp\logo-fonts.asm >> %DEST%
type %LM80CPATH%\"12-Home computer\LM80C-firmware-%VER%.asm" >> %DEST%

explorer http://k1.spdns.de/cgi-bin/zasm.cgi






