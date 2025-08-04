# Autonomous Claude System for Nodots Backgammon

## Overview

This document outlines the technical architecture for enabling multiple Claude instances to work autonomously on GitHub issues in the nodots-backgammon repository concurrently.

## System Architecture

### Core Components

1. **Issue Queue Manager**: Distributes GitHub issues to available Claude instances
2. **Claude Orchestrator**: Manages multiple Claude Code instances and their workspaces
3. **Git Branch Coordinator**: Prevents conflicts between concurrent development
4. **Status Monitor**: Tracks progress and handles failures/retries
5. **Integration Layer**: Manages GitHub API interactions and PR creation

### Workflow Overview

```
GitHub Issues → Issue Queue → Claude Instances → Feature Branches → Pull Requests
```

## Technical Implementation

### 1. Issue Queue Manager

**Purpose**: Fetch, prioritize, and distribute GitHub issues to available Claude instances.

**Key Features**:
- Fetches open issues using GitHub API
- Filters issues by labels (e.g., `claude-ready`, `bug`, `enhancement`)
- Maintains queue state in Redis or local database
- Prevents duplicate issue assignment
- Handles issue priority and dependencies

**Implementation**:
```bash
# Service that runs continuously
node scripts/issue-queue-manager.js
```

**Configuration**:
```json
{
  "github": {
    "repo": "nodots-backgammon",
    "labels": ["claude-ready", "good-first-issue"],
    "excludeLabels": ["blocked", "in-progress"]
  },
  "queue": {
    "maxConcurrentIssues": 5,
    "retryAttempts": 3,
    "timeoutMinutes": 120
  }
}
```

### 2. Claude Orchestrator

**Purpose**: Spawn and manage multiple Claude Code instances with isolated workspaces.

**Key Features**:
- Creates isolated Git worktrees for each Claude instance
- Manages environment variables and configurations per instance
- Handles Claude instance lifecycle (start, monitor, cleanup)
- Implements resource limits and timeout handling

**Directory Structure**:
```
workspaces/
├── claude-instance-1/
│   ├── nodots-backgammon/     # Git worktree
│   ├── .env                   # Instance-specific config
│   └── claude.log             # Instance logs
├── claude-instance-2/
│   ├── nodots-backgammon/
│   ├── .env
│   └── claude.log
└── shared/
    ├── templates/
    └── scripts/
```

**Implementation**:
```bash
# Script to spawn Claude instances
./scripts/spawn-claude-instance.sh <issue-id> <workspace-id>
```

### 3. Git Branch Coordinator

**Purpose**: Ensure each Claude instance works on isolated feature branches without conflicts.

**Key Features**:
- Generates unique branch names based on issue ID and timestamp
- Creates Git worktrees from `main` branch
- Handles branch cleanup after PR merge/close
- Prevents branch naming conflicts

**Branch Naming Convention**:
```
claude/issue-<issue-number>-<timestamp>
# Example: claude/issue-123-20250801143022
```

**Git Worktree Management**:
```bash
# Create worktree for new issue
git worktree add ../workspaces/claude-instance-1/nodots-backgammon -b claude/issue-123-20250801143022

# Cleanup after completion
git worktree remove ../workspaces/claude-instance-1/nodots-backgammon
git branch -D claude/issue-123-20250801143022
```

### 4. Status Monitor

**Purpose**: Track progress, handle failures, and provide visibility into autonomous operations.

**Key Features**:
- Real-time status dashboard
- Log aggregation from all Claude instances
- Failure detection and automatic retry logic
- Performance metrics and reporting
- Slack/email notifications for critical events

**Status Types**:
- `queued`: Issue assigned but not started
- `in-progress`: Claude actively working on issue
- `testing`: Running tests and validation
- `pr-ready`: Pull request created, awaiting review
- `completed`: Issue resolved and PR merged
- `failed`: Issue failed, requires manual intervention

### 5. Integration Layer

**Purpose**: Handle GitHub API interactions and automate PR lifecycle.

**Key Features**:
- GitHub issue assignment and status updates
- Automated PR creation with proper templates
- Link PRs to original issues
- Handle PR reviews and merge automation
- Update issue status based on PR state

## Setup Instructions

### Prerequisites

1. **GitHub CLI**: Install and authenticate `gh` CLI
2. **Node.js 18+**: For running orchestration scripts
3. **Redis** (optional): For distributed queue management
4. **Claude Code**: Installed and configured with API key

### Step 1: Repository Setup

```bash
# Clone the main repository
git clone https://github.com/your-org/nodots-backgammon.git
cd nodots-backgammon

# Create workspace directory structure
mkdir -p workspaces/shared/{templates,scripts}
mkdir -p logs
```

### Step 2: GitHub Configuration

```bash
# Set up GitHub CLI
gh auth login

# Create labels for issue management
gh label create "claude-ready" --description "Ready for autonomous Claude development"
gh label create "claude-in-progress" --description "Currently being worked on by Claude"
gh label create "claude-blocked" --description "Blocked, requires human intervention"
```

### Step 3: Orchestration Scripts

Create the following scripts in `workspaces/shared/scripts/`:

**issue-queue-manager.js**:
```javascript
// Fetches and manages GitHub issues queue
// Integrates with GitHub API and Redis
```

