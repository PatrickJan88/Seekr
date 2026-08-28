const fs = require('fs');

function cleanFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace {isZh ? 'zh string' : 'en string'} -> {'en string'}
  // But wait, if it's inside {isZh ? 'A' : 'B'}, we just want 'B'.
  // We can just regex `isZh \? ([^:]+) : (.*?)` -> `$2` in a while loop if it's simple, but balancing is hard.
  
  // Let's do simple strings: `isZh \? '.*?' : ('.*?')`
  content = content.replace(/isZh \? '.*?' : ('.*?')/g, '$1');
  content = content.replace(/isZh \? `.*?` : (`.*?`)/g, '$1');
  content = content.replace(/isZh \? ".*?" : (".*?")/g, '$1');

  // Replace `isZh ? obj.propZh : obj.prop` -> `obj.prop`
  content = content.replace(/isZh \? [a-zA-Z0-9_.\?]+Zh : ([a-zA-Z0-9_.\?]+)/g, '$1');

  // Replace `isZh ? \`${...}Zh\\n${...}Zh\` : \`${...}\\n${...}\``
  // This one is specific: onClick={() => copyToClipboard(isZh ? `${p.titleZh}\n${p.proposalZh}` : `${p.title}\n${p.proposal}`, `pitch_${idx}`)}
  content = content.replace(/isZh \? `\$\{p\.titleZh\}\\n\$\{p\.proposalZh\}` : (`\$\{p\.title\}\\n\$\{p\.proposal\}`)/g, '$1');
  
  // Replace `isZh ? q.questionZh : q.question` inside copyToClipboard
  content = content.replace(/isZh \? q\.questionZh : q\.question/g, 'q.question');

  // Remove `const isZh = ...` if it exists.
  content = content.replace(/const isZh = [^;]+;/g, '');

  // Remove `{isZh ? ( ... ) : ( ... )}` - wait, there might not be JSX ones, just strings.
  // Let's check for remaining `isZh`
  
  // For `(isZh ? currentTeardown.aiSpectrum.evidenceZh : currentTeardown.aiSpectrum.evidence).map`
  content = content.replace(/\(isZh \? currentTeardown\.aiSpectrum\.evidenceZh : currentTeardown\.aiSpectrum\.evidence\)/g, 'currentTeardown.aiSpectrum.evidence');

  fs.writeFileSync(filePath, content);
}

cleanFile('src/components/CompanyIntelligenceStudio.tsx');
cleanFile('src/components/CVMatchAssessment.tsx');

let typesContent = fs.readFileSync('src/types.ts', 'utf8');
typesContent = typesContent.replace(/\s+[a-zA-Z0-9_]+Zh\??: string(\[\])?;/g, '');
typesContent = typesContent.replace(/pointZh: string; /g, '');
typesContent = typesContent.replace(/detailZh: string /g, '');
typesContent = typesContent.replace(/titleZh: string; /g, '');
typesContent = typesContent.replace(/proposalZh: string; /g, '');
typesContent = typesContent.replace(/rationaleZh: string /g, '');
typesContent = typesContent.replace(/questionZh: string; /g, '');
typesContent = typesContent.replace(/whyItWorksZh: string /g, '');
fs.writeFileSync('src/types.ts', typesContent);

console.log("Cleanup done.");
