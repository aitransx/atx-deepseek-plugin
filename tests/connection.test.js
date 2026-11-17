import test from 'node:test'
import assert from 'node:assert/strict'
import { discoverConnections, resolveConnection } from '../connection.js'
const config={baseUrl:'https://api.aitransx.com/v1',apiKeyEnv:'FALLBACK'}
function ctx(providers){return {get:()=>({entries:()=>[{options:{name:'@deepseek-ai/dsh-llm-pi-ai',config:{providers}}}]})}}
test('reuse unique official ATX provider metadata without returning secrets',()=>{
 const c=ctx({atx:{baseURL:'https://api.aitransx.com/v1',apiKeyEnv:'EXISTING',headers:{Authorization:'secret'}}})
 assert.equal(resolveConnection(c,config).apiKeyEnv,'EXISTING')
 assert.ok(!JSON.stringify(discoverConnections(c)).includes('secret'))
})
test('ambiguous and third-party providers require explicit selection',()=>{
 const c=ctx({a:{baseURL:'https://api.aitransx.com/v1'},b:{baseURL:'https://api.aitransx.com/v1'},custom:{baseURL:'https://example.com/v1',apiKeyEnv:'CUSTOM'}})
 assert.equal(resolveConnection(c,config).source,'plugin-config')
 assert.equal(resolveConnection(c,{...config,providerId:'custom'}).apiKeyEnv,'CUSTOM')
 assert.equal(resolveConnection(c,{...config,providerId:'absent'}).source,'unavailable')
})
