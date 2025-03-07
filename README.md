# mapserver-wasm

<div align="center">
  <strong>MapServer WFS and WMS inside Web Worker</strong>
</div>
<div align="center">
  Build environment to compile MapServer with Emscripten to a WebAssembly package
</div>
<br>
<div align="center">
  <a href="https://github.com/codeart1st/mapserver-wasm/actions/workflows/ci.yml">
    <img src="https://github.com/codeart1st/mapserver-wasm/actions/workflows/ci.yml/badge.svg" alt="Build status"/>
  </a>
  <a href="https://github.com/codeart1st/mapserver-wasm/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/codeart1st/mapserver-wasm" alt="MIT license"/>
  </a>
</div>

## Features

- Use MapServer inside your browser
- Expose WFS 2.0.0 and WMS 1.3.0 services
- Read vector and raster data from GeoPackage

# ThirdParty Dependencies

|Name|Version|Home page|License|Status|
|----|-------|---------|-------|-------|
|**MapServer**|8.4.0|https://mapserver.org/|MIT|✅|
|**GDAL/OGR**|3.10.2|https://gdal.org/|MIT/X style|✅|
|**PROJ**|9.5.1|https://proj.org/|MIT/X style|✅|
|**GEOS**|3.13.1|https://libgeos.org/|LGPL-2.1|✅|
|**SQLite**|3.49.1|https://www.sqlite.org/|Public Domain|✅|
|**Libxml2**|2.13.5|http://xmlsoft.org/|MIT|✅|

✅ up-to-date | 🚧 needs-update | Last update check 02.03.2025

# Getting started

## Installation

To download `mapserver-wasm` run:


```sh
npm install mapserver-wasm
# or
yarn add mapserver-wasm
```

## Usage

```js
import MapServer from 'mapserver-wasm'

MapServer().then(async Module => {
  const WORKERFS = Module.FS.filesystems['WORKERFS']
  const MEMFS = Module.FS.filesystems['MEMFS']

  Module.FS.mkdir('/ms')
  Module.FS.mkdir('/proj')

  try {
    WORKERFS.node_ops.mknod = MEMFS.node_ops.mknod // GDAL needs temporary file support
    Module.FS.mount(WORKERFS, {
      blobs: [
        { name: 'test.gpkg', data: /* gpkg blob */ }
      ]
    }, '/ms')
    Module.FS.writeFile('/proj/epsg', crsDefinitions.map(({ crs, definition }) => {
      return `<${crs.replace('EPSG:', '')}>${definition}<>`
    }).join('\n'), { flags: 'w+' })
    // ...
    resolve()
  } catch (e) {
    reject(e)
  }
})
```

Please look into the [demo project](https://github.com/codeart1st/mapserver-wasm/tree/main/demo) or into the [test folder](https://github.com/codeart1st/mapserver-wasm/tree/main/test) for further information.

# Development

## Required Web APIs

[WebAssembly 1.0](https://webassembly.org/) | [WebAssembly Exception Handling](https://github.com/WebAssembly/exception-handling/blob/master/proposals/exception-handling/Exceptions.md)

## Checkout

```sh
git clone --recurse-submodules git@github.com:codeart1st/mapserver-wasm.git
```

```sh
git clone git@github.com:codeart1st/mapserver-wasm.git
git submodule update --init --recursive
```

## Update

```sh
git pull --recurse-submodules
```

## Compilation

Start the build container with the following command to ensure the filesystem permissions for newly created files are correct.
```sh
docker run -it --rm -v $(pwd):/src -v /etc/passwd:/etc/passwd --user "$(id -u):$(id -g)" --name mapserver-wasm emscripten/emsdk:3.1.68 bash
```
And execute in a second terminal the following command to install the missing build depedencies as root user.
```sh
docker exec --user root mapserver-wasm bash -c "apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y brotli"
```
After that execute all job script commands described in `.github/workflows/ci.yml` inside the interactive build container. It can be helpful to set the `GITHUB_WORKSPACE` environment variable beforehand.
```sh
GITHUB_WORKSPACE=/src
```

## Test

Tests will be executed with [Vitest](https://vitest.dev/) framework. Test execution needs compilation of mapserver-wasm first.
```sh
npm ci && npm test
```

## Logging

To avoid debugging in first place it can be helpful to activate file logging for [MapServer](https://mapserver.org/optimization/debugging.html) and [GDAL](https://trac.osgeo.org/gdal/wiki/ConfigOptions).
```
MAP
  DEBUG 5
  CONFIG "MS_ERRORFILE" "error.log"
  CONFIG "CPL_LOG" "error.log"
  CONFIG "CPL_DEBUG" "ON"
  CONFIG "CPL_LOG_ERRORS" "ON"
  CONFIG "CPL_TIMESTAMP" "ON"
END
```

## Debugging

Debugging in [DWARF](https://dwarfstd.org/) format has initial support in [Chrome](https://developer.chrome.com/blog/wasm-debugging-2020/).
