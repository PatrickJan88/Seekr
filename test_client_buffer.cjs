const text = `data: {"meta":{"ogImage":"","logoUrl":""}}\n\ndata: {"text":"{\\"companyName\\":\\"Target Company\\"}"}\n\ndata: [DONE]\n\n`;

let buffer = '';
let rawJsonStr = '';

const linesRaw = text.split('\n'); // Simulating decoder receiving everything at once
buffer += text;
const lines = buffer.split('\n');
buffer = lines.pop() || '';

for (const line of lines) {
    if (line.trim() === '') continue;
    if (line.startsWith('data: [DONE]')) {
        break;
    }
    if (line.startsWith('data: ')) {
        const data = JSON.parse(line.substring(6));
        if (data.text) {
            rawJsonStr += data.text;
        }
    }
}

console.log("rawJsonStr:", rawJsonStr);
