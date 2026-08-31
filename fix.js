const fs = require('fs');
let code = fs.readFileSync('src/app/api/settings/route.ts', 'utf8');

// 1. Add to initial settings object
code = code.replace(
  "whatsappRmApiVersion: 'v17.0'",
  "whatsappRmApiVersion: 'v17.0',\n      locationsList: null"
);

// 2. Add to GET parsing logic
code = code.replace(
  "case 'tax_rate':",
  "case 'locations_list':\n          settings.locationsList = row.value ? JSON.parse(row.value) : null;\n          break;\n        case 'tax_rate':"
);

// 3. Add to POST body destructuring
code = code.replace(
  "koregaonSeq\n    } = body;",
  "koregaonSeq,\n      locationsList\n    } = body;"
);

// 4. Add to POST saving logic
code = code.replace(
  "if (koregaonSeq !== undefined) settingsMap['koregaon_seq'] = String(koregaonSeq);",
  "if (koregaonSeq !== undefined) settingsMap['koregaon_seq'] = String(koregaonSeq);\n    if (locationsList !== undefined) settingsMap['locations_list'] = JSON.stringify(locationsList);"
);

fs.writeFileSync('src/app/api/settings/route.ts', code);
