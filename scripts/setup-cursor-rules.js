#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

/**
 * Modern Cursor Rules Setup - Machine-Readable Configuration
 * Generates .cursor/rules.md files for each repository based on config.json
 */

const CONFIG_PATH = path.join(__dirname, '../.cursor/config.json')
const SHARED_RULES_DIR = path.join(__dirname, '../.cursor/shared-rules')

class CursorRulesManager {
  constructor() {
    this.config = this.loadConfig()
    this.baseDir = path.dirname(__dirname)
  }

  loadConfig() {
    try {
      const configContent = fs.readFileSync(CONFIG_PATH, 'utf8')
      return JSON.parse(configContent)
    } catch (error) {
      console.error('❌ Failed to load cursor rules config:', error.message)
      process.exit(1)
    }
  }

  async generateAllRules() {
    console.log('🚀 Generating cursor rules for all repositories...\n')

    const results = {
      success: [],
      skipped: [],
      errors: [],
    }

    for (const [repoName, repoConfig] of Object.entries(
      this.config.repositories
    )) {
      try {
        const result = await this.generateRepositoryRules(repoName, repoConfig)
        results.success.push(result)
      } catch (error) {
        console.error(
          `❌ Failed to generate rules for ${repoName}:`,
          error.message
        )
        results.errors.push({ repo: repoName, error: error.message })
      }
    }

    this.printSummary(results)
    return results
  }

  async generateRepositoryRules(repoName, repoConfig) {
    const repoPath = path.join(this.baseDir, repoConfig.path.replace('../', ''))
    const cursorDir = path.join(repoPath, '.cursor')
    const rulesFile = path.join(cursorDir, 'rules.md')

    // Ensure .cursor directory exists
    if (!fs.existsSync(cursorDir)) {
      fs.mkdirSync(cursorDir, { recursive: true })
    }

    // Generate rules content
    const rulesContent = this.generateRulesContent(repoName, repoConfig)

    // Write rules file
    fs.writeFileSync(rulesFile, rulesContent)

    // Remove old .cursorrules file if it exists
    const oldRulesFile = path.join(repoPath, '.cursorrules')
    if (fs.existsSync(oldRulesFile)) {
      fs.unlinkSync(oldRulesFile)
    }

    console.log(
      `✅ Generated rules for ${repoName} → ${path.relative(
        this.baseDir,
        rulesFile
      )}`
    )

    return {
      repo: repoName,
      path: rulesFile,
      rulesCount: repoConfig.rules.length,
      customRulesCount: repoConfig.customRules.length,
    }
  }

  generateRulesContent(repoName, repoConfig) {
    const { rules, customRules, type } = repoConfig
    const timestamp = new Date().toISOString()

    let content = `# ${this.config.name}
# Repository: ${repoName} (${type})
# Generated: ${timestamp}
# Configuration Version: ${this.config.version}

---

`

    // Add table of contents if enabled
    if (this.config.generation.includeTableOfContents) {
      content += this.generateTableOfContents(rules, customRules)
    }

    // Add shared rules
    content += '## 🌍 Shared Ecosystem Rules\n\n'
    content +=
      'The following rules are shared across the entire Nodots Backgammon ecosystem:\n\n'

    for (const ruleKey of rules) {
      const rule = this.config.sharedRules[ruleKey]
      if (!rule) {
        console.warn(`⚠️  Warning: Rule '${ruleKey}' not found in shared rules`)
        continue
      }

      content += `### ${this.capitalizeFirst(ruleKey)} Rules\n`
      content += `*${rule.description}*\n\n`

      const rulePath = path.join(
        SHARED_RULES_DIR,
        rule.path.replace('shared-rules/', '')
      )
      if (fs.existsSync(rulePath)) {
        const ruleContent = fs.readFileSync(rulePath, 'utf8')
        content += ruleContent + '\n\n'
      } else {
        content += `❌ Rule file not found: ${rule.path}\n\n`
      }
    }

    // Add repository-specific rules
    if (customRules.length > 0) {
      content += '## 🎯 Repository-Specific Rules\n\n'
      content += `The following rules are specific to the ${repoName} repository:\n\n`

      for (const customRule of customRules) {
        content += `### ${customRule.name}\n`
        content += `${customRule.content}\n\n`
      }
    } else {
      content += '## 🎯 Repository-Specific Rules\n\n'
      content += '*No repository-specific rules defined.*\n\n'
      content += `To add repository-specific rules, edit the configuration in \`${path.relative(
        path.dirname(repoConfig.path),
        CONFIG_PATH
      )}\`\n\n`
    }

    // Add metadata footer
    if (this.config.generation.includeMetadata) {
      content += this.generateMetadataFooter(repoName, repoConfig)
    }

    return content
  }

