uint8_t ram[65536];
uint8_t rom[65536];

extern byte PIO_data_B;
extern byte LM80C_64K;

#define ROM_ENABLED (PIO_data_B & 1)

EMSCRIPTEN_KEEPALIVE
uint8_t mem_read(uint16_t address) {
    if(LM80C_64K) {
        if(address < 32768) {
            return ROM_ENABLED ? rom[address] : ram[address];
        }
        else {
            return ram[address];
        }
    }
    else {
        if(address < 32768) {
            return rom[address];
        }
        else {
            return ram[address];
        }
    }

}

EMSCRIPTEN_KEEPALIVE
void mem_write(uint16_t address, uint8_t value) {
    if(LM80C_64K) {
        if((address < 32768) & ROM_ENABLED) return;
        ram[address] = value;
    }
    else {
        if(address < 32768) return;
        ram[address] = value;
    }
}

EMSCRIPTEN_KEEPALIVE
void rom_load(uint16_t address, uint8_t value) {
    rom[address] = value;
}
