
import {
   KEY_RESET, KEY_HELP, KEY_F3, KEY_F2, KEY_F1, KEY_AT, KEY_POUND, KEY_RETURN, KEY_INST_DEL,
   KEY_RIGHT, KEY_PLUS, KEY_EQUAL, KEY_ESC, KEY_SLASH, KEY_SEMICOLON, KEY_ASTERISK, KEY_LEFT,
   KEY_UP, KEY_MINUS, KEY_COLON, KEY_DOT, KEY_COMMA, KEY_L, KEY_P, KEY_DOWN, KEY_0, KEY_O,
   KEY_K, KEY_M, KEY_N, KEY_J, KEY_I, KEY_9, KEY_8, KEY_U, KEY_H, KEY_B, KEY_V, KEY_G, KEY_Y,
   KEY_7, KEY_6, KEY_T, KEY_F, KEY_C, KEY_X, KEY_D, KEY_R, KEY_5, KEY_4, KEY_E, KEY_S, KEY_Z,
   KEY_SHIFT, KEY_A, KEY_W, KEY_3, KEY_2, KEY_Q, KEY_CBM, KEY_SPACE, KEY_RUN_STOP, KEY_CTRL,
   KEY_CLR_HOME, KEY_1, keyboardReset, keyPress
} from './keys';
import { pckey_to_hardware_keys_ITA } from './keyboard_IT';
import { pckey_to_lm80c_char } from './keyboard_SIO';
import { SIO_receiveChar } from './emscripten_wrapper';
import { audio, cpu } from './emulator';

