# Logging and Progress Tracking System

*Comprehensive logging architecture for the agentic Figma processor*

## Logging Architecture Overview

### Multi-Level Logging Strategy
```
logs/
├── process-log.json          # Main pipeline status and coordination
├── agents/                   # Individual agent activity logs
│   ├── orchestrator.log      # High-level coordination decisions
│   ├── discovery.log         # Figma analysis and classification
│   ├── element-builder.log   # Simple component batch processing
│   ├── component-builder.log # Complex component individual processing
│   ├── molecule-agent.log    # Molecule + CMS integration
│   ├── organism-agent.log    # Organism + complex CMS
│   └── verification.log      # Quality assurance activities
├── inventory/                # Component completion tracking
│   ├── atoms-status.json     # Phase 1 component status
│   ├── molecules-status.json # Phase 2 component status
│   └── organisms-status.json # Phase 3 component status
└── errors/                   # Error tracking and recovery
    ├── failures.log          # Detailed error information
    └── recovery.log          # Recovery attempt tracking
```

## Process-Level Logging

### Main Process Status (process-log.json)
```json
{
  "sessionId": "figma-process-2024-01-15_14-30-22",
  "startTime": "2024-01-15T14:30:22.123Z",
  "currentPhase": "atoms",
  "phases": {
    "atoms": {
      "status": "in_progress",
      "figmaUrl": "https://figma.com/design/.../atoms",
      "nodeId": "29:1058",
      "startTime": "2024-01-15T14:30:22.123Z",
      "totalComponents": 212,
      "completed": 145,
      "failed": 3,
      "pending": 64,
      "currentlyProcessing": {
        "component": "TextInput",
        "agent": "component-builder",
        "startTime": "2024-01-15T15:15:30.456Z"
      }
    },
    "molecules": {
      "status": "pending",
      "figmaUrl": "https://figma.com/design/.../molecules",
      "nodeId": "29:2000"
    },
    "organisms": {
      "status": "pending",
      "figmaUrl": "https://figma.com/design/.../organisms",
      "nodeId": "29:3000"
    }
  },
  "systemMetrics": {
    "totalProcessingTime": "45m 18s",
    "averageComponentTime": "18.7s",
    "ollamaRequestsCount": 156,
    "cloudAIRequestsCount": 89,
    "estimatedCostSaving": "68%"
  }
}
```

### Progress Calculations
```typescript
class ProgressTracker {
  calculatePhaseProgress(phase: ProcessPhase): PhaseProgress {
    const total = phase.totalComponents;
    const completed = phase.completed;
    const failed = phase.failed;
    const inProgress = phase.currentlyProcessing ? 1 : 0;
    const pending = total - completed - failed - inProgress;

    return {
      percentage: Math.round((completed / total) * 100),
      completed,
      failed,
      pending,
      inProgress,
      total,
      estimatedTimeRemaining: this.calculateETA(phase)
    };
  }

  calculateOverallProgress(): OverallProgress {
    const phases = ['atoms', 'molecules', 'organisms'];
    const phaseWeights = { atoms: 0.4, molecules: 0.35, organisms: 0.25 };

    let weightedProgress = 0;
    phases.forEach(phase => {
      const progress = this.calculatePhaseProgress(this.getPhase(phase));
      weightedProgress += (progress.percentage / 100) * phaseWeights[phase];
    });

    return {
      overallPercentage: Math.round(weightedProgress * 100),
      currentPhase: this.getCurrentPhase(),
      phasesCompleted: this.getCompletedPhases().length,
      estimatedCompletion: this.calculateOverallETA()
    };
  }
}
```

## Component Status Tracking

