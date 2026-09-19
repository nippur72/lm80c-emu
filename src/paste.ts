import { sendSerialChar } from './serial';

// Cancellable paste: text is pushed to the SIO one byte at a time, so checking
// stopRequested between bytes halts the run almost immediately.

let pasting = false;
let stopRequested = false;
let pasteStateListener: (() => void) | undefined;

function isPasting(): boolean {
   return pasting;
}

function stopPaste(): void {
   stopRequested = true;
}

function onPasteStateChange(listener: () => void): void {
   pasteStateListener = listener;
}

function setPasting(value: boolean): void {
   pasting = value;
   stopRequested = false;
   pasteStateListener?.();
}

async function paste(text: string): Promise<void> {
   if(pasting) return;              // ignore overlapping pastes
   setPasting(true);
   try {
      const lines = text.replace(/\r\n?/g, "\n").split("\n");
      for(const linea of lines) {
         for(let t=0; t<linea.length; t++) {
            if(stopRequested) return;
            await sendSerialChar(linea.charCodeAt(t));
         }
         if(stopRequested) return;
         await sendSerialChar(13);   // CR
      }
   } finally {
      setPasting(false);
   }
}

/** paste() writes straight to the SIO, so it does not depend on the keyboard mode */
function pasteText(text: string): void {
   if (text === '') return;
   paste(text).catch(error => console.error(error));
}

async function pasteClipboard(): Promise<void> {
   const text = await navigator.clipboard?.readText();
   if (text) pasteText(text);
}

export { paste, pasteText, pasteClipboard, isPasting, stopPaste, onPasteStateChange };
