const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts')) results.push(file);
    }
  });
  return results;
}

const files = walk('./src/app/dashboard');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  // Replace $${ with PKR ${
  content = content.replace(/\$\$\{/g, 'PKR ${');
  
  // Replace >$ with >PKR 
  content = content.replace(/>\$/g, '>PKR ');
  
  // Replace -$ with -PKR 
  content = content.replace(/-\$/g, '-PKR ');
  
  // Replace ($) with (PKR)
  content = content.replace(/\(\$\)/g, '(PKR)');

  // Replace `$ with `PKR 
  content = content.replace(/\`\$/g, '\`PKR ');

  // Replace {`$ with {`PKR 
  content = content.replace(/\{\`\$/g, '{\`PKR ');

  // Some components might have text like > $ < 
  content = content.replace(/> \$/g, '> PKR ');

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Updated: ' + file);
  }
});
