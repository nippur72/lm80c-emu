import { KEY_SHIFT, KEY_CTRL, KEY_CBM, key_row_col } from './keys';

// PC key -> LM80C character codes: the same codes the firmware produces when it scans
// the keyboard matrix with the same key pressed. Transcribed from the firmware keymaps
// (roms/LM80C-firmware-r3.24.lst, KBMAP / KBMAP_SFT / KBMAP_ALT / KBMAP_CTRL).
//
// Indexed by row*8+col, the same order as key_row_col (row = KB, col = KA); each line
// below is one matrix row, starting from KB0.
//
// special codes:
//    3=RUN/STOP      8=DEL(backspace)  12=CLEAR         13=RETURN
//   14=CTRL         16=C=              20=SHIFT         24=HELP
//   25=HOME         26=INSERT         27=ESCAPE        28=CURSOR LEFT
//   29=CURSOR RIGHT 30=CURSOR UP      31=CURSOR DOWN

const asc = (c: string): number => c.charCodeAt(0);

const KBMAP: number[] = [
   asc('1'), 25, 14, 3, asc(' '), 16, asc('q'), asc('2'),   // KB0
   asc('3'), asc('w'), asc('a'), 20, asc('z'), asc('s'), asc('e'), asc('4'),   // KB1
   asc('5'), asc('r'), asc('d'), asc('x'), asc('c'), asc('f'), asc('t'), asc('6'),   // KB2
   asc('7'), asc('y'), asc('g'), asc('v'), asc('b'), asc('h'), asc('u'), asc('8'),   // KB3
   asc('9'), asc('i'), asc('j'), asc('n'), asc('m'), asc('k'), asc('o'), asc('0'),   // KB4
   31, asc('p'), asc('l'), asc(','), asc('.'), asc(':'), asc('-'), 30,   // KB5
   28, asc('*'), asc(';'), asc('/'), 27, asc('='), asc('+'), 29,   // KB6
   8, 13, 252, asc('@'), 1, 2, 4, 24   // KB7
];

const KBMAP_SFT: number[] = [
   asc('!'), 12, 14, 3, asc(' '), 16, asc('Q'), 34,   // KB0
   asc('#'), asc('W'), asc('A'), 20, asc('Z'), asc('S'), asc('E'), asc('$'),   // KB1
   asc('%'), asc('R'), asc('D'), asc('X'), asc('C'), asc('F'), asc('T'), asc('&'),   // KB2
   39, asc('Y'), asc('G'), asc('V'), asc('B'), asc('H'), asc('U'), asc('('),   // KB3
   asc(')'), asc('I'), asc('J'), asc('N'), asc('M'), asc('K'), asc('O'), 94,   // KB4
   31, asc('P'), asc('L'), asc('<'), asc('>'), asc('['), asc('_'), 30,   // KB5
   28, asc('*'), asc(']'), asc('?'), 27, 198, asc('+'), 29,   // KB6
   26, 13, 211, asc('@'), 5, 6, 22, 23   // KB7
];

const KBMAP_ALT: number[] = [
   asc('1'), 12, 14, 3, asc(' '), 16, 222, 196,   // KB0
   asc('3'), 221, 133, 20, 131, 130, 165, asc('4'),   // KB1
   asc('5'), 162, 166, 132, 157, 163, 168, asc('6'),   // KB2
   asc('7'), 171, 169, 161, 158, 172, 213, asc('8'),   // KB3
   asc('9'), 214, 216, 159, 160, 215, 135, 195,   // KB4
   31, 136, 138, 193, 192, 123, 144, 30,   // KB5
   28, 143, 125, 254, 27, 209, 148, 29,   // KB6
   8, 13, 224, 137, 5, 6, 22, 23   // KB7
];

const KBMAP_CTRL: number[] = [
   asc('1'), 25, 14, 3, asc(' '), 16, 154, asc('2'),   // KB0
   asc('3'), 156, 149, 20, 152, 150, 153, asc('4'),   // KB1
   asc('5'), 155, 176, 151, 177, 175, 165, asc('6'),   // KB2
   asc('7'), 166, 168, 178, 179, 169, 167, asc('8'),   // KB3
   asc('9'), 184, 170, 172, 171, 181, 164, asc('0'),   // KB4
   31, 163, 173, asc(','), asc('.'), asc(':'), 186, 30,   // KB5
   28, 225, asc(';'), asc('/'), 27, 212, 185, 29,   // KB6
   8, 13, 189, 162, 1, 2, 4, 24   // KB7
];

function pckey_to_lm80c_char(hardware_keys: number[]): number | undefined {
   // the firmware keeps a single control-key flag (CONTROLKEYS): SHIFT wins over CTRL,
   // which wins over ALT
   const map = hardware_keys.indexOf(KEY_SHIFT) >= 0 ? KBMAP_SFT
             : hardware_keys.indexOf(KEY_CTRL)  >= 0 ? KBMAP_CTRL
             : hardware_keys.indexOf(KEY_CBM)   >= 0 ? KBMAP_ALT
             : KBMAP;

   for(const k of hardware_keys) {
      // modifiers are not characters: the firmware strips their bits out of the row
      if(k === KEY_SHIFT || k === KEY_CTRL || k === KEY_CBM) continue;
      const rc = key_row_col[k];
      if(rc) return map[rc.row * 8 + rc.col];
   }

   return undefined;
}

export { pckey_to_lm80c_char };
