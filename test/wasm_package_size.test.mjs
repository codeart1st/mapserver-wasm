import fs from 'fs'

const THRESHOLD = 10240

test('mapserver.wasm file should not be larger than ~3.3MB with brotli compression', () => {
  const stats = fs.statSync('./dist/mapserver.wasm.br')

  expect(stats.size).toBeLessThanOrEqual(3272680 + THRESHOLD) // we should avoid getting bigger than that
  expect(stats.size).toBeGreaterThan(2000000) // if we got to small, maybe something is wrong?
})