  generateTableOfContents(rules, customRules) {
    let toc = '## 📋 Table of Contents\n\n'

    toc += '### Shared Rules\n'
    for (const ruleKey of rules) {
      const rule = this.config.sharedRules[ruleKey]
      if (rule) {
        toc += `- [${this.capitalizeFirst(
          ruleKey
        )} Rules](#${ruleKey.toLowerCase()}-rules)\n`
      }
    }

    if (customRules.length > 0) {
      toc += '\n### Repository-Specific Rules\n'
      for (const customRule of customRules) {
        const anchor = customRule.name.toLowerCase().replace(/\s+/g, '-')
        toc += `- [${customRule.name}](#${anchor})\n`
      }
    }

    return toc + '\n---\n\n'
  }

  generateMetadataFooter(repoName, repoConfig) {
    return `---

## 📊 Rule Configuration Metadata

- **Repository**: ${repoName}
- **Type**: ${repoConfig.type}
- **Template**: ${this.getTemplateForType(repoConfig.type)}
- **Shared Rules**: ${repoConfig.rules.join(', ')}
- **Custom Rules**: ${repoConfig.customRules.length}
- **Last Updated**: ${new Date().toISOString()}
- **Config Version**: ${this.config.version}

---

**🔧 To modify these rules:**
1. Edit the configuration in \`.cursor/config.json\`
2. Run \`npm run setup\` to regenerate all rules
3. Commit changes to propagate across the ecosystem

**📚 For more information:**
- [Ecosystem Documentation](../ECOSYSTEM.md)
- [Shared Rules Directory](../.cursor/shared-rules/)
- [Development Workflow](../.cursor/shared-rules/development-workflow.md)
`
  }

  getTemplateForType(type) {
    const template = this.config.templates[type]
    return template ? template.description : 'Unknown'
  }

  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  printSummary(results) {
    console.log('\n📊 Setup Summary:')
    console.log(
      `✅ Successfully generated: ${results.success.length} repositories`
    )

    if (results.success.length > 0) {
      console.log('\n📁 Generated files:')
      results.success.forEach((result) => {
        console.log(
          `   ${result.repo}: ${result.rulesCount} shared + ${result.customRulesCount} custom rules`
        )
      })
    }

    if (results.errors.length > 0) {
      console.log(`❌ Errors: ${results.errors.length}`)
      results.errors.forEach((error) => {
        console.log(`   ${error.repo}: ${error.error}`)
      })
    }

    console.log('\n🎉 Cursor rules setup complete!')
    console.log('\n💡 Next steps:')
    console.log('   1. Review generated .cursor/rules.md files')
    console.log('   2. Commit changes to propagate across ecosystem')
    console.log('   3. Configure your IDE to use .cursor directories')
  }

  // Utility method to validate config
  validateConfig() {
    const errors = []

    // Check required fields
    if (!this.config.version) errors.push('Missing version field')
    if (!this.config.sharedRules) errors.push('Missing sharedRules field')
    if (!this.config.repositories) errors.push('Missing repositories field')

    // Check shared rules files exist
    for (const [key, rule] of Object.entries(this.config.sharedRules)) {
      const rulePath = path.join(
        SHARED_RULES_DIR,
        rule.path.replace('shared-rules/', '')
      )
      if (!fs.existsSync(rulePath)) {
        errors.push(`Shared rule file not found: ${rule.path}`)
      }
    }

    // Check repository paths exist
    for (const [repoName, repo] of Object.entries(this.config.repositories)) {
      const repoPath = path.join(this.baseDir, repo.path.replace('../', ''))
      if (!fs.existsSync(repoPath)) {
        errors.push(`Repository path not found: ${repo.path} (${repoName})`)
      }
    }

    if (errors.length > 0) {
      console.error('❌ Configuration validation failed:')
      errors.forEach((error) => console.error(`   - ${error}`))
      process.exit(1)
    }

    console.log('✅ Configuration validation passed')
  }
}

// CLI interface
async function main() {
  const command = process.argv[2]
  const manager = new CursorRulesManager()

  switch (command) {
    case 'validate':
      manager.validateConfig()
      break
    case 'generate':
    case undefined:
      manager.validateConfig()
      await manager.generateAllRules()
      break
    default:
      console.log(`Usage: ${process.argv[1]} [validate|generate]`)
      console.log('  validate  - Check configuration validity')
      console.log(
        '  generate  - Generate cursor rules for all repositories (default)'
      )
      process.exit(1)
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Fatal error:', error.message)
    process.exit(1)
  })
}

module.exports = CursorRulesManager
