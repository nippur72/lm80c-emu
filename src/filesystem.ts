import { saveAs } from 'file-saver';
import { Store, get, set, del, keys } from 'idb-keyval';

class BrowserStorage
{
   STORAGE_KEY: string;
   store: Store;

   constructor(key) {
      this.STORAGE_KEY = key;
      this.store = new Store(this.STORAGE_KEY, this.STORAGE_KEY);

      (window as any).dir      = ()   => this.dir();
      (window as any).remove   = (fn) => this.remove(fn);
      (window as any).download = (fn) => this.download(fn);
      (window as any).upload   = (fn) => this.upload(fn);
   }

   // ===================== private methods ============================================

   async readFile(fileName) {
      const bytes = await get(fileName, this.store);
      return bytes;
   }

   async writeFile(fileName, bytes) {
      await set(fileName, bytes, this.store);
   }

   async removeFile(fileName) {
      await del(fileName, this.store);
   }


   async fileExists(fileName) {
      return await get(fileName, this.store) !== undefined;
   }

   // ===================== command line commands ======================================

   async dir() {
      const fileNames = await keys(this.store);
      fileNames.forEach(async fn=>{
         const file = await this.readFile(fn);
         const length = file.length;
         console.log(`${fn} (${length} bytes)`);
      });
   }

   async remove(filename) {
      if(await this.fileExists(filename)) {
         await this.removeFile(filename);
         console.log(`removed "${filename}"`);
      }
      else {
         console.log(`file "${filename}" not found`);
      }
   }

   async download(fileName) {
      if(!await this.fileExists(fileName)) {
         console.log(`file "${fileName}" not found`);
         return;
      }
      const bytes = await this.readFile(fileName);
      let blob = new Blob([bytes], {type: "application/octet-stream"});
      saveAs(blob, fileName);
      console.log(`downloaded "${fileName}"`);
   }

   async upload(fileName) {
      throw "not impemented";
   }
}

export { BrowserStorage };
