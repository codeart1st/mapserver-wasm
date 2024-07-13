/// <reference types="emscripten"/>

declare namespace FS {
  interface Filesystems {
    MEMFS: Emscripten.FileSystemType;
    WORKERFS: Emscripten.FileSystemType;
  }

  let filesystems: Filesystems;
}

interface EmscriptenModule {
  cwrap: typeof cwrap;
  FS: typeof FS;
}

declare module 'mapserver-wasm' {
  let createMapServerModule: EmscriptenModuleFactory<EmscriptenModule>;

  export = createMapServerModule;
}