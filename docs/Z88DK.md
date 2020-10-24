# On the LM80C computer for a Z88DK implementation

LM80C is a modern Z80 home computer built with vintage
chips, all designed by Leonardo Miliani.

The machine is also fully emulated in software (runs in the browser)
and hardware (MiST FPGA).

## LM80C Hardware

- Z80 3.5 Mhz
- Video TMS9918 (NTSC) with 16K VRAM
- Audio AY38910
- 32K RAM
- 32K ROM with custom Microsoft BASIC, latest firmware is R3.14
- Z80 SIO, PIO and CTC
- Commodore C16 repurposed keyboard
- No joysticks
- No storage device (see "misc" below)

## Useful URLs

- online emulator: https://nippur72.github.io/lm80c-emu
- author's repo with sources and schematics: https://github.com/leomil72/LM80C
- FPGA implementation for the MiST: https://github.com/nippur72/LM80C_MiST

## 64K Z80 ADDRESS SPACE MAP

$0000-$7FFF Firmware ROM
$8000-$8240 BASIC work space
$8241-$FFFF Free RAM (32074 bytes available to BASIC)

## I/O ports

$00-$03   Z80 PIO (parallel interface)
$10-$13   Z80 CTC (counter and timer)
$20-$23   Z80 SIO (serial interface)
$30       TMS9918 data port
$32       TMS9918 register port
$40-$43   AY-3-8910 (audio)

## MISC

1) On boot, CTC generates an INT interrupt at 100Hz rate for updating
the clock and reading the keyboard.

2) Keyboard is connected to the parallel ports of the audio chip,
CPU queries keyboard columns on port A and receives the rows on port B
(see "KEYBOARD" rom routine).

3) The system currently has no storage device (save/load from SD card is
in development). On the real machine programs are loaded via serial
interface (BASIC programs). On the emulator, you can drag & drop a ".prg"
file on the emulated screen and then RUN it.

4) the builtin font is standard ASCII extended to 255 with petscii-like
graphics. There is no reverse.

## USEFUL ROM ENTRIES

0C88: KEYBOARD
06C8: CHAR2VID

a complete ROM .lst file can be found here:
https://github.com/nippur72/lm80c-emu/blob/master/rom.lst

## BASIC LAUNCHER

C programs can be launched by adding the following header
to the ".prg" binary file output:

0x51, 0x82, 0xe4, 0x07, 0xab, 0x26, 0x48, 0x38,
0x32, 0x35, 0x33, 0x3a, 0x80, 0x20, 0x20, 0x00,
0x00, 0x00

which results in the following BASIC stub program:

2020 SYS&H8253:END

normally loaded at 0x8241:

8241: 51 82 e4 07 ab 26 48 38
8249: 32 35 33 3a 80 20 20 00
8251: 00 00

/* c program follows here */

Compiled program can be tested on the emulator by simply drag&dropping
the ".prg" file on the emulator window (and then RUN + enter).
