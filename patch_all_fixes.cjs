const fs = require('fs');
let codeDash = fs.readFileSync('src/components/Dashboard.tsx', 'utf-8');
codeDash = codeDash.replace(/return \{ \.\.\.app, status: st as any \};/g, 'return { ...app, status: st as import("../types").JobStatus };');
fs.writeFileSync('src/components/Dashboard.tsx', codeDash);

let codeSankey = fs.readFileSync('src/components/SankeyChart.tsx', 'utf-8');
codeSankey = codeSankey.replace(/\]\.filter\(n => n\.name === 'Total Applications' \|\| \(n\.value && n\.value > 0\)\);/g, "].filter((n: any) => n.name === 'Total Applications' || (n.value && n.value > 0));");
fs.writeFileSync('src/components/SankeyChart.tsx', codeSankey);
