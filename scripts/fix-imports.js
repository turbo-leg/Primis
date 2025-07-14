const fs = require('fs')
const path = require('path')

// Files that need fixing
const filesToFix = [
  'src/app/dashboard/chat/page.tsx',
  'src/app/dashboard/page.tsx',
  'src/app/courses/page.tsx',
  'src/app/contact/page.tsx',
  'src/app/page.tsx',
  'src/components/ui/navigation.tsx'
]

function removeDuplicateImports(filePath) {
  try {
    const fullPath = path.join(__dirname, '..', filePath)
    const content = fs.readFileSync(fullPath, 'utf8')
    
    const lines = content.split('\n')
    const imports = new Set()
    const nonImportLines = []
    let inImportSection = false
    let foundFirstImport = false
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      if (line.startsWith('import ') || line.startsWith('import{')) {
        if (!foundFirstImport) {
          foundFirstImport = true
          inImportSection = true
        }
        
        if (!imports.has(line)) {
          imports.add(line)
          nonImportLines.push(lines[i])
        }
      } else if (line === '') {
        if (inImportSection && foundFirstImport) {
          // Empty line after imports, keep it and end import section
          nonImportLines.push(lines[i])
          inImportSection = false
        } else if (!inImportSection) {
          nonImportLines.push(lines[i])
        }
      } else {
        inImportSection = false
        nonImportLines.push(lines[i])
      }
    }
    
    const fixedContent = nonImportLines.join('\n')
    fs.writeFileSync(fullPath, fixedContent, 'utf8')
    console.log(`✅ Fixed imports in ${filePath}`)
    
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message)
  }
}

// Fix all files
console.log('🔧 Fixing duplicate imports...')
filesToFix.forEach(removeDuplicateImports)
console.log('✅ All imports fixed!')