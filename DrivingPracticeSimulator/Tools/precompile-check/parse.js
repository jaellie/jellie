const Parser = require('web-tree-sitter');
const fs = require('fs'), path = require('path');
function walk(d, out = []) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p, out); else if (p.endsWith('.cs')) out.push(p); } return out; }
(async () => {
  await Parser.init();
  const lang = await Parser.Language.load(path.join(__dirname, 'node_modules/tree-sitter-wasms/out/tree-sitter-c_sharp.wasm'));
  const parser = new Parser(); parser.setLanguage(lang);
  const files = walk(process.argv[2]); let bad = 0;
  for (const f of files) {
    const src = fs.readFileSync(f, 'utf8');
    const tree = parser.parse(src);
    const errs = [];
    (function visit(n) { if (n.type === 'ERROR' || n.isMissing) errs.push(n); else if (n.hasError) for (const c of n.children) visit(c); })(tree.rootNode);
    if (errs.length) { bad++; for (const e of errs.slice(0, 4)) console.log(`${path.relative(process.argv[2], f)}:${e.startPosition.row + 1}:${e.startPosition.column + 1} ${e.isMissing ? 'MISSING ' + e.type : 'ERROR'}: ${src.slice(e.startIndex, Math.min(e.endIndex, e.startIndex + 80)).replace(/\n/g, ' ')}`); }
  }
  console.log(`${files.length} files parsed, ${bad} with syntax errors`);
})();