### Atoms Status Tracking (atoms-status.json)
```json
{
  "sessionId": "figma-process-2024-01-15_14-30-22",
  "phase": "atoms",
  "figmaUrl": "https://figma.com/design/.../atoms",
  "nodeId": "29:1058",
  "lastUpdated": "2024-01-15T15:15:30.456Z",
  "summary": {
    "total": 212,
    "completed": 145,
    "failed": 3,
    "inProgress": 1,
    "pending": 63
  },
  "components": {
    "Button": {
      "id": "button-primary",
      "status": "completed",
      "type": "complex-element",
      "agent": "component-builder",
      "aiModel": "claude-3.5-sonnet",
      "startTime": "2024-01-15T14:32:15.789Z",
      "completedTime": "2024-01-15T14:34:22.123Z",
      "processingTime": "2m 6.334s",
      "figmaNode": "29:1120",
      "variants": {
        "sizes": ["small", "default", "large"],
        "styles": ["primary", "secondary", "destructive", "outline", "ghost"],
        "states": ["normal", "hover", "focus", "active", "disabled"]
      },
      "verification": {
        "status": "passed",
        "visualAccuracy": 98.5,
        "screenshotPath": "logs/screenshots/button-verification.png",
        "issues": []
      },
      "files": {
        "component": "ui/elements/Button.tsx",
        "showcase": "app/geg/page.tsx#Button-section"
      }
    },
    "SearchIcon": {
      "id": "search-icon",
      "status": "completed",
      "type": "simple-element",
      "agent": "element-builder",
      "aiModel": "ollama-llama3.1",
      "batchId": "icons-batch-1",
      "completedTime": "2024-01-15T14:31:05.234Z",
      "processingTime": "0m 12.456s",
      "figmaNode": "29:1201",
      "files": {
        "component": "ui/icons/SearchIcon.tsx",
        "showcase": "app/geg/page.tsx#Icons-section"
      }
    },
    "TextInput": {
      "id": "text-input",
      "status": "in_progress",
      "type": "complex-element",
      "agent": "component-builder",
      "aiModel": "claude-3.5-sonnet",
      "startTime": "2024-01-15T15:15:30.456Z",
      "figmaNode": "29:1125",
      "currentStep": "visual_verification",
      "attempts": 2,
      "issues": [
        "Size variants not visually distinct (small and default too similar)"
      ]
    },
    "EmailIcon": {
      "id": "email-icon",
      "status": "failed",
      "type": "simple-element",
      "agent": "element-builder",
      "aiModel": "ollama-llama3.1",
      "batchId": "icons-batch-2",
      "lastAttempt": "2024-01-15T15:10:15.789Z",
      "attempts": 3,
      "error": "SVG parsing failed: Invalid path data in Figma export",
      "nextRetry": "2024-01-15T15:20:15.789Z",
      "figmaNode": "29:1205"
    }
  },
  "batches": {
    "icons-batch-1": {
      "status": "completed",
      "components": 25,
      "agent": "element-builder",
      "aiModel": "ollama-llama3.1",
      "startTime": "2024-01-15T14:30:30.123Z",
      "completedTime": "2024-01-15T14:31:15.456Z",
      "processingTime": "0m 45.333s",
      "averagePerComponent": "1.8s"
    },
    "complex-components-batch-1": {
      "status": "in_progress",
      "components": ["Button", "TextInput", "Textarea"],
      "agent": "component-builder",
      "aiModel": "claude-3.5-sonnet",
      "startTime": "2024-01-15T14:32:00.000Z",
      "completed": ["Button"],
      "inProgress": ["TextInput"],
      "pending": ["Textarea"]
    }
  }
}
```

## Agent Activity Logging

### Component Builder Agent Log (component-builder.log)
```json
{"timestamp":"2024-01-15T15:15:30.456Z","level":"info","agent":"component-builder","component":"TextInput","step":"started","message":"Beginning complex component processing","data":{"figmaNode":"29:1125","expectedVariants":["default","search"]}}

{"timestamp":"2024-01-15T15:15:32.123Z","level":"info","agent":"component-builder","component":"TextInput","step":"extract_measurements","message":"Extracting precise measurements from Figma","data":{"figmaNode":"29:1125"}}

{"timestamp":"2024-01-15T15:15:45.789Z","level":"info","agent":"component-builder","component":"TextInput","step":"extract_measurements","message":"Successfully extracted component measurements","data":{"variants":{"default":{"width":"300px","height":"40px","padding":"10px 12px","borderRadius":"6px"},"search":{"width":"300px","height":"40px","padding":"10px 12px 10px 40px","borderRadius":"6px"}},"colors":{"background":"#1b1b1b","border":"rgba(255,255,255,0.3)","text":"white"}}}

{"timestamp":"2024-01-15T15:15:46.123Z","level":"info","agent":"component-builder","component":"TextInput","step":"generate_component","message":"Generating React component with TypeScript","data":{"interface":"TextInputProps","variants":["default","search"],"states":["normal","hover","focus","disabled","error"]}}

{"timestamp":"2024-01-15T15:16:15.456Z","level":"info","agent":"component-builder","component":"TextInput","step":"generate_component","message":"Component generated successfully","data":{"filePath":"ui/elements/TextInput.tsx","linesOfCode":134,"interfaceProps":16}}

{"timestamp":"2024-01-15T15:16:16.789Z","level":"info","agent":"component-builder","component":"TextInput","step":"add_to_showcase","message":"Adding component examples to GEG showcase","data":{"showcaseFile":"app/geg/page.tsx","examplesAdded":["basic","variants","states","interactive"]}}

{"timestamp":"2024-01-15T15:16:30.123Z","level":"info","agent":"component-builder","component":"TextInput","step":"visual_verification","message":"Starting visual verification process"}

{"timestamp":"2024-01-15T15:16:45.456Z","level":"warn","agent":"component-builder","component":"TextInput","step":"visual_verification","message":"Visual verification failed - size variants not distinct","data":{"issues":["Size variants 'small' and 'default' appear too similar","Height difference only 2px - needs minimum 8px difference"],"visualAccuracy":85.2,"screenshotPath":"logs/screenshots/textinput-attempt-1.png"}}

{"timestamp":"2024-01-15T15:16:46.123Z","level":"info","agent":"component-builder","component":"TextInput","step":"fix_size_variants","message":"Attempting to fix size variant issues","data":{"changes":["Increase small variant height difference","Adjust padding ratios","Update showcase examples"]}}

{"timestamp":"2024-01-15T15:17:30.789Z","level":"info","agent":"component-builder","component":"TextInput","step":"visual_verification","message":"Re-running visual verification after fixes"}

{"timestamp":"2024-01-15T15:17:45.234Z","level":"warn","agent":"component-builder","component":"TextInput","step":"visual_verification","message":"Visual verification still failing","data":{"issues":["Size variants still not visually distinct enough"],"visualAccuracy":87.1,"attempt":2,"screenshotPath":"logs/screenshots/textinput-attempt-2.png"}}

{"timestamp":"2024-01-15T15:17:46.123Z","level":"info","agent":"component-builder","component":"TextInput","step":"escalate","message":"Escalating to orchestrator for retry decision","data":{"attempts":2,"maxAttempts":3,"issues":"Size variant hierarchy not properly implemented"}}
```