**spawn-claude-instance.sh**:
```bash
#!/bin/bash
# Creates isolated workspace and spawns Claude instance
# Usage: ./spawn-claude-instance.sh <issue-id> <workspace-id>
```

**cleanup-workspace.sh**:
```bash
#!/bin/bash
# Cleans up completed or failed workspaces
# Removes git worktrees and temporary files
```

**monitor-instances.js**:
```javascript
// Monitors all active Claude instances
// Handles timeouts, failures, and status reporting
```

### Step 4: Claude Instance Template

Create template configuration in `workspaces/shared/templates/`:

**claude-prompt-template.md**:
```markdown
You are working autonomously on GitHub issue #{issue_number}.

Issue Title: {issue_title}
Issue Description: {issue_description}
Issue Labels: {issue_labels}

Your task:
1. Analyze the issue requirements
2. Implement the solution following the codebase patterns
3. Write/update tests as needed
4. Run linting and type checking
5. Create a pull request when complete

Repository: nodots-backgammon
Branch: {branch_name}
Working Directory: {workspace_path}

Follow all guidelines in CLAUDE.md and maintain code quality standards.
```

### Step 5: Monitoring Dashboard

Create a simple web dashboard to monitor all active instances:

```bash
# Start monitoring dashboard
node scripts/dashboard-server.js
# Access at http://localhost:3001
```

## Configuration Files

### orchestrator-config.json
```json
{
  "github": {
    "owner": "your-org",
    "repo": "nodots-backgammon",
    "token": "${GITHUB_TOKEN}"
  },
  "claude": {
    "apiKey": "${ANTHROPIC_API_KEY}",
    "maxInstances": 5,
    "timeoutMinutes": 120
  },
  "workspace": {
    "baseDir": "./workspaces",
    "cleanupAfterHours": 24
  },
  "notifications": {
    "slackWebhook": "${SLACK_WEBHOOK_URL}",
    "emailRecipients": ["dev-team@company.com"]
  }
}
```

### claude-instance.env (template)
```bash
GITHUB_TOKEN=your_github_token
ANTHROPIC_API_KEY=your_anthropic_key
ISSUE_ID={issue_id}
WORKSPACE_ID={workspace_id}
BRANCH_NAME={branch_name}
REPO_PATH={repo_path}
```

## Safety Measures

### 1. Resource Limits
- Maximum 5 concurrent Claude instances
- 2-hour timeout per issue
- Memory and CPU limits per instance
- Automatic cleanup of stale workspaces

### 2. Quality Gates
- Mandatory lint and type checking before PR creation
- Automated test execution
- Code review requirements on all PRs
- No direct commits to `main` branch

### 3. Failure Handling
- Automatic retry on transient failures
- Human notification on repeated failures
- Graceful degradation when GitHub API limits reached
- Rollback capability for problematic changes

### 4. Monitoring and Alerting
- Real-time status dashboard
- Log aggregation and analysis
- Performance metrics tracking
- Automated alerts for critical issues

## Usage Examples

### Start the Autonomous System
```bash
# Start the orchestrator
npm run start:orchestrator

# Monitor progress
npm run dashboard

# View logs
tail -f logs/orchestrator.log
```

### Manual Issue Assignment
```bash
# Assign specific issue to Claude
./scripts/assign-issue.sh 123

# Check instance status
./scripts/status.sh claude-instance-1

# Force cleanup
./scripts/cleanup.sh claude-instance-1
```

## Scaling Considerations

### Horizontal Scaling
- Deploy orchestrator on multiple machines
- Use Redis for distributed queue management
- Load balance GitHub API requests
- Implement circuit breakers for API rate limits

### Performance Optimization
- Cache GitHub API responses
- Batch operations where possible
- Optimize Git operations with shallow clones
- Use SSD storage for workspaces

## Security Considerations

### Access Control
- Use GitHub App tokens with minimal permissions
- Rotate API keys regularly
- Implement IP allowlisting for webhook endpoints
- Audit all autonomous changes

### Data Protection
- No sensitive data in log files
- Secure storage of API keys and tokens
- Encrypted communication channels
- Regular security audits

## Maintenance

### Daily Operations
- Monitor dashboard for failed instances
- Review PR quality and feedback
- Update issue labels and priorities
- Check resource utilization

### Weekly Maintenance
- Clean up old workspaces and logs
- Update Claude prompts based on feedback
- Analyze performance metrics
- Review and merge successful PRs

### Monthly Reviews
- Evaluate autonomous success rate
- Update configuration based on learnings
- Security audit and key rotation
- Performance optimization review

## Troubleshooting

### Common Issues
1. **GitHub API Rate Limits**: Implement exponential backoff and caching
2. **Git Conflicts**: Ensure proper branch isolation and cleanup
3. **Claude Timeouts**: Adjust complexity of assigned issues
4. **Workspace Disk Space**: Implement automatic cleanup policies
5. **Test Failures**: Improve test reliability and Claude test-writing skills

### Debug Commands
```bash
# Check orchestrator status
systemctl status claude-orchestrator

# View instance logs
tail -f workspaces/claude-instance-1/claude.log

# Validate workspace integrity
./scripts/validate-workspace.sh claude-instance-1

# Force cleanup all instances
./scripts/emergency-cleanup.sh
```

This autonomous system enables efficient parallel development while maintaining code quality and safety through proper isolation, monitoring, and quality gates.