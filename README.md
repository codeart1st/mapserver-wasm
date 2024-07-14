# ThirdParty Dependencies

|Name|Version|Home page|License|Status|
|----|-------|---------|-------|-------|
|**MapServer**|8.0.1|https://mapserver.org/|MIT|🚧|
|**GDAL/OGR**|3.8.5|https://gdal.org/|MIT/X style|🚧|
|**PROJ**|9.4.0|https://proj.org/|MIT/X style|🚧|
|**GEOS**|3.12.1|https://libgeos.org/|LGPL-2.1|🚧|
|**SQLite**|3.45.3|https://www.sqlite.org/|Public Domain|🚧|
|**Libxml2**|2.12.6|http://xmlsoft.org/|MIT|🚧|

✅ up-to-date | 🚧 needs-update | Last update check 14.07.2024

# Checkout

```sh
git clone --recurse-submodules git@github.com:codeart1st/mapserver-wasm.git
```

```sh
git clone git@github.com:codeart1st/mapserver-wasm.git
git submodule update --init --recursive
```

# Update

```sh
git pull --recurse-submodules
```

# Required Web APIs

[WebAssembly 1.0](https://webassembly.org/) | [WebAssembly Exception Handling](https://github.com/WebAssembly/exception-handling/blob/master/proposals/exception-handling/Exceptions.md)

# Compilation

Start the build container with the following command to ensure the filesystem permissions for newly created files are correct.
```sh
docker run -it --rm -v $(pwd):/src -v /etc/passwd:/etc/passwd --user "$(id -u):$(id -g)" --name mapserver-wasm emscripten/emsdk:3.1.63 bash
```
And execute in a second terminal the following command to install the missing build depedencies as root user.
```sh
docker exec --user root mapserver-wasm bash -c "apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y tcl automake pkgconf libtool brotli"
```
After that execute all job script commands described in `.github/workflows/ci.yml` inside the interactive build container. It can be helpful to set the `GITHUB_WORKSPACE` environment variable beforehand.
```sh
GITHUB_WORKSPACE=/src
```

# Test

Tests will be executed with [Jest](https://jestjs.io/) framework. Test execution needs compilation of mapserver-wasm first.
```sh
npm ci && npm test
```

# Logging

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

# Debugging

Debugging in [DWARF](https://dwarfstd.org/) format has initial support in [Chrome](https://developer.chrome.com/blog/wasm-debugging-2020/).
