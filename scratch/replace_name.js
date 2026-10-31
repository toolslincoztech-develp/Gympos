const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(fullPath));
        } else {
            if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
                results.push(fullPath);
            }
        }
    });
    return results;
}

const files = walk(path.join(__dirname, '../src'));

let count = 0;
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // We do NOT want to change JWT secrets or variables if possible, but honestly changing "licoz" to "lincoz" in a JWT secret or file name won't hurt as long as we are consistent. But let's be safe.
    // Replace "Licoz POS" -> "POS Lincoz"
    content = content.replace(/Licoz POS/g, "POS Lincoz");
    content = content.replace(/LICOZ POS/g, "POS LINCOZ");
    content = content.replace(/licoz POS/gi, "POS Lincoz");
    
    // Replace "Licoz" -> "Lincoz" where it wasn't part of "Licoz POS"
    content = content.replace(/Licoz/g, "Lincoz");
    content = content.replace(/LICOZ/g, "LINCOZ");
    
    // Replace "licozpos" with "lincozpos" in emails
    content = content.replace(/licozpos/gi, "lincozpos");

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Updated:', file);
        count++;
    }
});
console.log('Replaced in', count, 'files.');
