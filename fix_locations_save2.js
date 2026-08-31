const fs = require('fs');
let code = fs.readFileSync('src/app/App.tsx', 'utf8');

// Remove the old injected code
code = code.replace(/\/\/ Auto-save locations when they change\n  useEffect\(\(\) => \{\n    if \(locations && locations\.length > 0\) \{\n      fetch\('\/api\/settings', \{\n        method: 'POST',\n        headers: \{ 'Content-Type': 'application\/json' \},\n        body: JSON\.stringify\(\{ locationsList: locations \}\)\n      \}\)\.catch\(console\.error\);\n    \}\n  \}, \[locations\]\);\n\n/g, '');

const effectCode = `
  // Auto-save locations when they change
  useEffect(() => {
    if (locations && locations.length > 0) {
      fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationsList: locations })
      }).catch(console.error);
    }
  }, [locations]);
`;

code = code.replace(
  "])\n  const [newLocationName, setNewLocationName] = useState('')", 
  "])\n" + effectCode + "\n  const [newLocationName, setNewLocationName] = useState('')"
);

fs.writeFileSync('src/app/App.tsx', code);
