import { saveAs } from 'file-saver';
import { Store, get, set, del, keys } from 'idb-keyval';

class BrowserStorage
{
   STORAGE_KEY: string;
   store: Store;

   constructor(key: string) {
      this.STORAGE_KEY = key;
      this.store = new Store(this.STORAGE_KEY, this.STORAGE_KEY);

      (window as any).dir      = ()   => this.dir();
      (window as any).remove   = (fn: string) => this.remove(fn);
      (window as any).download = (fn: string) => this.download(fn);
      (window as any).upload   = (fn: string) => this.upload(fn);
   }

   // ===================== private methods ============================================

   async readFile(fileName: string): Promise<Uint8Array> {
      const bytes = await get<Uint8Array>(fileName, this.store);
      return bytes || new Uint8Array(0);
   }

   async writeFile(fileName: string, bytes: Uint8Array): Promise<void> {
      await set(fileName, bytes, this.store);
   }

   async removeFile(fileName: string): Promise<void> {
      await del(fileName, this.store);
   }


   async fileExists(fileName: string): Promise<boolean> {
      return await get(fileName, this.store) !== undefined;
   }

   // ===================== command line commands ======================================

   async dir(): Promise<void> {
      const fileNames = await keys(this.store);
      fileNames.forEach(async fn => {
         const file = await this.readFile(fn as string);
         const length = file.length;
         console.log(`${fn} (${length} bytes)`);
      });
   }

   async remove(filename: string): Promise<void> {
      if(await this.fileExists(filename)) {
         await this.removeFile(filename);
         console.log(`removed "${filename}"`);
      }
      else {
         console.log(`file "${filename}" not found`);
      }
   }

   async download(fileName: string): Promise<void> {
      if(!await this.fileExists(fileName)) {
         console.log(`file "${fileName}" not found`);
         return;
      }
      const bytes = await this.readFile(fileName);
      let blob = new Blob([bytes], {type: "application/octet-stream"});
      saveAs(blob, fileName);
      console.log(`downloaded "${fileName}"`);
   }

   async upload(fileName: string): Promise<void> {
      throw "not impemented";
   }
}

export { BrowserStorage };
