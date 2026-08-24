const fs = require('fs');
const code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');
const returnIdx = code.lastIndexOf('  return (');
if (returnIdx !== -1) {
    const endIdx = code.indexOf('{isFormOpen &&', returnIdx);
    console.log(code.substring(returnIdx, endIdx));
} else {
    console.log("Not found");
}
