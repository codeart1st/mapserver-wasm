RM=rm -f
CFLAGS=-I./dist/include -I./dist/include/libxml2
LDFLAGS=-O2 -fwasm-exceptions -s USE_ZLIB=1 -s USE_FREETYPE=1 -s USE_LIBPNG=1 -s USE_LIBJPEG=1 -s ENVIRONMENT='worker' -s MODULARIZE=1 -s ALLOW_MEMORY_GROWTH=1 -s 'EXPORTED_RUNTIME_METHODS=["cwrap", "FS"]' -s ERROR_ON_UNDEFINED_SYMBOLS=0
LDLIBS=-lmapserver -lxml2 -lproj -lgdal -lsqlite3 -lgeos -lgeos_c -L./dist/lib

SRCS=src/bindings.c
OBJS=$(subst .c,.o,$(SRCS))

all: dist/mapserver.js dist/mapserver-node.js

dist/mapserver.js: $(OBJS)
	$(CC) $(LDFLAGS) -lworkerfs.js -o dist/mapserver.js $(OBJS) $(LDLIBS)
	tar -czvf dist/mapserver.wasm.gz dist/mapserver.wasm
	brotli --best --force dist/mapserver.wasm

dist/mapserver-node.js: $(OBJS)
	$(CC) $(LDFLAGS) -lnodefs.js -o dist/mapserver-node.js $(OBJS) $(LDLIBS)
	$(RM) dist/mapserver-node.wasm

clean:
	$(RM) $(OBJS)
