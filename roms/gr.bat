@echo off
SET FNAME1=..\..\LM80C\Rom\LM80C-firmware-r3.24.lst
SET FNAME2=..\..\LM80C\Rom\LM80C_64K-firmware-r1.16.lst

rem echo %FNAME1%
rem TYPE %FNAME1% | FINDSTR BASTXT     | FINDSTR 0x
rem TYPE %FNAME1% | FINDSTR PROGND     | FINDSTR 0x
rem TYPE %FNAME1% | FINDSTR CRSR_STATE | FINDSTR 0x
echo %FNAME2%
TYPE %FNAME2% | FINDSTR BASTXT     | FINDSTR 0x
TYPE %FNAME2% | FINDSTR PROGND     | FINDSTR 0x
TYPE %FNAME2% | FINDSTR CRSR_STATE | FINDSTR 0x

