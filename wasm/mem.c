uint8_t mem[65536];

EMSCRIPTEN_KEEPALIVE
uint8_t mem_read(uint16_t address) {
    return mem[address];
}

EMSCRIPTEN_KEEPALIVE
void mem_write(uint16_t address, uint8_t value) {
    if(address < 32768) return;
    mem[address] = value;
}

EMSCRIPTEN_KEEPALIVE
void rom_load(uint16_t address, uint8_t value) {
    mem[address] = value;
}