function pckey_to_hwkey(pckey: string): number | undefined {
   let hardware_key: number | undefined;   
   
   if(pckey === "F1")  hardware_key = KEY_F1 ; 
   if(pckey === "F2")  hardware_key = KEY_F2 ; 
   if(pckey === "F3")  hardware_key = KEY_F3 ; 
   if(pckey === "F4")  hardware_key = KEY_F4 ; 

   /*
   if(pckey === "F5")  hardware_key = KEY_F5 ; 
   if(pckey === "F6")  hardware_key = KEY_F6 ; 
   if(pckey === "F7")  hardware_key = KEY_F7 ; 
   if(pckey === "F8")  hardware_key = KEY_F8 ; 
   if(pckey === "F9")  hardware_key = KEY_F9 ; 
   if(pckey === "F10") hardware_key = KEY_F10; 
   */

   if(pckey === "Insert") hardware_key = KEY_INST_DEL; 
   if(pckey === "Delete") hardware_key = KEY_INST_DEL; 
   if(pckey === "Escape") hardware_key = KEY_ESC; 

   if(pckey === "Digit1") hardware_key = KEY_1; 
   if(pckey === "Digit2") hardware_key = KEY_2; 
   if(pckey === "Digit3") hardware_key = KEY_3; 
   if(pckey === "Digit4") hardware_key = KEY_4; 
   if(pckey === "Digit5") hardware_key = KEY_5; 
   if(pckey === "Digit6") hardware_key = KEY_6; 
   if(pckey === "Digit7") hardware_key = KEY_7; 
   if(pckey === "Digit8") hardware_key = KEY_8; 
   if(pckey === "Digit9") hardware_key = KEY_9; 
   if(pckey === "Digit0") hardware_key = KEY_0; 

   if(pckey === "Minus")     hardware_key = KEY_MINUS; 
   if(pckey === "Equal")     hardware_key = KEY_EQUAL; 
   if(pckey === "Backspace") hardware_key = KEY_INST_DEL;    

   if(pckey === "End")  hardware_key = KEY_DEL_LINE; 
   if(pckey === "Home") hardware_key = KEY_CLR_HOME; 
   //if(pckey === "Tab")  hardware_key = KEY_TAB; 

   if(pckey === "KeyQ") hardware_key = KEY_Q; 
   if(pckey === "KeyW") hardware_key = KEY_W; 
   if(pckey === "KeyE") hardware_key = KEY_E; 
   if(pckey === "KeyR") hardware_key = KEY_R; 
   if(pckey === "KeyT") hardware_key = KEY_T; 
   if(pckey === "KeyY") hardware_key = KEY_Y; 
   if(pckey === "KeyU") hardware_key = KEY_U; 
   if(pckey === "KeyI") hardware_key = KEY_I; 
   if(pckey === "KeyO") hardware_key = KEY_O; 
   if(pckey === "KeyP") hardware_key = KEY_P; 

   //if(pckey === "BracketLeft")  hardware_key = KEY_OPEN_BRACKET; 
   //if(pckey === "BracketRight") hardware_key = KEY_CLOSE_BRACKET; 
   if(pckey === "Enter")        hardware_key = KEY_RETURN; 
   if(pckey === "NumpadEnter")  hardware_key = KEY_RETURN; 
   if(pckey === "ControlLeft")  hardware_key = KEY_CTRL; 
   if(pckey === "ControlRight") hardware_key = KEY_CTRL; 

   if(pckey === "KeyA") hardware_key = KEY_A; 
   if(pckey === "KeyS") hardware_key = KEY_S; 
   if(pckey === "KeyD") hardware_key = KEY_D; 
   if(pckey === "KeyF") hardware_key = KEY_F; 
   if(pckey === "KeyG") hardware_key = KEY_G; 
   if(pckey === "KeyH") hardware_key = KEY_H; 
   if(pckey === "KeyJ") hardware_key = KEY_J; 
   if(pckey === "KeyK") hardware_key = KEY_K; 
   if(pckey === "KeyL") hardware_key = KEY_L; 

   if(pckey === "Semicolon") hardware_key = KEY_SEMICOLON; 
   //if(pckey === "Quote")     hardware_key = KEY_QUOTE; 
   //if(pckey === "Backquote") hardware_key = KEY_BACK_QUOTE; 
   if(pckey === "Backslash") hardware_key = KEY_ESC; 
   
   if(pckey === "ArrowUp")    hardware_key = KEY_UP; 
   if(pckey === "ShiftLeft")  hardware_key = KEY_SHIFT; 
   if(pckey === "ShiftRight") hardware_key = KEY_SHIFT; 

   if(pckey === "KeyZ") hardware_key = KEY_Z;
   if(pckey === "KeyX") hardware_key = KEY_X;
   if(pckey === "KeyC") hardware_key = KEY_C;
   if(pckey === "KeyV") hardware_key = KEY_V;
   if(pckey === "KeyB") hardware_key = KEY_B;
   if(pckey === "KeyN") hardware_key = KEY_N;
   if(pckey === "KeyM") hardware_key = KEY_M;

   if(pckey === "Comma")  hardware_key = KEY_COMMA; 
   if(pckey === "Period") hardware_key = KEY_DOT;   
   if(pckey === "Slash")  hardware_key = KEY_SLASH; 

   //if(pckey === "PageUp")   hardware_key = KEY_MU; 
   //if(pckey === "PageDown") hardware_key = KEY_GRAPH;

   if(pckey === "ArrowLeft")  hardware_key = KEY_LEFT; 
   if(pckey === "ArrowRight") hardware_key = KEY_RIGHT; 
   if(pckey === "CapsLock")   hardware_key = KEY_SHIFT;   // TODO caps lock
   if(pckey === "Space")      hardware_key = KEY_SPACE; 
   if(pckey === "ArrowDown")  hardware_key = KEY_DOWN; 

   if(hardware_key === undefined) {
      // console.log(pckey);
      return undefined;
   }
   
   return hardware_key;
}

