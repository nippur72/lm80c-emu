import { downloadBytes, mem_read_word, mem_write_word, hex } from './bytes';
import { BASTXT, PROGND } from './emulator';
import { mem_read, mem_write } from './emscripten_wrapper';
import { paste } from './paste';

function loadBytes(bytes: Uint8Array | number[], address?: number, fileName?: string): void {
    const startAddress = (address === undefined) ? mem_read_word(BASTXT) : address;
    const endAddress = startAddress + bytes.length - 1;

    for(let i=0,t=startAddress;t<=endAddress;i++,t++) {
       mem_write(t, bytes[i]);
     }

    // modify end of basic program pointer
    if(startAddress === mem_read_word(BASTXT)) mem_write_word(PROGND, endAddress+1);

    if(fileName === undefined) fileName = "autoload";
    console.log(`loaded "${fileName}" ${bytes.length} bytes from ${hex(startAddress,4)}h to ${hex(endAddress,4)}h`);
}

async function loadProgram(bytes: Uint8Array, name: string, runAfterLoad: boolean): Promise<void> {
    const start = mem_read_word(BASTXT);

    for(let i=0; i<bytes.length; i++) {
        mem_write(i+start, bytes[i]);
    }

    console.log(`loaded "${name}" as BASIC program of ${bytes.length} bytes from ${hex(start,4)}h to ${hex(start+bytes.length,4)}h`);

    // modify end of basic program pointer
    if(start === mem_read_word(BASTXT)) mem_write_word(PROGND, start + bytes.length + 1);

    if(runAfterLoad) {
        await paste("RUN\r\n");
    }
}

function programRange(start?: number, end?: number): [number, number] {
    const from = (start === undefined) ? mem_read_word(BASTXT) : start;
    const to = (end === undefined) ? mem_read_word(PROGND)-1 : end;
    return [from, to];
}

function readProgram(from: number, to: number): Uint8Array {
    const prg: number[] = [];
    for(let i=0,t=from; t<=to; i++,t++) {
       prg.push(mem_read(t));
    }
    return new Uint8Array(prg);
}

// menu command: write the program straight to the local file system
async function download_prg(filename: string): Promise<void> {
    const [from, to] = programRange();
    const bytes = readProgram(from, to);

    downloadBytes(filename, bytes);
}

export { loadProgram, loadBytes, download_prg };
