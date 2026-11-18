// Official Make.fun library validation, with no account or submission operations.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { buildDossier, readGameTree, htmlFacts, sourceImports, resolveGamePath } from '../vendor/makefun-game.ts';
const root=resolve(import.meta.dirname,'..');
const caps={text_max_bytes:163840,screenshots:{max:4,max_bytes:262144},game_max_files:993,game_max_bytes:50331648,game_path_max_bytes:1000};
const hash=b=>createHash('sha256').update(b).digest('hex');
assert.equal(hash(readFileSync(join(root,'vendor/makefun-game.ts'))),'dc67187521b24025ff952f8c231485a6eb92d6d71d29edd2a08154ffb4376129','Official vendor changed');
const tree=readGameTree(join(root,'game'),caps),files=new Set(tree.files.map(f=>f.path));
const html=htmlFacts(readFileSync(join(root,'game/index.html'),'utf8'));
for(const ref of [...html.scripts.map(s=>s.src),...html.links.map(l=>l.href),...html.resources.map(r=>r.src)].filter(Boolean)){
  if(ref.startsWith('data:'))continue;
  const target=resolveGamePath(ref,'index.html');assert(target&&files.has(target),`Invalid/remote HTML resource ${ref}`);
}
let importCount=0;
for(const file of tree.files){
  if(!/\.(js|css|html)$/.test(file.path))continue;
  const source=readFileSync(join(root,'game',file.path),'utf8');
  assert(!/https?:\/\/|wss?:\/\/|\bfetch\s*\(|XMLHttpRequest|new WebSocket|@import\b/.test(source),`Network-dependent runtime: ${file.path}`);
  if(file.path.endsWith('.js')){
    const check=spawnSync(process.execPath,['--check',join(root,'game',file.path)],{encoding:'utf8'});assert.equal(check.status,0,check.stderr);
    for(const spec of sourceImports(source)){const target=resolveGamePath(spec,file.path);assert(target&&files.has(target),`${file.path}: missing import ${spec}`);importCount++;}
  }
}
const base=join(root,'.validation',`run-${Date.now()}`);mkdirSync(base,{recursive:true});
const outputs=[];
for(const name of ['a','b']){
  const out=join(base,name),run=spawnSync(process.execPath,[join(root,'main.ts')],{cwd:root,env:{...process.env,MAKEFUN_OUTPUT_DIR:out},encoding:'utf8'});
  assert.equal(run.status,0,run.stderr);console.log(run.stdout.trim());
  const dossier=readFileSync(join(out,'dossier.json'));assert.deepEqual(dossier,Buffer.from(buildDossier(out,caps)));
  assert(dossier.length<=1572864);outputs.push({out,bytes:dossier.length,sha256:hash(dossier)});
  const outTree=readGameTree(join(out,'game'),caps);assert.equal(outTree.totalBytes,tree.totalBytes);
  for(const f of tree.files)assert.deepEqual(readFileSync(join(root,'game',f.path)),readFileSync(join(out,'game',f.path)));
}
assert.equal(outputs[0].sha256,outputs[1].sha256,'Packaging must be deterministic');
const screenshots=readdirSync(join(root,'screenshots')).map(name=>({name,bytes:statSync(join(root,'screenshots',name)).size}));
assert(screenshots.length>=3&&screenshots.length<=4);assert(screenshots.every(s=>s.bytes<=262144));
const report={officialVendorUnchanged:true,gameFiles:tree.files.length,gameEntries:tree.count,gameBytes:tree.totalBytes,importsVerified:importCount,networkDependencies:0,screenshots,deterministicDossier:true,dossierBytes:outputs[0].bytes,dossierSha256:outputs[0].sha256,outputDirectory:outputs[0].out};
mkdirSync(join(root,'artifacts'),{recursive:true});writeFileSync(join(root,'artifacts/validation-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