function keyDown(e: KeyboardEvent) { 

   // from Chrome 71 audio is suspended by default and must resume within an user-generated event
   audio.resume();

   // disable auto repeat, as it is handled on the firmware
   // (in SIO mode there is no matrix scanning, so the browser's auto repeat is used)
   if(e.repeat && KBTYPE !== 1) {
      e.preventDefault(); 
      return;
   }   

   // *** special (non characters) keys ***   

   // RESET key is CTRL+ALT+BREAK
   if(e.code === "Pause" && e.altKey && e.ctrlKey) {
      cpu.reset();      
      e.preventDefault(); 
      return;
   }

   // const hardware_key = pckey_to_hwkey(e.code);

   // if keyboard ITA
   const hardware_keys = pckey_to_hardware_keys_ITA(e.code, e.key, e);
   if(hardware_keys.length === 0) return;

   if(KBTYPE === 0) {
      kb_code_keys.set(e.code, hardware_keys);
      kb0_press(hardware_keys);
   }
   else {
      // KBTYPE === 1: the character goes to the serial line
      const c = pckey_to_lm80c_char(hardware_keys);
      if(c !== undefined) SIO_receiveChar(c);
   }

   e.preventDefault();
}

function keyUp(e: KeyboardEvent) {
   const hardware_keys = pckey_to_hardware_keys_ITA(e.code, e.key, e);
   if(hardware_keys.length === 0) return;

   if(KBTYPE === 0) {
      // hardware_keys is recomputed with the current modifiers, so it may differ from the
      // list generated on keydown: release the keys that were actually pressed
      kb0_release(kb_code_keys.get(e.code) ?? hardware_keys);
      kb_code_keys.delete(e.code);
   }
   // KBTYPE === 1: nothing to do, the SIO receives the key pressure only

   e.preventDefault();
}

// connect DOM events
const element = document; 
element.onkeydown = keyDown;
element.onkeyup = keyUp;

/** how the PC keyboard drives the emulated one:
 *     0 = immediate (default): the hardware matrix mirrors the real key state (no queue)
 *     1 = serial: keystrokes are sent as characters over the LM80C serial line
 */
let KBTYPE = 0;

// minimum time a released key is kept visible in the matrix, so that short taps are not
// lost between two firmware scans (~15.6 ms at 64 Hz)
const KB_MIN_HOLD_MS = 30;

const kb_held_count = new Map<number, number>();   // hardware key -> how many PC keys hold it down
const kb_latch_ms   = new Map<number, number>();   // hardware key -> latch expiry time
const kb_code_keys  = new Map<string, number[]>(); // e.code -> hardware keys generated on keydown

function kb0_apply() {
   const keys = new Set<number>([...kb_held_count.keys(), ...kb_latch_ms.keys()]);
   keyboardReset();
   for(const k of keys) keyPress(k);
}

function kb0_press(hardware_keys: number[]) {
   for(const k of hardware_keys) {
      kb_held_count.set(k, (kb_held_count.get(k) ?? 0) + 1);
      kb_latch_ms.delete(k);
   }
   kb0_apply();
}

function kb0_release(hardware_keys: number[]) {
   const now = performance.now();
   for(const k of hardware_keys) {
      const count = (kb_held_count.get(k) ?? 1) - 1;
      if(count > 0) kb_held_count.set(k, count);
      else {
         kb_held_count.delete(k);
         kb_latch_ms.set(k, now + KB_MIN_HOLD_MS);
      }
   }
   kb0_apply();
}

function kb0_frame() {
   if(kb_latch_ms.size === 0) return;

   const now = performance.now();
   let expired = false;
   for(const [k, t] of kb_latch_ms) {
      if(t <= now) {
         kb_latch_ms.delete(k);
         expired = true;
      }
   }
   if(expired) kb0_apply();
}

function setKbType(type: number) {
   if(type !== 0 && type !== 1) return;

   KBTYPE = type;
   kb_held_count.clear();
   kb_latch_ms.clear();
   kb_code_keys.clear();
   keyboardReset();
}

// a keyup can be missed when the page loses focus while a key is held down (e.g. alt+tab):
// release everything instead of leaving the key stuck in the matrix
function kb_releaseAll() {
   if(KBTYPE !== 0) return;

   kb_held_count.clear();
   kb_latch_ms.clear();
   kb_code_keys.clear();
   kb0_apply();
}

window.addEventListener("blur", kb_releaseAll);
document.addEventListener("visibilitychange", () => {
   if(document.visibilityState === "hidden") kb_releaseAll();
});

export { pckey_to_hwkey, keyDown, keyUp, KBTYPE, setKbType, kb0_frame };
