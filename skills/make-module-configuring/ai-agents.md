---
name: ai-agents
description: Configuring ai-local-agent:RunLocalAIAgent modules — tools array, AI-decided field mapping, restore object with aiHelp/aiInstruction, connection setup.
---

# AI Agent Module Configuration

Module: `ai-local-agent:RunLocalAIAgent`, version `0`.

## Additional Agent Capabilities

Beyond the mapper fields below, AI agents support:

- **Context/Knowledge:** Upload external knowledge files (TXT, PDF, DOCX, CSV, MD, JSON) to enhance the agent. Limits: 20MB per file, 50 files per team (250 Enterprise), 100 files per org (500 Enterprise), 20 files per agent. Files are chunked, vectorized, and stored in Make's RAG vector database.
- **MCP Integration:** Agents can connect to MCP servers for additional tools via a dedicated MCP section in configuration.
- **Output files:** Agents can generate output files in PDF, DOCX, TXT, and CSV formats.

These are configured in the Make UI, not via blueprint mapper fields.

## Agent Module Mapper Fields

| Field | Type | Description |
|---|---|---|
| `defaultModel` | select | LLM model to use (e.g., `"gpt-5.4"`). Resolve options via RPC. |
| `systemPrompt` | text | Agent instructions — role, goals, constraints, step-by-step behavior. |
| `message` | text | Input to the agent (typically mapped from upstream module output). Required. |
| `files` | array | Input files — each with `fileName` (filename) and `data` (buffer). Supported input formats: JPG, PNG, GIF, PDF. |
| `threadId` | text | Conversation ID for multi-turn interactions. |
| `modelConfig` | collection | Model settings: `tokenLimit`, `recursionLimit` (steps per call), `iterationsFromHistoryCount` (max conversation history). |
| `timeout` | number | Step timeout in seconds (120–600). |
| `outputType` | select | Response format: `"text"` or `"make-schema"`. |

## Connection

Supported AI providers: OpenAI, Gemini, Anthropic Claude, and Make AI Provider (requires no external provider account). AI agents are available on all plans using Make AI Provider; custom provider connections require paid plans.

The agent module uses `makeConnectionId` in **parameters** (not `__IMTCONN__`). This is the AI provider connection.

```json
"parameters": {
    "makeConnectionId": 14613
},
"metadata": {
    "restore": {
        "parameters": {
            "makeConnectionId": {
                "label": "Maiak Token",
                "data": {
                    "scoped": "true",
                    "connection": "openai-gpt-3"
                }
            }
        }
    }
}
```

## Tools Array

Tools live in a top-level `tools` property on the agent module object — **not** in `parameters` or `mapper`. Each tool is an object with:

- `name` — tool display name
- `description` — what the tool does (the AI reads this to decide when to call it)
- `flow` — array of modules that execute when the tool is called

```json
{
    "id": 2,
    "module": "ai-local-agent:RunLocalAIAgent",
    "parameters": { ... },
    "mapper": { ... },
    "tools": [
        {
            "name": "Get current weather",
            "description": "Returns current weather information for a specified location.",
            "flow": [ ... ]
        }
    ]
}
```

## Fixed vs AI-Decided Fields in Tool Modules

When configuring a module inside a tool's `flow`, some fields are **fixed** (hardcoded) and others are **AI-decided** (the agent fills them at runtime).

### Fixed fields

Set directly in the mapper to a constant value or expression. See [Mapping](./mapping.md) for details:

```json
"mapper": {
    "type": "name"
}
```

### AI-decided fields

Use the pattern `{{agentModuleId.fieldName}}`:

```json
"mapper": {
    "city": "{{2.city}}"
}
```

Where:
- `agentModuleId` = the `id` of the AI agent module in the scenario flow (e.g., `2`)
- `fieldName` = the **exact `name`** from the module's `expect` schema

## The `restore.expect` Object with `extra`

Every AI-decided field **should** have guidance in `metadata.restore.expect.<fieldName>.extra`. Without it, the agent has no hints about format or constraints.

| Property | Purpose |
|---|---|
| `aiHelp` | Short hint about expected format/values (e.g., `"Enter e.g. London, UK."`) |
| `aiInstruction` | Detailed instruction guiding the AI's decision for this field |

Full path: `metadata.restore.expect.<fieldName>.extra.aiHelp` / `.aiInstruction`

