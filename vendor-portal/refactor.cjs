const fs = require('fs');
const path = require('path');
const dir = './src/pages';
const files = fs.readdirSync(dir);
files.forEach(file => {
  if (file.endsWith('.jsx')) {
    const p = path.join(dir, file);
    let content = fs.readFileSync(p, 'utf8');
    
    // Create an API_URL constant at the top if it doesn't exist
    if (!content.includes('const API_URL = import.meta.env.VITE_API_URL')) {
        // Insert after imports
        const lastImportIndex = content.lastIndexOf('import ');
        const endOfLastImport = content.indexOf('\n', lastImportIndex) + 1;
        content = content.slice(0, endOfLastImport) + '\nconst API_URL = import.meta.env.VITE_API_URL || \'http://localhost:8000/api/v1\';\n' + content.slice(endOfLastImport);
    }
    
    // Replace hardcoded URLs with the variable
    content = content.replace(/\"https:\/\/tryvia-ta57\.onrender\.com\/api\/v1([^\"`]*)\"/g, '`${API_URL}$1`');
    content = content.replace(/\`https:\/\/tryvia-ta57\.onrender\.com\/api\/v1([^\`]*)\`/g, '`${API_URL}$1`');

    fs.writeFileSync(p, content);
    console.log('Refactored ' + file);
  }
});
