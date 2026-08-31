const fs = require('fs');
let code = fs.readFileSync('src/app/App.tsx', 'utf8');

const newRemoveLocation = `  const removeLocation = async (id: string) => {
    if (id === 'satara') {
      showMessage('location', 'Cannot remove main location', false)
      return
    }
    
    // Check if records exist for this location
    const locationRecords = records.filter(r => r.location === id)
    if (locationRecords.length > 0) {
      if (!confirm(\`There are \${locationRecords.length} records in this location. Deleting the location will move these records to the main location (Satara). Do you want to proceed?\`)) {
        return
      }
      
      try {
        // We will just do it sequentially for simplicity
        for (const record of locationRecords) {
          await fetch('/api/records', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: record.id,
              location: 'satara',
              current_location: record.current_location === id ? 'satara' : record.current_location
            })
          });
        }
        
        setRecords(prev => prev.map(r => r.location === id ? {
          ...r, 
          location: 'satara',
          current_location: r.current_location === id ? 'satara' : r.current_location
        } : r));
      } catch (err) {
        console.error('Failed to migrate records:', err);
        showMessage('location', 'Failed to migrate records to Satara', false);
        return;
      }
    } else {
      if (!confirm(\`Remove location "\${id}"? This cannot be undone.\`)) {
        return
      }
    }
    
    setLocations(prev => prev.filter(l => l.id !== id))
    if (cfgLocation === id) handleSetLocation('satara')
    showMessage('location', \`Location "\${id}" removed\`, true)
  }`;

// Replace the old function
const oldFuncRegex = /  const removeLocation = \(id: string\) => \{[\s\S]*?  \}/;
code = code.replace(oldFuncRegex, newRemoveLocation);

fs.writeFileSync('src/app/App.tsx', code);
