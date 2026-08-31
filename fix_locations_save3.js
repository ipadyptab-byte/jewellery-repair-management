const fs = require('fs');
let code = fs.readFileSync('src/app/App.tsx', 'utf8');

// Find where the old useEffect was injected before `const [locations`
// Let's just remove the first useEffect that contains "locationsList: locations"
const parts = code.split('const [locations, setLocations] = useState');
if (parts.length > 1) {
  // Try to clean up the mess before the `const [locations`
  parts[0] = parts[0].replace(/\/\/ Auto-save locations when they change[\s\S]*?\}, \[locations\]\);\s*$/m, '');
  code = parts.join('const [locations, setLocations] = useState');
}

// Ensure the new useEffect is added AFTER `const [locations`
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
  /prefix: 'JR-KO', next_seq: 0 \}\n\s*\]\)/g,
  "prefix: 'JR-KO', next_seq: 0 }\n  ])" + effectCode
);

fs.writeFileSync('src/app/App.tsx', code);
