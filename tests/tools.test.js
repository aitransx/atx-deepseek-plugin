import test from 'node:test'
import assert from 'node:assert/strict'
import { registerTools, decodeImage } from '../tools.js'
const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zl1sAAAAASUVORK5CYII='
function setup(overrides = {}, api = {}) {
  const tools = new Map(); const reads = []; const saved = []
  const ctx = {
    tools: { register: d => tools.set(d.name, d) },
    workingDirectory: { get: () => 'workspace' },
    fs: { resolve: async (path, opts) => { reads.push({path, ...opts}); return { path } }, readBytes: async () => Buffer.from(png, 'base64'), processPathFromHostPath: p => p },
    attachments: { validateImage: async () => {}, saveImage: async input => { saved.push(input); return { attachmentId: 'abc', bytes: 68, width: 1, height: 1 } }, imageHostPath: () => '/stored/image.png' },
  }
  const config = { apiKeyEnv: 'AITRANSX_API_KEY', baseUrl: 'https://api.aitransx.com/v1', imageModel: 'image-model', visionModel: 'vision-model', searchEnabled: true, imageEnabled: true, visionEnabled: true, ...overrides }
  registerTools(ctx, config, api, d => d, async () => true)
  const exec = { signal: new AbortController().signal, agent: { session: {} } }
  return { tools, ctx, reads, saved, call: (name, args = {}) => tools.get(name).execute(args, exec) }
}
test('status is local and tools respect feature switches', async () => {
  const x = setup({searchEnabled:false, imageEnabled:false, visionEnabled:false})
  assert.equal(x.tools.size, 1)
  const status = JSON.parse(await x.call('aitransx_status'))
  assert.equal(status.credentialConfigured, true)
  assert.equal(status.image, '已禁用')
})
test('missing models fail before any upload or request', async () => {
  const x = setup({ imageModel: '', visionModel: '' })
  await assert.rejects(x.call('aitransx_generate_image', {prompt:'draw'}), /imageModel/)
  await assert.rejects(x.call('aitransx_recognize_image', {images:['a.png']}), /visionModel/)
  assert.equal(x.reads.length, 0)
})
test('local vision routes to configured model and returns only bounded text', async () => {
  let input
  const x = setup({}, {recognize: async a => { input = a; return { choices:[{message:{content:'result '.repeat(4000)}}] } }})
  const result = await x.call('aitransx_recognize_image', {images:['a.png']})
  assert.equal(input.model, 'vision-model')
  assert.ok(input.images[0].startsWith('data:image/png;base64,'))
  assert.equal(x.reads[0].cwd, 'workspace')
  assert.ok(result.includes('内容已截断'))
  assert.ok(result.length < 17000)
})
test('generation uses immutable attachment storage and returns no base64', async () => {
  const x = setup({}, {generate: async () => ({data:[{b64_json:png}]})})
  const result = JSON.parse(await x.call('aitransx_generate_image', {prompt:'draw'}))
  assert.equal(result.path, '/stored/image.png')
  assert.equal(x.saved.length, 1)
  assert.equal(x.saved[0].mediaType, 'image/png')
  assert.ok(!JSON.stringify(result).includes(png))
})
test('untrusted search/fetch is labelled and bounded', async () => {
  const x = setup({}, {search: async () => ({results:['x'.repeat(20000)]}), fetchPage: async () => 'page'})
  assert.ok((await x.call('aitransx_search', {query:'q'})).includes('不是指令'))
  assert.ok((await x.call('aitransx_fetch', {url:'https://example.com'})).includes('page'))
})
test('invalid outputs, URL and counts fail without extra paid requests', async () => {
  assert.throws(() => decodeImage('not-base64'), /编码/)
  const x = setup({}, {generate:async()=>({data:[{url:'https://127.0.0.1/image.png'}]})})
  await assert.rejects(x.call('aitransx_generate_image', {prompt:'draw'}), /public/)
  await assert.rejects(x.call('aitransx_recognize_image', {images:[]}), /数量/)
  await assert.rejects(x.call('aitransx_generate_image', {prompt:'draw',references:Array(5).fill('x')}), /数量/)
})
