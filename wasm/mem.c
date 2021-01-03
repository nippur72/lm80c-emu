uint8_t ram[65536];
uint8_t rom[65536];

extern byte PIO_data_B;

#define ROM_ENABLED (PIO_data_B & 1)

EMSCRIPTEN_KEEPALIVE
uint8_t mem_read(uint16_t address) {
    if(address < 32768) {
        return ROM_ENABLED ? rom[address] : ram[address];
    }
    else {
        return ram[address];
    }
}

EMSCRIPTEN_KEEPALIVE
void mem_write(uint16_t address, uint8_t value) {
    if((address < 32768) & ROM_ENABLED) return;
    ram[address] = value;
}

EMSCRIPTEN_KEEPALIVE
void rom_load(uint16_t address, uint8_t value) {
    rom[address] = value;
}
