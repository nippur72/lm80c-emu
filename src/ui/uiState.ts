// Kept in its own dependency-free module: keyboard.ts imports this, and it must not
// pull in React nor create an import cycle with emulator.ts.

let uiCapturesKeyboard = false;

function setUiCapturesKeyboard(value: boolean): void {
   uiCapturesKeyboard = value;
}

function isUiCapturingKeyboard(): boolean {
   return uiCapturesKeyboard;
}

/** true when the event comes from the menu bar, or from any other element marked with data-ui */
function isUiTarget(target: EventTarget | null): boolean {
   const element = target as HTMLElement | null;
   if (!element || typeof element.closest !== 'function') return false;
   return element.closest('[data-ui]') !== null;
}

export { setUiCapturesKeyboard, isUiCapturingKeyboard, isUiTarget };
