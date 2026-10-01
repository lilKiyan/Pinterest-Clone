import { readFileSync, writeFileSync } from 'fs'

const path = 'public/sw.js'
const content = readFileSync(path, 'utf8')
const version = `v${Date.now()}`  
writeFileSync(path, content.replace(/const VERSION = '.*'/, `const VERSION = '${version}'`))
console.log(`✅ SW version bumped to ${version}`)