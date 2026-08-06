const fs = require('fs');
let content = fs.readFileSync('src/types.ts', 'utf8');

if (!content.includes('export interface Attachment')) {
  content = `export interface Attachment {
  name: string;
  url: string;
}

` + content;
}

if (!content.includes('attachments?: Attachment[];')) {
  content = content.replace(
    '  coverLetterUrl?: string; // base64 or link',
    '  coverLetterUrl?: string; // base64 or link\n  attachments?: Attachment[];'
  );
}

fs.writeFileSync('src/types.ts', content);
