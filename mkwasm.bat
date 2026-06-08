@echo off

if "%EMSDK%"=="" (
   call ..\..\emsdk\emsdk_env.bat
)

call emcc wasm\prova.c -O3 ^
   -s EXPORTED_RUNTIME_METHODS="['ccall', 'cwrap', 'HEAP8', 'HEAPU8', 'HEAP16', 'HEAPU16', 'HEAP32', 'HEAPU32', 'HEAPF32', 'HEAPF64']" ^
   -s ENVIRONMENT=web ^
   -s MODULARIZE=1 ^
   -s EXPORT_NAME="emscripten_module" ^
   -o emscripten_module.js
    
echo emcc finished, putting wasm binary into UInt8Array

node wasm\make_array > emscripten_module.wasm.array.js

echo done


