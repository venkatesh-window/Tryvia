const fs = require('fs');
const path = require('path');
const dirs = ['app', 'src'];
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
}
let allFiles = [];
dirs.forEach(d => allFiles = allFiles.concat(walk(d)));
allFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('experimentalBlurMethod=\"dimezisBlurView\"')) {
    content = content.replace(/experimentalBlurMethod=\"dimezisBlurView\"/g, '');
    fs.writeFileSync(file, content);
    console.log('Fixed:', file);
  }
});
