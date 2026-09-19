import { audio, cpu } from '../emulator';
import { downloadBytes } from '../bytes';
import { cf_card_dump, cf_card_mount } from '../cfcard';
import { download_prg } from '../files';
import { isPasting, stopPaste, pasteText, pasteClipboard } from '../paste';
import { droppedFile, goFullScreen } from '../browser';
import { getKbType, setKbType, tapKeys } from '../keyboard';
import { KEY_CBM, KEY_CTRL } from '../keys';

type CommandType = 'normal' | 'checkbox' | 'radio';

type Command = {
   label: string;
   shortcut?: string;
   type?: CommandType;
   isVisible?: (arg?: string) => boolean;
   isEnabled?: (arg?: string) => boolean;
   isChecked?: (arg?: string) => boolean;
   run: (arg?: string) => void;
};

const DEFAULT_ROM = '64K120';

function fire(promise: Promise<void>): void {
   promise.catch(error => console.error(error));
}

function currentRom(): string {
   return new URLSearchParams(window.location.search).get('rom') ?? DEFAULT_ROM;
}

function reloadWithRom(rom: string): void {
   const url = new URL(window.location.href);
   url.searchParams.set('rom', rom);
   window.location.assign(url.toString());
}

/** a hidden file input, created once and reused for every subsequent pick */
function makeFilePicker(accept: string, onFile: (file: File) => void): () => void {
   let input: HTMLInputElement | undefined;
   return () => {
      if (input === undefined) {
         input = document.createElement('input');
         input.type = 'file';
         input.accept = accept;
         input.style.display = 'none';
         input.addEventListener('change', () => {
            const file = input?.files?.[0];
            if (file) onFile(file);
            if (input) input.value = '';
         });
         document.body.appendChild(input);
      }
      input.click();
   };
}

const pickPrgFile = makeFilePicker('.prg', file => {
   file.arrayBuffer()
      .then(bytes => droppedFile(file.name, new Uint8Array(bytes)))
      .catch(error => console.error(error));
});

const pickCfCardFile = makeFilePicker('.img,.bin,.iso', file => {
   file.arrayBuffer()
      .then(bytes => cf_card_mount(new Uint8Array(bytes)))
      .catch(error => console.error(error));
});

const pickTextFile = makeFilePicker('.txt,.bas', file => {
   file.text()
      .then(pasteText)
      .catch(error => console.error(error));
});

/** the LM80C manuals are pdf files in the docs folder served next to index.html */
function openManual(file: string): void {
   window.open(`docs/${encodeURIComponent(file)}`, '_blank');
}

const commands: Record<string, Command> = {

   'file.openPrg': {
      label: 'Open program…',
      run: pickPrgFile
   },
   'file.savePrg': {
      label: 'Save program…',
      run: () => fire(download_prg('program.prg'))
   },
   'file.openCfCard': {
      label: 'Open CF card…',
      run: pickCfCardFile
   },
   'file.saveCfCard': {
      label: 'Save CF card…',
      run: () => downloadBytes('cfcard.img', cf_card_dump())
   },
   'file.reload': {
      label: 'Reload page',
      run: () => window.location.reload()
   },

   // RESTORE is CTRL+C= on the real keyboard (CTRL+ALT on the PC one)
   'machine.restore': {
      label: 'Restore',
      run: () => tapKeys([KEY_CTRL, KEY_CBM])
   },
   'machine.reset': {
      label: 'Reset',
      shortcut: 'Ctrl+Alt+Pause',
      run: () => cpu.reset()
   },
   'machine.setFirmware': {
      label: 'Firmware',
      type: 'radio',
      isChecked: rom => currentRom() === rom,
      run: rom => { if (rom) reloadWithRom(rom); }
   },

   'keyboard.matrix': {
      label: 'Native matrix keyboard',
      type: 'radio',
      isChecked: () => getKbType() === 0,
      run: () => setKbType(0)
   },
   'keyboard.serial': {
      label: 'Serial keyboard',
      type: 'radio',
      isChecked: () => getKbType() === 1,
      run: () => setKbType(1)
   },
   'keyboard.paste': {
      label: 'Paste clipboard',
      isVisible: () => !isPasting(),
      run: () => fire(pasteClipboard())
   },
   'keyboard.pasteFile': {
      label: 'Paste file…',
      isVisible: () => !isPasting(),
      run: pickTextFile
   },
   'keyboard.stopPaste': {
      label: 'Stop pasting',
      isVisible: () => isPasting(),
      run: stopPaste
   },

   'view.fullscreen': {
      label: 'Fullscreen',
      shortcut: 'Double click',
      run: () => goFullScreen()
   },

   'audio.sound': {
      label: 'Sound',
      type: 'checkbox',
      isChecked: () => audio.isEnabled(),
      run: () => audio.setEnabled(!audio.isEnabled())
   },

   'help.basicManual': {
      label: 'BASIC reference manual',
      run: () => openManual('LM80C BASIC reference manual.pdf')
   },
   'help.dosManual': {
      label: 'DOS manual',
      run: () => openManual('LM80C DOS.pdf')
   },
   'help.hardwareManual': {
      label: 'Hardware reference manual',
      run: () => openManual('LM80C hardware reference manual.pdf')
   },
   'help.askAI': {
      label: 'Ask AI about LM80C',
      run: () => window.open('https://notebooklm.google.com/notebook/6242f209-5409-4c4b-9507-04e621bf3094', '_blank')
   },
   'help.emulatorRepo': {
      label: "Emulator on Github",
      run: () => window.open('https://github.com/nippur72/lm80c-emu', '_blank')
   },
   'help.lm80cRepo': {
      label: 'LM80C on Github',
      run: () => window.open('https://github.com/leomil72/LM80C', '_blank')
   }
};

/** a click on the menu is a user gesture: use it to unlock the (suspended) audio context */
function unlockAudio(): void {
   audio.resume();
}

function runCommand(id: string, arg?: string): void {
   const command = commands[id];
   if (!command) return;
   if (command.isEnabled && !command.isEnabled(arg)) return;
   unlockAudio();
   command.run(arg);
}

export { commands, runCommand, unlockAudio };
export type { Command, CommandType };
