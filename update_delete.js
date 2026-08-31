const fs = require('fs');
let code = fs.readFileSync('src/app/App.tsx', 'utf8');

code = code.replace(
  /<button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, fontSize: 16 }}\n                          onClick={\(\) => removeLocation\(loc\.id\)}>×<\/button>/g,
  '<button style={{ background: \\'#dc2626\\', border: \\'none\\', cursor: \\'pointer\\', color: \\'white\\', padding: \\'4px 8px\\', fontSize: 11, borderRadius: 4, marginLeft: 8 }}\n                          onClick={(e) => { e.stopPropagation(); removeLocation(loc.id); }}>🗑️ Delete</button>'
);

fs.writeFileSync('src/app/App.tsx', code);