```json
"metadata": {
    "restore": {
        "expect": {
            "city": {
                "extra": {
                    "aiHelp": "Enter e.g. London, UK.",
                    "aiInstruction": "Use the city name from the user's input message."
                }
            }
        }
    }
}
```

### Other `restore.expect` Properties

- **`label`** — human-readable label for select/dropdown fields (e.g., `"label": "cities"` for a `type` field with value `"name"`)
- **`mode: "chose"`** — marks optional collection/array fields that were explicitly shown but left empty (e.g., `"files": { "mode": "chose" }`)

## Tool Module Connections

Tool modules that need connections use `__IMTCONN__` in `parameters` (same as normal modules), with the restore object for label/data:

```json
{
    "id": 4,
    "module": "discord:createMessage",
    "parameters": {
        "__IMTCONN__": 11867
    },
    "metadata": {
        "restore": {
            "parameters": {
                "__IMTCONN__": {
                    "label": "DomiZ's Discord (Make (team1278341651986911253))",
                    "data": {
                        "scoped": "true",
                        "connection": "discord"
                    }
                }
            }
        }
    }
}
```

## Annotated Example: Weather Tool

This tool has one fixed field (`type`) and one AI-decided field (`city`):

```json
{
    "name": "Get current weather",
    "description": "Returns current weather information for a specified location.",
    "flow": [
        {
            "id": 3,
            "module": "weather:ActionGetCurrentWeather",
            "version": 1,
            "parameters": {},
            "mapper": {
                "type": "name",
                "city": "{{2.city}}"
            },
            "metadata": {
                "restore": {
                    "expect": {
                        "type": {
                            "label": "cities"
                        },
                        "city": {
                            "extra": {
                                "aiHelp": "Enter e.g. London, UK."
                            }
                        }
                    }
                },
                "expect": [
                    {
                        "name": "type",
                        "type": "select",
                        "label": "I want to enter a location by",
                        "required": true,
                        "validate": {
                            "enum": ["name", "coords"]
                        }
                    },
                    {
                        "name": "city",
                        "type": "text",
                        "label": "City",
                        "required": true
                    }
                ]
            }
        }
    ]
}
```

**Breakdown:**
- `"type": "name"` — **fixed**: always look up by city name. `restore.expect.type.label` stores the human label `"cities"`.
- `"city": "{{2.city}}"` — **AI-decided**: agent module `2` fills this at runtime. `restore.expect.city.extra.aiHelp` tells the AI the expected format.

## Tool Discovery

Use `app_modules_list` with `usage: "tool"` to find modules compatible as agent tools. Not all modules support tool usage.

## Gotchas

- **`makeConnectionId` not `__IMTCONN__`** for the agent module itself. Tool modules inside `flow` use `__IMTCONN__` as normal.
- **Every AI-decided field should have `restore.expect.<field>.extra.aiHelp`** — without it the agent has no guidance on format/constraints.
- **`restore.expect.<field>.mode: "chose"`** marks optional collection/array fields that were explicitly shown but left empty.
- **`restore.expect.<field>.label`** stores the human-readable label for select/dropdown fields.
- **Tool discovery**: pass `usage: "tool"` to `app_modules_list` to filter for tool-compatible modules.
- **AI provider is locked at creation.** Cannot be changed after the agent is created — must create a new agent to switch providers.
- **Deleting an agent breaks dependent modules.** All `Run an agent` modules referencing the deleted agent will fail. Check active scenarios before deleting.

## Official Documentation

- [Make AI Agents (New)](https://help.make.com/make-ai-agents-new)
- [Introduction to AI Agents](https://help.make.com/introduction-to-make-ai-agents-new)
- [Create Your First AI Agent](https://help.make.com/create-your-first-ai-agent)
- [Sales Outreach AI Agent Use Case](https://help.make.com/sales-outreach-ai-agent-use-case)
- [Create AI Agents for Different Triggers](https://help.make.com/create-ai-agents-for-different-triggers)
- [Knowledge](https://help.make.com/knowledge)
- [Make AI Agents (New) App](https://help.make.com/make-ai-agents-new-app)
- [Make AI Agents (New) Best Practices](https://help.make.com/make-ai-agents-new-best-practices)



## Full Blueprint Example

Complete blueprint with a webhook trigger, AI agent with two tools (weather + Discord), and a webhook response. The Discord tool's module spec is trimmed to essential fields — in practice, retrieve the full spec via `app-module_get`.

See [examples/ai-agent-full-blueprint.json](./examples/ai-agent-full-blueprint.json) for the complete blueprint.