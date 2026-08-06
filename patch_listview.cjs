const fs = require('fs');
let content = fs.readFileSync('src/components/ListView.tsx', 'utf8');

// Props
content = content.replace(
  "onStatusChange: (appId: string, status: JobStatus) => void;\n}",
  "onStatusChange: (appId: string, status: JobStatus) => void;\n  onDelete: (appId: string) => void;\n}"
);

// Exports
content = content.replace(
  "export function ListView({ applications, onEdit, onStatusChange }: ListViewProps) {",
  "export function ListView({ applications, onEdit, onStatusChange, onDelete }: ListViewProps) {"
);

// Operations Dropdown component
const operationsDropdownCode = `
function ActionDropdown({ onEdit, onDelete }: { onEdit: () => void, onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref} onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
      >
        <MoreVertical size={16} />
      </button>
      
      {open && (
        <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1 overflow-hidden">
          <button
            onClick={() => { setOpen(false); onEdit(); }}
            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => { setOpen(false); onDelete(); }}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
`;

content = content.replace("export function ListView", operationsDropdownCode + "\nexport function ListView");

// Th
content = content.replace(
  '<th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Status</th>\n            </tr>',
  '<th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Status</th>\n              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap text-right">Actions</th>\n            </tr>'
);

// Td
const rowCodeOriginal = `                  <td className="px-6 py-4">
                    <StatusDropdown 
                      status={app.status} 
                      onChange={(newStatus) => onStatusChange(app.id, newStatus)} 
                    />
                  </td>
                </tr>`;

const rowCodeNew = `                  <td className="px-6 py-4">
                    <StatusDropdown 
                      status={app.status} 
                      onChange={(newStatus) => onStatusChange(app.id, newStatus)} 
                    />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <ActionDropdown onEdit={() => onEdit(app)} onDelete={() => onDelete(app.id)} />
                  </td>
                </tr>`;
content = content.replace(rowCodeOriginal, rowCodeNew);

// Remove Building Icon
content = content.replace('<Building size={14} className="text-slate-400" />\n                      {app.company}', '{app.company}');

// Truncate Position and Company
content = content.replace(
  '<span className="font-bold text-sm text-slate-800">{app.position}</span>',
  '<div className="font-bold text-sm text-slate-800 max-w-[180px] truncate" title={app.position}>{app.position}</div>'
);
content = content.replace(
  '<div className="flex items-center gap-2 text-sm text-slate-600">\n                      {app.company}\n                    </div>',
  '<div className="text-sm text-slate-600 max-w-[150px] truncate" title={app.company}>{app.company}</div>'
);
// Also in case the replacement fails because of whitespace difference:
content = content.replace(
  '<div className="flex items-center gap-2 text-sm text-slate-600">',
  '<div className="text-sm text-slate-600 max-w-[150px] truncate" title={app.company}>'
);

fs.writeFileSync('src/components/ListView.tsx', content);
