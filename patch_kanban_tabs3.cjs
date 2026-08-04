const fs = require('fs');
let code = fs.readFileSync('src/components/Kanban.tsx', 'utf-8');

const targetEnd = `      ))}
    </div>
  );
}`;

const newEnd = `      ))}
    </div>
    </div>
  );
}`;

code = code.replace(targetEnd, newEnd);
fs.writeFileSync('src/components/Kanban.tsx', code);
console.log("Fixed Kanban end tags");