### Element Builder Agent Log (element-builder.log)
```json
{"timestamp":"2024-01-15T14:30:30.123Z","level":"info","agent":"element-builder","batch":"icons-batch-1","step":"started","message":"Starting batch processing of simple icons","data":{"components":25,"aiModel":"ollama-llama3.1","estimatedTime":"45s"}}

{"timestamp":"2024-01-15T14:30:32.456Z","level":"info","agent":"element-builder","batch":"icons-batch-1","step":"extract_batch","message":"Extracting SVG data for icon batch","data":{"figmaNodes":["29:1201","29:1202","29:1203","..."]}}

{"timestamp":"2024-01-15T14:30:45.789Z","level":"info","agent":"element-builder","batch":"icons-batch-1","step":"generate_batch","message":"Generating React icon components","data":{"generatedComponents":25,"namingPattern":"PascalCase + Icon suffix"}}

{"timestamp":"2024-01-15T14:31:00.123Z","level":"info","agent":"element-builder","batch":"icons-batch-1","component":"SearchIcon","step":"generated","message":"Icon component generated","data":{"filePath":"ui/icons/SearchIcon.tsx","svgOptimized":true,"size":"18x18"}}

{"timestamp":"2024-01-15T14:31:15.456Z","level":"info","agent":"element-builder","batch":"icons-batch-1","step":"completed","message":"Batch processing completed successfully","data":{"successfulComponents":25,"failedComponents":0,"processingTime":"45.333s","averagePerComponent":"1.8s"}}
```

## Error and Recovery Logging

### Failure Tracking (failures.log)
```json
{"timestamp":"2024-01-15T15:10:15.789Z","level":"error","agent":"element-builder","component":"EmailIcon","batch":"icons-batch-2","error":"SVG parsing failed","message":"Invalid path data in Figma export","data":{"figmaNode":"29:1205","svgPath":"M12.5 3.5L...","parseError":"Unexpected character 'L' at position 12","attempt":1}}

{"timestamp":"2024-01-15T15:11:15.789Z","level":"error","agent":"element-builder","component":"EmailIcon","batch":"icons-batch-2","error":"SVG parsing failed","message":"Retry attempt failed with same error","data":{"figmaNode":"29:1205","attempt":2,"sameError":true}}

{"timestamp":"2024-01-15T15:12:15.789Z","level":"error","agent":"element-builder","component":"EmailIcon","batch":"icons-batch-2","error":"SVG parsing failed","message":"Final retry attempt failed","data":{"figmaNode":"29:1205","attempt":3,"maxAttemptsReached":true,"escalatingToOrchestrator":true}}

{"timestamp":"2024-01-15T15:17:46.123Z","level":"error","agent":"component-builder","component":"TextInput","error":"Visual verification failed","message":"Unable to achieve visual accuracy requirements","data":{"attempts":2,"maxAttempts":3,"visualAccuracy":87.1,"requiredAccuracy":95,"issues":["Size variants not distinct","Height differences insufficient"]}}
```

