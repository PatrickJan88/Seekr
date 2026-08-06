const fs = require('fs');
let content = fs.readFileSync('src/components/ListView.tsx', 'utf8');

const searchTruncatedNotes = `function TruncatedNotes({ text }: { text: string }) {
  const [showFull, setShowFull] = useState(false);
  
  if (!text) return <span className="text-slate-400 italic">-</span>;

  const words = text.split(/\\s+/);
  const isLong = words.length > 20;
  const truncatedText = isLong ? words.slice(0, 20).join(' ') + '...' : text;

  return (
    <>
      <div 
        className="text-slate-600 cursor-pointer hover:text-slate-900 group relative inline-block max-w-[300px]"
        onClick={(e) => { e.stopPropagation(); if (isLong) setShowFull(true); }}
      >
        <span className="line-clamp-2 text-sm">{truncatedText}</span>
        {isLong && (
          <span className="text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity ml-1 flex items-center gap-1 inline-flex">
            <Eye size={12} /> View more
          </span>
        )}
      </div>`;

const replaceTruncatedNotes = `function TruncatedNotes({ text }: { text: string }) {
  const [showFull, setShowFull] = useState(false);
  
  if (!text) return <span className="text-slate-400 italic">-</span>;

  return (
    <>
      <div 
        className="text-slate-600 cursor-pointer hover:text-slate-900 group relative inline-flex items-center max-w-[250px] w-full"
        onClick={(e) => { e.stopPropagation(); setShowFull(true); }}
      >
        <span className="truncate text-sm pr-6 block w-full">{text}</span>
        <span className="absolute right-0 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 bg-white shadow-sm px-1.5 py-1 rounded-md text-xs flex items-center border border-slate-200">
          <Eye size={14} />
        </span>
      </div>`;

content = content.replace(searchTruncatedNotes, replaceTruncatedNotes);

// Fix ActionDropdown in ListView.tsx
const searchActionDropdown = `          <button
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
          </button>`;

const replaceActionDropdown = `          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onEdit(); }}
            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onDelete(); }}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            Delete
          </button>`;

content = content.replace(searchActionDropdown, replaceActionDropdown);

fs.writeFileSync('src/components/ListView.tsx', content);
