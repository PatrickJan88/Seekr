const fs = require('fs');

const files = ['src/App.tsx', 'src/components/Kanban.tsx', 'src/components/Analytics.tsx', 'src/components/JobForm.tsx', 'src/components/Dashboard.tsx'];

files.forEach(file => {
    let code = fs.readFileSync(file, 'utf-8');
    code = code.replace(/blue-50/g, 'amber-50');
    code = code.replace(/blue-100/g, 'amber-100');
    code = code.replace(/blue-200/g, 'amber-200');
    code = code.replace(/blue-300/g, 'amber-300');
    code = code.replace(/blue-400/g, 'amber-400');
    code = code.replace(/blue-500/g, 'amber-500');
    code = code.replace(/blue-600/g, 'amber-600');
    code = code.replace(/blue-700/g, 'amber-700');
    code = code.replace(/blue-800/g, 'amber-800');
    code = code.replace(/blue-900/g, 'amber-900');
    
    // Specifically for hex codes in Analytics
    code = code.replace(/#2563eb/g, '#f59e0b'); // blue-600 -> amber-500
    code = code.replace(/#3b82f6/g, '#f59e0b'); // blue-500 -> amber-500

    fs.writeFileSync(file, code);
});