### Recovery Attempt Tracking (recovery.log)
```json
{"timestamp":"2024-01-15T15:12:30.123Z","level":"info","recovery":"orchestrator","component":"EmailIcon","action":"manual_intervention_required","message":"Component requires manual SVG cleanup","data":{"error":"SVG parsing failed","attempts":3,"suggestedAction":"Manual Figma export with different settings","assignedTo":"human_reviewer"}}

{"timestamp":"2024-01-15T15:18:00.456Z","level":"info","recovery":"orchestrator","component":"TextInput","action":"retry_with_detailed_analysis","message":"Retrying with enhanced size variant analysis","data":{"previousAttempts":2,"newStrategy":"Extract size measurements from all button variants as reference","assignedAgent":"component-builder","priority":"high"}}

{"timestamp":"2024-01-15T15:25:30.789Z","level":"info","recovery":"orchestrator","component":"TextInput","action":"completed","message":"Component successfully recovered after detailed analysis","data":{"totalAttempts":3,"finalVisualAccuracy":96.8,"processingTime":"10m 15.333s","lessons":["Size variants need minimum 8px height difference","Reference existing button variants for proper sizing"]}}
```

## Progress Reporting and Monitoring

### CLI Progress Commands
```bash
# Real-time progress monitoring
npm run figma:status
# Output:
# 📊 Figma Processor Status
# ========================
#
# Phase 1 (Atoms): 145/212 completed (68%)
# ✅ Completed: 145 components
# ⏳ In Progress: TextInput (component-builder, 2m 15s)
# ❌ Failed: 3 components (EmailIcon, etc.)
# 📝 Pending: 63 components
#
# Overall Progress: 28% complete
# ETA: ~25 minutes remaining
#
# Cost Optimization:
# 🆓 Ollama requests: 156 (62% of total)
# 💰 Cloud AI requests: 89 (38% of total)
# 💡 Estimated savings: 68%

# Detailed component status
npm run figma:status --component=TextInput
# Output:
# 🔍 TextInput Status
# ===================
# Status: In Progress (Attempt 2/3)
# Agent: component-builder
# AI Model: claude-3.5-sonnet
# Processing Time: 2m 15s
# Current Step: visual_verification
#
# Issues:
# - Size variants not visually distinct (small/default too similar)
# - Height difference only 2px (needs minimum 8px)
#
# Screenshots:
# - Attempt 1: logs/screenshots/textinput-attempt-1.png
# - Attempt 2: logs/screenshots/textinput-attempt-2.png

# Failed components summary
npm run figma:failures
# Output:
# ❌ Failed Components (3)
# =======================
# 1. EmailIcon (SVG parsing failed, 3 attempts)
#    - Requires manual intervention
#    - Figma export issue with path data
#
# 2. ComplexButton (Visual verification failed, 2 attempts)
#    - Size variants not distinct enough
#    - Scheduled for retry with enhanced analysis
#
# 3. CustomInput (TypeScript compilation failed, 1 attempt)
#    - Interface conflict with existing types
#    - Queued for retry with namespace resolution
```

### Resume and Recovery Commands
```bash
# Resume interrupted processing
npm run figma:resume
# Automatically detects last state and continues from interruption point

# Retry specific failed component
npm run figma:retry --component="TextInput"
# Forces retry of failed component with fresh analysis

# Reset specific component
npm run figma:reset --component="EmailIcon"
# Clears all attempts and starts fresh

# Skip problematic component (mark as manual)
npm run figma:skip --component="EmailIcon" --reason="SVG export issue"
# Marks component for manual implementation
```

## Logging Configuration

### Log Levels and Filtering
```typescript
interface LoggingConfig {
  levels: {
    error: boolean;    // Always logged
    warn: boolean;     // Important issues
    info: boolean;     // General progress
    debug: boolean;    // Detailed debugging (disabled in production)
  };
  agents: {
    [agentName: string]: {
      enabled: boolean;
      level: LogLevel;
      fileRotation: boolean;
    };
  };
  retention: {
    processLogs: string;     // "30d"
    agentLogs: string;       // "7d"
    errorLogs: string;       // "90d"
    screenshotLogs: string;  // "3d"
  };
}
```

### Performance Monitoring
```typescript
interface SystemMetrics {
  processingMetrics: {
    totalComponents: number;
    componentsPerHour: number;
    averageComponentTime: string;
    batchProcessingEfficiency: number;
  };
  aiUsageMetrics: {
    ollamaRequests: number;
    cloudAIRequests: number;
    costOptimizationRatio: number;
    averageResponseTime: {
      ollama: string;
      cloudAI: string;
    };
  };
  systemResourceMetrics: {
    memoryUsage: string;
    cpuUsage: number;
    diskSpaceUsed: string;
    networkRequests: number;
  };
}
```

**This comprehensive logging system ensures full visibility into the agentic Figma processor, enabling effective monitoring, debugging, and recovery throughout the entire atomic design implementation process.**