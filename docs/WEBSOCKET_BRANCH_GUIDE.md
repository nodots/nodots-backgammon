# WebSocket Refactoring Branch Guide

## Quick Reference

### Branch Structure

```
development (base)
├── websocket-refactor/types    (Phase 1.1 - WebSocket type definitions)
├── websocket-refactor/core     (Phase 1.2 - Core event emission)
├── websocket-refactor/api      (Phase 2.1 - Enhanced WebSocket server)
├── websocket-refactor/client   (Phase 3.1 - React client integration)
├── websocket-refactor/cli      (Phase 4.1 - CLI WebSocket support)
├── websocket-refactor/ai       (Phase 5.1 - AI WebSocket integration)
└── websocket-refactor/dice     (Phase 6.1 - Dice WebSocket events)
```

## Working with Branches

### Starting Work on a Subproject

```bash
# Switch to the appropriate branch
git checkout websocket-refactor/types  # or core, api, client, etc.

# Pull latest changes (if working with team)
git pull origin websocket-refactor/types

# Start working...
```

### Phase Dependencies

**Work in this order to respect dependencies:**

1. **Phase 1**: `types` → `core` (can work in parallel after types is stable)
2. **Phase 2**: `api` (depends on types)
3. **Phase 3**: `client` (depends on types + api)
4. **Phase 4**: `cli` (depends on types + api)
5. **Phase 5**: `ai` (depends on types + api)
6. **Phase 6**: `dice` (depends on types)

### Integration Strategy

- Work on each branch independently
- Merge completed phases back to `development` branch
- Test integration after each merge
- Final integration testing on `development`

### Merging Back to Development

```bash
# When a phase is complete, merge back
git checkout development
git pull origin development
git merge websocket-refactor/types
git push origin development

# Continue with next phase...
```

## Branch Checklist

### Before Starting Work

- [ ] Checked out correct branch
- [ ] Pulled latest changes
- [ ] Dependencies completed (see phase order above)

### Before Merging

- [ ] All tests passing
- [ ] Code reviewed
- [ ] Dependencies updated
- [ ] Documentation updated
- [ ] Integration tested locally

### After Merging

- [ ] Branch pushed to remote
- [ ] Team notified of completion
- [ ] Next phase dependencies can begin

## Emergency Procedures

### If Branch Gets Out of Sync

```bash
# Rebase branch on latest development
git checkout websocket-refactor/types
git rebase development
```

### If Need to Share Work Before Completion

```bash
# Push work-in-progress branch
git push origin websocket-refactor/types
```

### If Need to Start Over

```bash
# Reset branch to development state
git checkout websocket-refactor/types
git reset --hard development
```

---

**Created:** January 2025  
**Related:** WEBSOCKET_REFACTORING_PLAN.md
