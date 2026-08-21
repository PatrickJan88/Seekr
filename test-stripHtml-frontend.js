const { JSDOM } = require("jsdom");
const dom = new JSDOM(\`<!DOCTYPE html><p>Hello world</p>\`);
global.DOMParser = dom.window.DOMParser;

const stripHtml = (html) => {
    if (!html) return 'No description available.';
    // First pass: decodes HTML entities (e.g. &lt;div&gt; to <div>)
    const doc1 = new DOMParser().parseFromString(html, 'text/html');
    const decodedHtml = doc1.body.textContent || "";
    
    // Second pass: parses the actual HTML tags and extracts pure text content
    const doc2 = new DOMParser().parseFromString(decodedHtml, 'text/html');
    const finalString = doc2.body.textContent || doc2.body.innerText || 'No description available.';
    
    return finalString.trim().substring(0, 1000) + (finalString.length > 1000 ? '...' : '');
};

const encoded = '&lt;div class=&quot;content-intro&quot;&gt;&lt;h2 style=&quot;font-family: GothamBold,Helvetica,Arial,sans-serif; color: #662d91;&quot;&gt;Teamwork makes the stream work.&lt;/h2&gt;\\n&lt;p&gt;&amp;nbsp;&lt;/p&gt;';
console.log(stripHtml(encoded));
