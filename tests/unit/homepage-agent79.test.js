import { describe,it,expect } from 'vitest';
import fs from 'node:fs'; import path from 'node:path';
const root=path.resolve(process.cwd(),'site');
describe('Agent 79 homepage',()=>{
 const s=fs.readFileSync(path.join(root,'main/index.html'),'utf8');
 it('is the front door with required choices',()=>{for(const x of ['Learn English your way.','Find my level','Explore courses','Continue learning','Explore by level','Practice by goal','How it works']) expect(s).toContain(x)});
 it('preserves placement as a separate route',()=>{expect(fs.existsSync(path.join(root,'main/placement.html'))).toBe(true);expect(s).toContain('./placement.html');});
 it('offers all CEFR levels',()=>{for(const x of ['../a1/index.html','../a2/index.html','../b1/index.html','../b2/index.html','../c1/index.html','../c2/index.html']) expect(s).toContain(x)});
});
