// gzip support for image files: the CF card is shipped as software/cfcard.img.gz and
// inflated in the browser, so the 250 MB raw image never has to be downloaded or committed.

/** gzip magic number, first two bytes of every gzip member */
function isGzip(bytes: Uint8Array): boolean {
   return bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b;
}

/** true when the browser can inflate gzip natively (Chrome 80+, Firefox 113+, Safari 16.4+) */
function canDecompress(): boolean {
   return typeof DecompressionStream !== "undefined";
}

/** inflates a gzip stream using the browser implementation, which runs off the main thread */
async function gunzipStream(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
   // lib.dom types DecompressionStream's writable as WritableStream<BufferSource>, which is
   // wider than what pipeThrough expects; the cast only narrows it back to Uint8Array
   const inflater = new DecompressionStream("gzip") as unknown as ReadableWritablePair<Uint8Array, Uint8Array>;
   const inflated = stream.pipeThrough(inflater);
   return new Uint8Array(await new Response(inflated).arrayBuffer());
}

/** returns the image untouched, or inflated when it is gzip-compressed */
async function decompressIfGzip(bytes: Uint8Array, name: string): Promise<Uint8Array> {
   if(!isGzip(bytes)) return bytes;

   if(!canDecompress()) {
      throw new Error(`cannot decompress "${name}": DecompressionStream is not available in this browser`);
   }

   const inflated = await gunzipStream(new Blob([bytes as BlobPart]).stream());
   console.log(`CF: decompressed "${name}" ${bytes.length} -> ${inflated.length} bytes`);
   return inflated;
}

export { decompressIfGzip, isGzip };
