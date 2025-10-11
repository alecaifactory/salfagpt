# Cursor AI Rules for SalfaGPT

This directory contains rules that guide the AI assistant to prevent common errors and maintain code quality.

## Active Rules

### Critical (Must Follow)

1. **error-prevention-checklist.mdc** 
   - Prevents common errors from past issues
   - External API usage patterns
   - State management rules
   - Error handling requirements

2. **gemini-api-usage.mdc**
   - Correct Gemini API patterns
   - Forbidden patterns to avoid
   - Migration guide reference

3. **ui-features-protection.mdc** ⭐ NEW
   - Protects user-facing UI features
   - Lists all features that must not be removed
   - Recovery procedures if features are lost

4. **code-change-protocol.mdc** ⭐ NEW
   - Mandatory protocol for all code changes
   - When to ask user before making changes
   - Verification steps after changes

5. **branch-management.mdc** ⭐ NEW
   - NEVER switch branches without validation
   - Check for uncommitted changes
   - Verify protected features
   - Ask user before switching
   - Risk assessment and recommendations

6. **production-config-validation.mdc** ⭐ NEW
   - Validates runtime configuration correctness
   - Ensures useMockData is false
   - Verifies config passes through full chain
   - Checks Gemini SDK usage patterns
   - Prevents integration breakage

### Configuration

7. **localhost-port.mdc**
   - Always use port 3000 for this project

## How Cursor Rules Work

### alwaysApply: true
Rules with `alwaysApply: true` in the frontmatter are ALWAYS active and the AI must follow them.

### When AI Should Read These Rules

The AI should read these rules:
1. **Before** modifying any protected file (ChatInterface.tsx, firestore.ts, gemini.ts)
2. **When** unsure about API usage or patterns
3. **After** encountering an error
4. **During** code review or refactoring

## Protected Files

Files that require extra caution (read protection rules first):

- `src/components/ChatInterface.tsx` - Main UI (ui-features-protection.mdc)
- `src/lib/gemini.ts` - AI integration (gemini-api-usage.mdc)
- `src/lib/firestore.ts` - Database operations
- `src/lib/gcp.ts` - Cloud services

## Feature Protection Registry

### Protected UI Features (DO NOT REMOVE):

1. **Model Display Indicator**
   - Location: Next to Context button
   - Format: `Context: 0.0% • ✨ Gemini 2.5 Flash`
   - Required imports: Sparkles
   - Required state: userConfig

2. **Disclaimer Text**
   - Location: Below chat input
   - Text: "SalfaGPT puede cometer errores..."
   - Required wrapper: space-y-3 div

3. **Folders Section**
   - Location: Top of sidebar
   - Required imports: Folder, FolderPlus, X
   - Required state: folders, selectedFolder, etc.

4. **Context Window Full History**
   - Function: calculateLocalContext()
   - Shows complete conversation history with timestamps

## Quick Reference

### Before Making Changes
```bash
# 1. Read protection rules
cat .cursor/rules/ui-features-protection.mdc

# 2. Check current file state
git diff src/components/ChatInterface.tsx

# 3. Verify protected features present
grep "Sparkles" src/components/ChatInterface.tsx
grep "userConfig" src/components/ChatInterface.tsx
grep "SalfaGPT puede cometer" src/components/ChatInterface.tsx
```

### After Making Changes
```bash
# 1. Type check
npm run type-check

# 2. Lint
npm run lint

# 3. Test in browser
open http://localhost:3000/chat

# 4. Verify features
# - Model name visible
# - Disclaimer present
# - Folders functional
```

### If Features Are Lost
```bash
# 1. Check git status
git status
git diff

# 2. Restore from git
git restore src/components/ChatInterface.tsx

# 3. Or restore manually using:
# .cursor/rules/ui-features-protection.mdc
# (Contains exact code to restore)
```

## Rule Maintenance

### Adding New Rules

1. Create `.mdc` file in this directory
2. Add frontmatter with `alwaysApply: true`
3. Document the rule clearly
4. Add to this README
5. Test that AI follows the rule

### Updating Existing Rules

1. Update the `.mdc` file
2. Update "Last Updated" timestamp
3. Document the reason for update
4. Update this README if needed

### Rule Priority

When rules conflict, priority order:
1. User explicit request (always highest)
2. ui-features-protection.mdc (protect working features)
3. code-change-protocol.mdc (change safety)
4. gemini-api-usage.mdc (API correctness)
5. error-prevention-checklist.mdc (error prevention)

## Common Scenarios

### Scenario: Refactoring ChatInterface.tsx

1. Read `ui-features-protection.mdc`
2. Read `code-change-protocol.mdc`
3. Verify all protected features before starting
4. Make changes preserving all features
5. Run verification steps
6. Test in browser

### Scenario: Adding New Feature

1. Read relevant protection rules
2. Implement feature
3. Document in `docs/features/`
4. Add to protection rules if user-facing
5. Update this README

### Scenario: API Integration

1. Read `gemini-api-usage.mdc` or relevant rule
2. Follow documented patterns
3. Test with real API
4. Handle errors properly
5. Document integration

### Scenario: Emergency Bug Fix

1. Identify the bug
2. Check if it involves protected features
3. Read relevant rules
4. Fix minimally (don't refactor while fixing)
5. Test thoroughly
6. Document the fix

## Testing Rules Effectiveness

To verify rules are working:

1. **Intentionally try to remove a protected feature**
   - AI should warn or refuse
   - AI should ask user to confirm

2. **Make a change without reading rules**
   - AI should remind to read rules
   - AI should verify protected features

3. **Ask AI to simplify code**
   - AI should preserve all features
   - AI should ask about trade-offs

## Documentation Links

- Feature docs: `docs/features/`
- Architecture: `docs/architecture/`
- Branch log: `docs/BranchLog.md`
- Integration lessons: `docs/CHAT_INTEGRATION_LESSONS.md`

## Support

If you encounter issues with rules:

1. Check if rule file exists and has correct frontmatter
2. Verify rule is clear and unambiguous
3. Test AI behavior with the rule
4. Update or clarify rule if needed
5. Document changes in this README

---

**Last Updated**: January 11, 2025  
**Rules Active**: 5 (2 critical, 2 new protection rules, 1 config)  
**Protected Features**: 4 (Model display, Disclaimer, Folders, Context)
