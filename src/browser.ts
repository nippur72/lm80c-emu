// handles interaction between browser and emulation 

import { saveState, restoreState } from './utils.js';
import { getFileExtension } from './bytes.js';
import { run } from './files.js';
import { calculateGeometry } from './video.js';
import { externalLoad } from './mdawson.js';
import { stopped, audio, oneFrame, options, setStopped, storage } from './emulator.js';

let aspect = 1.25;
let border_top = 0;
let border_bottom = 0;
let border_h = 0;

function onResize(e?: any) {
   const canvas = document.getElementById("canvas") as HTMLCanvasElement;   

   if(window.innerWidth > (window.innerHeight*aspect))
   {
      canvas.style.width  = `${aspect*100}vmin`;
      canvas.style.height = "100vmin";
   }
   else if(window.innerWidth > window.innerHeight)
   {
      canvas.style.width  = "100vmax";
      canvas.style.height = `${(1/aspect)*100}vmax`;
   }
   else
   {
      canvas.style.width  = "100vmin";
      canvas.style.height = `${(1/aspect)*100}vmin`;
   }
}

function goFullScreen() 
{
   const canvas = document.getElementById("canvas") as any;
   if(canvas) {
      if(canvas.webkitRequestFullscreen !== undefined) canvas.webkitRequestFullscreen();
      else if(canvas.mozRequestFullScreen !== undefined) canvas.mozRequestFullScreen();      
   }
   onResize();
}

window.addEventListener("resize", onResize);
window.addEventListener("dblclick", goFullScreen);

onResize();

// **** save state on close ****

window.onbeforeunload = function(e) {
   saveState();   
 };

// **** visibility change ****

window.addEventListener("visibilitychange", function() {
   if(document.visibilityState === "hidden")
   {
      setStopped(true);
      audio.stop();
   }
   else if(document.visibilityState === "visible")
   {
      setStopped(false);
      oneFrame();
      audio.start();
   }
});

// **** drag & drop ****

const dropZone = document.getElementById('screen');
if (dropZone) {
   // Optional.   Show the copy icon when dragging over.  Seems to only work for chrome.
   dropZone.addEventListener('dragover', function(e) {
      e.stopPropagation();
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
   });

   // Get file data on drop
   dropZone.addEventListener('drop', e => {
      audio.resume();

      e.stopPropagation();
      e.preventDefault();
      const files = e.dataTransfer.files; // Array of all files

      for(let i=0, file; file=files[i]; i++) {                   
         const reader = new FileReader();      
         reader.onload = e2 => {
            if (e2.target && e2.target.result) {
               droppedFile(file.name, new Uint8Array(e2.target.result as ArrayBuffer));
            }
         };
         reader.readAsArrayBuffer(file); 
      }
   });
}

async function droppedFile(outName: string, bytes: Uint8Array) {
   const ext = getFileExtension(outName);

   if(ext == ".prg") {
      await storage.writeFile(outName, bytes);
      await run(outName);
   }
}

// Attach droppedFile to window for console/drop integration
(window as any).droppedFile = droppedFile;

function getQueryStringObject(opts: any) {
   let a = window.location.search.split("&");
   let o = a.reduce((o, v) =>{
      var kv = v.split("=");
      const key = kv[0].replace("?", "");
      let value: any = kv[1];
           if(value === "true") value = true;
      else if(value === "false") value = false;
      o[key] = value;
      return o;
   }, opts);
   return o;
}

async function parseQueryStringCommands() {
   Object.assign(options, getQueryStringObject(options));

   if(options.restore !== false) {
      // try to restore previous state, if any
      restoreState();
   }

   if(options.load !== undefined) {
      const name = options.load;
      setTimeout(async ()=>{
         if(name.startsWith("http")) {
            // external load
            let bin = await externalLoad(name);
            await storage.writeFile("autoload.prg", bin);
            await run("autoload.prg");
         }
         else {
            // internal load
            await fetchProgram(name);
         }
      }, 4000);
   }

   if(options.bt !== undefined || 
      options.bb !== undefined || 
      options.bh !== undefined || 
      options.aspect !== undefined
   ) {
      if(options.bt     !== undefined) border_top    = Number(options.bt); 
      if(options.bb     !== undefined) border_bottom = Number(options.bb);
      if(options.bh     !== undefined) border_h      = Number(options.bh);
      if(options.aspect !== undefined) aspect        = Number(options.aspect);
      calculateGeometry();
      onResize();
   }
}

async function fetchProgram(name: string)
{
   //console.log(`wanting to load ${name}`);
   try
   {
      const response = await fetch(`software/${name}`);
      if(response.status === 404) return false;
      const bytes = new Uint8Array(await response.arrayBuffer());
      droppedFile(name, bytes);
      return true;
   }
   catch(err)
   {
      return false;
   }
}

export { parseQueryStringCommands };