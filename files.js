// console command
async function run(filename) {
    if(!await storage.fileExists(filename)) {
       console.log(`file "${filename}" not found`);
       return;
    }
    const ext = getFileExtension(filename);
    if(ext === ".prg" ) await load_prg(filename, true);
    else console.log(`extension '${ext}' not supported`);
}

// console command
async function load(filename) {
    if(!await storage.fileExists(filename)) {
       console.log(`file "${filename}" not found`);
       return;
    }
    const ext = getFileExtension(filename);
    if(ext === ".prg" ) await load_prg(filename, false);
    else console.log(`extension '${ext}' not supported`);
}

// console command
async function save(filename) {
    const ext = getFileExtension(filename);
    if(ext == ".prg" ) await save_prg(filename, undefined, undefined);
    else console.log(`extension '${ext}' not supported`);
}

function loadBytes(bytes, address, fileName) {
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

async function load_prg(filename, runAfterLoad) {
    const bytes = await storage.readFile(filename);

    // simulate a VZ file
    let VZ_BASIC = 0xF0;
    let VZ_BINARY = 0xF1;
    let VZ = {
        type: VZ_BASIC,
        filename: filename,
        data: bytes,
        start: mem_read_word(BASTXT)
    };

    // write data into memory
    for(let i=0; i<VZ.data.length; i++) {
        mem_write(i+VZ.start, VZ.data[i]);
    }

    if(VZ.type == VZ_BASIC) {
        console.log(`loaded "${filename}" ('${VZ.filename}') as BASIC program of ${VZ.data.length} bytes from ${hex(VZ.start,4)}h to ${hex(VZ.start+VZ.data.length,4)}h`);
    }
    else if(VZ.type == VZ_BINARY) {
        console.log(`loaded "${filename}" ('${VZ.filename}') as binary data of ${VZ.data.length} bytes from ${hex(VZ.start,4)}h to ${hex(VZ.start+VZ.data.length,4)}h`);
    }

    // binary program
    if(VZ.type == VZ_BINARY) {
        if(runAfterLoad) {
            throw "not yet implemented";
        }
    }

    // basic program
    if(VZ.type == VZ_BASIC) {
        // modify end of basic program pointer
        let end = VZ.start + VZ.data.length;
        if(VZ.start === mem_read_word(BASTXT)) mem_write_word(PROGND, end+1);
        if(runAfterLoad) {
            paste("RUN\r\n");
        }
    }
}

async function save_prg(filename, start, end) {
    if(start === undefined) start = mem_read_word(BASTXT);
    if(end === undefined) end = mem_read_word(PROGND)-1;

    const prg = [];
    for(let i=0,t=start; t<=end; i++,t++) {
       prg.push(mem_read(t));
    }
    const bytes = new Uint8Array(prg);

    await storage.writeFile(filename, bytes);

    console.log(`saved "${filename}" ${bytes.length} bytes from ${hex(start,4)}h to ${hex(end,4)}h`);
}
