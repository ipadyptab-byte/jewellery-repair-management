const fs = require('fs');
let code = fs.readFileSync('src/app/App.tsx', 'utf8');

// Add a useEffect that automatically calls api/settings to save locations
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

code = code.replace("const [locations, setLocations] = useState", effectCode + "\n  const [locations, setLocations] = useState");

fs.writeFileSync('src/app/App.tsx', code);
