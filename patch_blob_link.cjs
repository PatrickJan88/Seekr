const fs = require('fs');

let content = fs.readFileSync('src/components/BlobTextReveal.tsx', 'utf8');

// Update Props
content = content.replace('prefix?: string;', 'prefix?: React.ReactNode;');

// Update visually hidden span
content = content.replace('{prefix ? `${prefix} ` : ""}', '{prefix ? <>{prefix} </> : null}');

// Update preset props
const presetSearch = `"prefix": "Built by POFEI. Powered by",`;
const presetReplace = `"prefix": (
    <>
      Built by <a href="https://pofeiportfolio.vercel.app/" target="_blank" rel="noreferrer" className="hover:underline hover:text-slate-900 transition-colors cursor-pointer">POFEI</a>. Powered by
    </>
  ),`;
content = content.replace(presetSearch, presetReplace);

fs.writeFileSync('src/components/BlobTextReveal.tsx', content);
