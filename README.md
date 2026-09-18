# LM80C Javascript emulator

A JavaScript emulator for the [LM80C](https://github.com/leomil72/LM80C) computer by Leonardo Miliani.

Open the emulator directly in your browser: [lm80c-emu](https://nippur72.github.io/lm80c-emu/)

FIRMWARE
========

Machine → Firmware selects the firmware to boot from. The newest 64K ROM is listed first,
followed by the recent ones and by an "Old" submenu with the legacy ROMs; the default is
`64K120`.

To start with a different firmware than the latest one, use the querystring parameter
`rom`, e.g.:

https://nippur72.github.io/lm80c-emu?rom=314

to start with firmware named "LM80C-firmware-r314.rom".

KEYBOARD MODES
==============

The querystring parameter `kbtype` selects how the PC keyboard drives the emulated one:

- `kbtype=0` (default) immediate: the hardware matrix mirrors the real key state, so multiple
  keys can be held at the same time and there is no queue. Best for games and for fast typing.
- `kbtype=1` serial: keystrokes are sent as characters over the LM80C serial line, as in
  the original project (before the matrix keyboard). Meant for typing, not for games.

https://nippur72.github.io/lm80c-emu?kbtype=1

The mode can also be changed at runtime from the Keyboard menu (Native matrix keyboard or
Serial keyboard).

Keyboard → Paste clipboard and Keyboard → Paste file… send text (e.g. a BASIC listing) to
the LM80C over the serial line, paced so that long listings don't overflow the receive
buffer.

AUTOLOADING
=================
The emulator can be used in cross-development allowing to automate the process of 
loading and executing the program being developed. This will save lot of annoying drag&drops. 

Pass the program to the `load` querystring parameter:

https://nippur72.github.io/lm80c-emu?load=software/prg/wave.prg

The file is fetched from the `software/` directory, copied into memory and run. An absolute
`http(s)` URL can be used instead to fetch the program from a remote location.

CF CARD
=======

By default the emulator mounts `software/cfcard.img` as the CF card at startup. Pass a
different image to the `cfcard` querystring parameter to mount it instead:

https://nippur72.github.io/lm80c-emu?cfcard=mycard.img

The file is fetched from the `software/` directory; an absolute `http(s)` URL can be used
instead to fetch the image from a remote location. If the image cannot be loaded, the
emulator keeps the empty, unformatted CF card.

BUILD AND RUN LOCALLY
=====================

You need Node.js and, only to rebuild the WASM core, the Emscripten SDK (the scripts expect
`EMSDK` to be set, otherwise they source `..\..\emsdk\emsdk_env.bat`).

    npm install          install the dependencies
    npm run buildwasm    rebuild the WASM core (mkwasm.bat, emcc wasm/prova.c)
    npm run build        bundle with Vite into dist/ (bundle.js, style.css)
    npm run serve        serve the emulator on http://localhost:8080

`npm run all` runs the three steps above in sequence.

The server must serve the repository root: `index.html` loads the ROMs from `roms/`, the
bundle from `dist/` and the Help manuals from `docs/`.

`buildwasm` is only needed after changing the C sources under `wasm/`; the built
`emscripten_module.js` / `emscripten_module.wasm` are committed. `mkfirmware.bat` is not part
of the emulator build: it assembles a firmware ROM from the LM80C sources and is only needed
to produce a new `roms/rom_*.js`.
