/** Z80 CPU register state */
export interface Z80Flags {
   S: number;
   Z: number;
   Y: number;
   H: number;
   X: number;
   P: number;
   N: number;
   C: number;
}

export interface Z80State {
   a: number;
   f: number;
   b: number;
   c: number;
   d: number;
   e: number;
   h: number;
   l: number;
   ix: number;
   iy: number;
   sp: number;
   pc: number;
   halted?: boolean;
   flags: Z80Flags;
}

/** CPU controller object created in emulator.ts */
export interface CpuController {
   init: () => void;
   reset: () => void;
   getState: () => Z80State;
   setState: (state: Z80State) => void;
}

/** Emulator runtime options parsed from query string */
export interface EmulatorOptions {
   load?: string;
   restore: boolean;
   rom?: string;
   bt?: string;
   bb?: string;
   bh?: string;
   aspect?: string;
   [key: string]: string | boolean | undefined;
}

/** Keyboard event in the input buffer */
export interface KeyboardBufferEntry {
   type: "press" | "release";
   hardware_keys: number[];
}

/** Emscripten module instance with typed heap views */
export interface EmscriptenInstance {
   cwrap: (name: string, returnType?: string | null, argTypes?: string[]) => (...args: any[]) => any;
   HEAPF32: Float32Array;
   HEAPU8: Uint8Array;
   HEAPU32: Uint32Array;
}

/** CF card disk geometry */
export interface CfGeometry {
   heads: number;
   cylinders: number;
   sectorsPerCylinder: number;
}

/** Row/column mapping for a hardware key */
export interface KeyRowCol {
   row: number;
   col: number;
}
