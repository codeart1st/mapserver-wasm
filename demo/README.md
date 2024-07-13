# How to use
**mapserver-wasm** needs to be build before you can run the demo. Alternatively you can swap out the `file:../` string inside the `package.json` by a valid published version of mapserver-wasm.

The demo **does not** come with necessary **GeoPackage** data files. Please serve your own test files under the `public` folder and reference them in `config.js`.

Now you can start the demo on Port `8080` with the following command:
```sh
npm ci && npm start
```