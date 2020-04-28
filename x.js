/*
this builds the firmware in windows
via the online: http://k1.spdns.de/cgi-bin/zasm.cgi
needs opening rom.asm and cut the #include
at the bottom of files

echo ; > rom.asm
type include\bootloader\bootloader-r36.asm >> rom.asm
type include\vdp\vdp-r36.asm >> rom.asm
type include\psg\psg-r36.asm >> rom.asm
type include\basic\basic32k-r36.asm >> rom.asm
type include\utils\utils-r11.asm >> rom.asm
type include\vdp\6x8fonts-r14.asm >> rom.asm
type include\vdp\8x8fonts-r17.asm >> rom.asm
type include\vdp\logo-fonts.asm >> rom.asm
type "12-Home computer\LM80C-firmware-r36.asm" >> rom.asm
*/

