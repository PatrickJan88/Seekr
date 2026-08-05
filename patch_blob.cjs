const fs = require('fs');

let content = fs.readFileSync('src/components/BlobTextReveal.tsx', 'utf8');

const targetPreset = `const __originkitPresetProps = {
  "prefix": "Built by POFEI. Powered by",
  "texts": [
    "AI",
    "Coffees"
  ],`;

const replacementPreset = `const __originkitPresetProps = {
  "prefix": "🖋 Made by",
  "texts": [
    "Pofei"
  ],`;

content = content.replace(targetPreset, replacementPreset);

fs.writeFileSync('src/components/BlobTextReveal.tsx', content);
