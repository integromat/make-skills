---
name: ai-agents
description: Placing a Make AI Agent module in a scenario and giving it tools as `tool` arms — the agent's config, AI-decided fields inside a tool, scenario tools, and when an agent is the wrong choice.
---

# AI agents in a scenario

## When an agent, and when not

| The step needs | Use |
|---|---|
| The same output for the same input — sync, transform, notify | ordinary modules, filters, if-else |
| AI-generated content with fixed parameters — summarize, translate, classify into known labels | an AI provider's own module (OpenAI, Anthropic, Make AI Tools) |
| Judgment over which of several tools to use, how often, with what arguments | `ai-local-agent:RunLocalAIAgent` |

An agent is non-deterministic, slower and costlier than the alternatives; choose tasks you would trust an
intern with. It only knows its training data — live or account-specific information (weather, inventory, a
CRM record) reaches it **only through a tool**; without one it guesses or refuses.

## The agent module

`ai-local-agent:RunLocalAIAgent` (confirm the version with `module_spec`). Its connection is the AI provider
(`parameters.makeConnectionId` — Make AI Provider, OpenAI, Anthropic, Gemini, and others; reuse from
`connection.existing`). The provider is locked once the agent exists. `config.mapper`:

- `message` (required) — the per-run input, usually mapped from upstream (`{{1.text}}`).
- `systemPrompt` — role, goals, rules, steps. The single most important field.
- `defaultModel` — dynamic: resolve with `module_field_resolve` rather than typing a model id.
- `threadId` — a stable conversation id (a chat thread id, a ticket id) gives the agent memory across runs;
  leave it empty for stateless runs.
- `files`, `modelConfig` (`recursionLimit` steps per call, `tokenLimit`), `timeout`, `outputType`
  (`"text"` or a structured schema) — only when the user needs them.

The agent emits **one output bundle** per run regardless of how many tools it called. Knowledge files and
MCP-server tools are configured in the Make UI, not here.

## Tools are arms

Each tool is a nested flow hanging off the agent: its first module carries
`parent: {moduleId: <agent id>, kind: "tool", index, label, description}`. `label` is the tool's **name**
(required — it is what the agent calls), `description` is what tells the agent when to use it; write both
the way you would for any tool-calling model.

Inside the tool's flow, a field the agent should fill at run time maps to the **agent's** id:

```json
{ "id": 5, "module": "weather:ActionGetCurrentWeather", "version": 1,
  "parent": { "moduleId": 2, "kind": "tool", "index": 0, "label": "Get current weather",
              "description": "Returns current weather for a city. Use when the user asks about weather." },
  "config": {
    "mapper": { "type": "name", "city": "{{2.city}}" },
    "restore": { "expect": { "city": { "extra": { "aiHelp": "City name, e.g. London, UK.",
                                                   "aiInstruction": "Take the city from the user's message." } } } }
  } }
```

- `"type": "name"` is **fixed** — set by you. `"city": "{{2.city}}"` is **AI-decided** — the agent (id 2)
  supplies it. Give every AI-decided field an `aiHelp` (format hint) and, where the choice is not obvious, an
  `aiInstruction` under `config.restore.expect.<field>.extra`; without them the agent has no guidance.
- Tool modules that authenticate use their own connection parameter as usual.
- One module per tool is the simple case. For multi-step tools, make the tool arm a
  `scenario-service:CallSubscenario` to an on-demand scenario with declared inputs and outputs (see
  [Subscenarios](./subscenarios.md)) — the declared interface becomes the tool's argument and result shape.
- Editing a tool's name or description later is `scenario_patch` → `arm_set` with `kind: "tool"`.

## Replying to the caller

A webhook-triggered agent scenario whose caller expects the answer in the HTTP response must end with
`gateway:WebhookRespond` mapping the agent's output — `ReturnData` never reaches a webhook caller.

The complete call is in [ai-agent-with-tool.json](../examples/ai-agent-with-tool.json).
