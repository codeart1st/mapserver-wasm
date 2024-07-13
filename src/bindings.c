#define PROJ_VERSION_MAJOR 9 // enable PROJ 6+ mode in MapServer

#include <mapserver.h>
#include <mapows.h>
#include <emscripten.h>

// defined in mapdebug.c
debugInfoObj *msGetDebugInfoObj();

typedef struct {
  int size;
  unsigned char *data;
} resByteBuffer;

char *globalConfig = NULL;
char *globalResponse = NULL;
resByteBuffer globalResByteBuffer;

int main() {
  return msSetup();
}

static char *msGetEnvURL(const char *key, void *thread_context) {
  if (strcmp(key, "REQUEST_METHOD") == 0) {
    return (char*) "GET";
  }

  if (strcmp(key, "QUERY_STRING") == 0) {
    return (char*) thread_context;
  }

  return NULL;
}

static char *msPostEnvURL(const char *key, void *thread_context) {
  if (strcmp(key, "REQUEST_METHOD") == 0) {
    return (char*) "POST";
  }
  return NULL;
}

static const char *msIO_getStdoutBufferString() {
  msIOContext *ctx = msIO_getHandler((FILE*) "stdout");
  msIOBuffer *buf;

  if (ctx == NULL || ctx->write_channel == MS_FALSE || strcmp(ctx->label, "buffer") != 0) {
    msSetError(MS_MISCERR, "Can't identify msIO buffer.", "msIO_getStdoutBufferString");
    return "";
  }

  buf = (msIOBuffer*) ctx->cbData;

  if (buf->data_len == 0 || buf->data[buf->data_offset] != '\0') {
    msIO_bufferWrite(buf, (void*) "", 1);
    buf->data_offset--;
  }

  return (const char*) (buf->data);
}

static resByteBuffer msIO_getStdoutBufferBytes() {
  msIOContext *ctx = msIO_getHandler((FILE *) "stdout");
  msIOBuffer  *buf;
  resByteBuffer resByteBuf;

  if (ctx == NULL || ctx->write_channel == MS_FALSE || strcmp(ctx->label, "buffer") != 0) {
    msSetError(MS_MISCERR, "Can't identify msIO buffer.", "msIO_getStdoutBufferString");
    resByteBuf.size = 0;
    resByteBuf.data = NULL;
    return resByteBuf;
  }

  buf = (msIOBuffer *) ctx->cbData;

  resByteBuf.size = buf->data_offset;
  resByteBuf.data = buf->data;

  buf->data_offset = 0;
  buf->data_len = 0;
  buf->data = NULL;

  return resByteBuf;
}

static void cleanUp(mapObj *map, cgiRequestObj *request) {
  msIO_resetHandlers();
  msResetErrorList();

  msFreeCgiObj(request);
  msFreeMap(map);
}

EMSCRIPTEN_KEEPALIVE void flushDebugFile(void) {
  debugInfoObj *debuginfo = msGetDebugInfoObj();
  if (debuginfo != NULL && debuginfo->fp != NULL) {
    fflush(debuginfo->fp);
  }
}

EMSCRIPTEN_KEEPALIVE void loadMapConfig(char *config) {
  msFree(globalConfig);
  globalConfig = msStrdup(config);
}

EMSCRIPTEN_KEEPALIVE const char *dispatchRequest(char *requestMethod, char *data) {
  mapObj *map = msLoadMapFromString(globalConfig, NULL, NULL);
  cgiRequestObj *request = msAllocCgiObj();

  if (strcmp(requestMethod, "GET") == 0) {
    request->NumParams = loadParams(request, msGetEnvURL, NULL, 0, data);
  } else if (strcmp(requestMethod, "POST") == 0) {
    request->NumParams = loadParams(request, msPostEnvURL, data, sizeof(data), NULL);
  } else {
    cleanUp(map, request);
    return "";
  }

  msIO_installStdoutToBuffer();

  msOWSDispatch(map, request, -1);

  const char *content = msIO_getStdoutBufferString();
  msFree(globalResponse);
  globalResponse = msStrdup(content);

  cleanUp(map, request);

  return globalResponse;
}

EMSCRIPTEN_KEEPALIVE const resByteBuffer *dispatchRequestBytes(char *requestMethod, char *data) {
  mapObj *map = msLoadMapFromString(globalConfig, NULL, NULL);
  cgiRequestObj *request = msAllocCgiObj();

  if (globalResByteBuffer.data != NULL) {
    msFree(globalResByteBuffer.data);
    globalResByteBuffer.size = 0;
    globalResByteBuffer.data = NULL;
  }

  if (strcmp(requestMethod, "GET") == 0) {
    request->NumParams = loadParams(request, msGetEnvURL, NULL, 0, data);
  } else if (strcmp(requestMethod, "POST") == 0) {
    request->NumParams = loadParams(request, msPostEnvURL, data, sizeof(data), NULL);
  } else {
    cleanUp(map, request);
    return &globalResByteBuffer;
  }

  msIO_installStdoutToBuffer();

  msOWSDispatch(map, request, -1);

  globalResByteBuffer = msIO_getStdoutBufferBytes();

  cleanUp(map, request);

  return &globalResByteBuffer;
}