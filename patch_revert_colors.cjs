const fs = require('fs');

const files = ['src/App.tsx', 'src/components/Kanban.tsx', 'src/components/Analytics.tsx', 'src/components/JobForm.tsx', 'src/components/Dashboard.tsx'];

files.forEach(file => {
    let code = fs.readFileSync(file, 'utf-8');
    code = code.replace(/amber-50/g, 'blue-50');
    code = code.replace(/amber-100/g, 'blue-100');
    code = code.replace(/amber-200/g, 'blue-200');
    code = code.replace(/amber-300/g, 'blue-300');
    code = code.replace(/amber-400/g, 'blue-400');
    code = code.replace(/amber-500/g, 'blue-500');
    code = code.replace(/amber-600/g, 'blue-600');
    code = code.replace(/amber-700/g, 'blue-700');
    code = code.replace(/amber-800/g, 'blue-800');
    code = code.replace(/amber-900/g, 'blue-900');
    
    fs.writeFileSync(file, code);
});
