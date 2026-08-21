const fs = require('fs');

let code = fs.readFileSync('src/components/GlobalMarket.tsx', 'utf8');

const oldStrip = `  const stripHtml = (html: string) => {
    if (!html) return 'No description available.';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return (doc.body.textContent || doc.body.innerText || 'No description available.').trim().substring(0, 1000) + (html.length > 1000 ? '...' : '');
  };`;

const newStrip = `  const stripHtml = (html: string) => {
    if (!html) return 'No description available.';
    // First pass: decodes HTML entities (e.g. &lt;div&gt; to <div>)
    const doc1 = new DOMParser().parseFromString(html, 'text/html');
    const decodedHtml = doc1.body.textContent || "";
    
    // Second pass: parses the actual HTML tags and extracts pure text content
    const doc2 = new DOMParser().parseFromString(decodedHtml, 'text/html');
    const finalString = doc2.body.textContent || doc2.body.innerText || 'No description available.';
    
    return finalString.trim().substring(0, 1000) + (finalString.length > 1000 ? '...' : '');
  };`;

if (code.includes(oldStrip)) {
    code = code.replace(oldStrip, newStrip);
    fs.writeFileSync('src/components/GlobalMarket.tsx', code);
    console.log('Fixed stripHtml');
} else {
    console.error('oldStrip not found');
}
