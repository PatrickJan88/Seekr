const fs = require('fs');
let code = fs.readFileSync('src/components/Kanban.tsx', 'utf-8');

code = code.replace(
    /className="flex-shrink-0 w-\[280px\] lg:w-\[calc\(20%-13px\)\] xl:w-\[calc\(20%-13px\)\] lg:min-w-\[150px\] flex flex-col bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm snap-start"/g,
    'className={`flex-shrink-0 w-[280px] lg:w-[calc(20%-13px)] xl:w-[calc(20%-13px)] lg:min-w-[150px] flex flex-col border-2 rounded-2xl p-5 shadow-sm snap-start ${status === \'Offer\' ? \'bg-blue-50 border-blue-200\' : \'bg-white border-slate-200\'}`}'
);

fs.writeFileSync('src/components/Kanban.tsx', code);
