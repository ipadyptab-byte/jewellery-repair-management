const fs = require('fs');
let code = fs.readFileSync('src/app/App.tsx', 'utf8');

const injectionStr = `
          if (settings.locationsList && Array.isArray(settings.locationsList) && settings.locationsList.length > 0) {
            setLocations(settings.locationsList);
          }`;

// Find `if (settings.businessName) setCfgShop(settings.businessName);`
// and prepend the locations list parsing.
code = code.replace(/if \(settings\.businessName\) setCfgShop\(settings\.businessName\);/g, 
  injectionStr.trim() + '\n          if (settings.businessName) setCfgShop(settings.businessName);'
);

fs.writeFileSync('src/app/App.tsx', code);
