// Ambient global declarations for name resolution

declare var ram: Uint8Array;
declare var rom: Uint8Array;
declare var KEY_F4: number;
declare var KEY_DEL_LINE: number;
declare var topaz: Uint8Array;
declare var charset_laser500: Uint8Array;
interface VirtualModemInstance {
   onreceive: (() => void) | undefined;
   read_status: () => number;
   read_byte: () => number;
   write_byte: (byte: number) => void;
   connect: () => void;
}
declare var VirtualModem: {
   new (): VirtualModemInstance;
};
declare var cpu_started_msec: number;
declare var define: any;

declare var averageLoad: number;
declare var border_top: number;
declare var border_bottom: number;
declare var border_h: number;

// ROM arrays loaded dynamically or via script tags
declare var rom_310: Uint8Array;
declare var rom_311: Uint8Array;
declare var rom_312: Uint8Array;
declare var rom_313: Uint8Array;
declare var rom_3131: Uint8Array;
declare var rom_3132: Uint8Array;
declare var rom_3133: Uint8Array;
declare var rom_3134: Uint8Array;
declare var rom_3135: Uint8Array;
declare var rom_3136: Uint8Array;
declare var rom_3137: Uint8Array;
declare var rom_3138: Uint8Array;
declare var rom_314: Uint8Array;
declare var rom_315: Uint8Array;
declare var rom_316: Uint8Array;
declare var rom_317: Uint8Array;
declare var rom_318: Uint8Array;
declare var rom_319: Uint8Array;
declare var rom_321: Uint8Array;
declare var rom_322: Uint8Array;
declare var rom_323: Uint8Array;
declare var rom_324: Uint8Array;
declare var rom_64K_102: Uint8Array;
declare var rom_64K_103: Uint8Array;
declare var rom_64K_104: Uint8Array;
declare var rom_64K_105: Uint8Array;
declare var rom_64K_111: Uint8Array;
declare var rom_64K_112: Uint8Array;
declare var rom_64K_113: Uint8Array;
declare var rom_64K_114: Uint8Array;
declare var rom_64K_115: Uint8Array;
declare var rom_64K_116: Uint8Array;
declare var rom_64K_117: Uint8Array;
declare var rom_64K_118: Uint8Array;
declare var rom_64K_119: Uint8Array;
declare var rom_64K_120: Uint8Array;

declare module '*/emscripten_module.js' {
   const value: any;
   export default value;
}

