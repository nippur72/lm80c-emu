# LM80C Javascript emulator

A JavaScript emulator for the [LM80C](https://github.com/leomil72/LM80C) computer by Leonardo Miliani.

Open the emulator directly in your browser: [lm80c-emu](https://nippur72.github.io/lm80c-emu/)

LOADING AND SAVING FILES
========================

- prg files (`.prg`) are plain files that are loaded in memory as-is

Use File → Open program… (or drag & drop a `.prg` file on the emulator's window) to load
a program into memory; type `RUN` at the BASIC prompt to execute it. File → Save program…
downloads the program currently in memory.

These are the commands you can type from the JavaScript console (F12 key):

- `loadBytes(bytes [,address])` writes a byte array into memory
- `paste(text)` paste a string of text (e.g. containing a BASIC program) via the LM80C serial line; the text is sent line by line and paced so that long BASIC listings don't overflow the receive buffer (use `await paste(...)`)

DEBUGGER
========
You can plug your own Javascript debug functions by defining 
`debugBefore()` and `debugAfter(elapsed)` in the JavaScript console.

`debugBefore` is executed before any Z80 instruction; `debugAfter` is executed
after.

To activate the debug mode use `lm80c_set_debug(true)` and `lm80c_set_debug(false)`  
to deactivate it. Within the debug functions you can access all the emulator variables,
most likely you'll want to read the Z80 state with `cpu.getState()` or the memory content
with `mem_read()` and `mem_write()`.

START WITH A DIFFERENT FIRMWARE
===============================

To select a different firmware than the latest one, use the querystring parameter
`rom`, e.g.:

https://nippur72.github.io/lm80c-emu?rom=314

to start with firmware named "LM80C-firmware-r314.rom"


KEYBOARD MODES
==============

The querystring parameter `kbtype` selects how the PC keyboard drives the emulated one:

- `kbtype=0` (default) immediate: the hardware matrix mirrors the real key state, so multiple
  keys can be held at the same time and there is no queue. Best for games and for fast typing.
- `kbtype=1` serial: keystrokes are sent as characters over the LM80C serial line, as in
  the original project (before the matrix keyboard). Meant for typing, not for games.

https://nippur72.github.io/lm80c-emu?kbtype=1

The mode can also be changed at runtime from the JavaScript console with `setKbType(n)`.


AUTOLOADING
=================
The emulator can be used in cross-development allowing to automate the process of 
loading and executing the program being developed. This will save lot of annoying drag&drops. 

Pass the program to the `load` querystring parameter:

https://nippur72.github.io/lm80c-emu?load=software/prg/wave.prg

The file is fetched from the `software/` directory, copied into memory and run. An absolute
`http(s)` URL can be used instead to fetch the program from a remote location.



