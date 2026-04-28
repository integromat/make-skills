---
name: ai-agents
description: Make AI Agents (New) — non-deterministic modules with tool-calling, knowledge, and multi-tool-type capabilities.
---

# AI Agents

## What It Is

Make AI Agents (New) are modules that sit within a Make scenario and provide non-deterministic, AI-driven logic. Unlike Router or If-Else (which use deterministic conditions), an AI agent module decides on its own which tools to call, how many times, and in what order — based on instructions and the incoming data.

## When to Use It

Use this decision framework:

| Approach | When to use |
|---|---|
| **Standard scenario** (deterministic) | Predefined logic, same output for same input. E.g., syncing data, processing orders. |
| **Scenario with AI app** (structured AI) | Predefined logic + AI-generated content with specific parameters. E.g., translating, summarizing. |
| **Scenario with AI agent** (flexible AI) | Flexible reasoning, judgment calls, variable inputs/outputs. E.g., categorizing tickets, screening candidates. |

Since AI agents produce unpredictable results, choose tasks you'd trust an intern to handle. Avoid sensitive data, high-stakes decisions, or strict legal requirements.

## How It Works in Make

1. Place a **Make AI Agents (New)** module in the scenario flow.
2. **Configure an AI provider** — connects the agent to an LLM (OpenAI, Anthropic, Gemini, or Make's built-in AI Provider). Free plan users must select Make's AI Provider; paid users can choose any supported provider.
3. **Define instructions** — the agent's role, goals, constraints, and step-by-step behavior.
4. **Add Knowledge** (optional) — files stored in the agent's long-term memory (FAQs, brand guidelines, company policies) that help it tailor responses. Knowledge files are stored in a RAG vector database, with relevant chunks retrieved based on requests.
5. **Equip it with tools** — the agent decides which tools to call at runtime.
6. At runtime, the agent receives the incoming bundle (input), processes it according to instructions, and decides which tools to call. It outputs a **single bundle** representing its result.


### Tool Types

AI agents support three types of tools:

| Tool type | Description | When to use |
|---|---|---|
| **Module tools** | A single Make module attached as a tool. A scenario is auto-generated with all necessary inputs, outputs, and utility modules (may include 2-3 utility modules for I/O handling and aggregation for search-type modules). | Simple, quick — one module = one tool |
| **Scenario tools** | An entire Make scenario exposed as a tool. You define scenario inputs/outputs manually. Must end with "Return output" module to return data. Must be toggled "On demand" to activate. | Complex workflows needing multiple steps, filters, or specific I/O |
| **MCP tools** | Tools from an MCP server connected to the agent. Requires creating an MCP server connection with authentication. | External tool capabilities beyond Make's built-in modules |

### Tool Discovery

When listing modules to use as agent tools, pass `usage: "tool"` to the `app_modules_list` MCP tool. This filters to only modules that are compatible as agent tools.

## Flowchart Notation

```
Trigger: Webhook → AI Agent [tools: JIRA - List Tasks, JIRA - Create Task, JIRA - Update Task, Slack - Send Message]
  (system prompt: "Triage incoming support requests, create or update JIRA tasks, notify on Slack")
→ Google Sheets - Log Result
```

## Example

An agent that handles incoming customer inquiries by checking existing tickets, creating new ones if needed, and notifying the team:

```
Email - Watch Inbox → AI Agent [tools: Zendesk - Search Tickets, Zendesk - Create Ticket, Zendesk - Update Ticket, Slack - Post Message]
  (system prompt: "For each email, check if a ticket exists. If yes, update it. If no, create one. Notify #support on Slack either way.")
→ Email - Send Auto-Reply
```

## Real-Time Data Requires Tools

An AI agent **only knows what its training data contains**. If the scenario requires live data — current weather, stock prices, news headlines, live inventory — the agent **must have a tool module configured** that fetches that data at runtime.

Without a tool, the agent will either:
- Hallucinate plausible-sounding but stale or fabricated data, or
- Correctly refuse and report it cannot access live information.

**Rule:** Any time the agent needs data that changes over time or varies by user input (location, date, ticker symbol), attach the appropriate tool module. The agent will call it at runtime with the right arguments.

Example: A weather forecast agent needs a `weather:ActionGetDailyForecast` (or `weather:ActionGetCurrentWeather`) tool attached — without it, it cannot return real forecasts.

## Known Model IDs

The `RpcGetModels` RPC often fails in MCP context due to org-level restrictions. When it does, use these known model IDs directly in `defaultModel`:

### Google Gemini (`gemini-ai-*` connection)

| Model ID | Notes |
|---|---|
| `gemini-2.5-pro-preview-03-25` | Latest Gemini 2.5 Pro preview |
| `gemini-2.0-flash` | Fast, efficient Gemini 2.0 |
| `gemini-1.5-pro` | Stable Gemini 1.5 Pro |
| `gemini-1.5-flash` | Fast Gemini 1.5 |

### OpenAI (`openai-gpt-3` connection)

| Model ID | Notes |
|---|---|
| `gpt-4o` | Latest GPT-4o |
| `gpt-4o-mini` | Smaller, faster GPT-4o |
| `gpt-4-turbo` | GPT-4 Turbo |

### Anthropic (`anthropic-claude` connection)

| Model ID | Notes |
|---|---|
| `claude-opus-4-5` | Most capable Claude |
| `claude-sonnet-4-5` | Balanced Claude |
| `claude-haiku-4-5` | Fast, lightweight Claude |

If `RpcGetModels` succeeds, prefer the returned list. If it fails, pick from the known IDs above based on the user's chosen provider.

## Gotchas

- **Non-deterministic.** The agent may behave differently for similar inputs. If you need predictable, repeatable logic, use Router or If-Else instead.
- **Module tools = one module each.** For multi-step tool logic, use Scenario tools instead.
- **Single bundle output.** Regardless of how many tools the agent calls, it produces one output bundle.
- **Cost and latency.** AI agent modules call an LLM and potentially multiple tools. They are slower and more expensive than deterministic modules.
- **Knowledge vs Input.** Knowledge is persistent reference material (uploaded files). Input is per-execution data from the incoming bundle. Don't confuse the two. Text file input consumes significant memory; knowledge files are preferable for large documents.
- **Live data needs tools.** An agent without tools only has training data. If the task requires real-time or user-specific data, tools are mandatory — not optional.
- **Knowledge file formats.** Supported formats for knowledge upload: TXT, PDF, DOCX, CSV, MD, JSON. Token consumption varies by file size during vector conversion.
- **Conversation memory.** Leaving Conversation ID blank creates a new agent identity with each run — the agent has no memory of previous interactions.
- **AI provider is locked at creation.** Once an agent is created with a provider (OpenAI, Anthropic, Gemini, Make AI Provider), it cannot be changed. To switch providers, create a new agent.
- **Agent deletion is permanent.** Deleting an agent breaks all `Run an agent` modules that reference it. Verify no active scenarios depend on the agent before deleting.
- **Agents are team-shared.** Like connections, agents are visible to all team members. For a private agent, use a team where you're the only member.

## Official Documentation

- [Make AI Agents (New)](https://help.make.com/make-ai-agents-new)
- [Introduction to AI Agents](https://help.make.com/introduction-to-make-ai-agents-new)
- [Create Your First AI Agent](https://help.make.com/create-your-first-ai-agent)
- [Sales Outreach AI Agent Use Case](https://help.make.com/sales-outreach-ai-agent-use-case)
- [Create AI Agents for Different Triggers](https://help.make.com/create-ai-agents-for-different-triggers)
- [Knowledge](https://help.make.com/knowledge)
- [Make AI Agents (New) App](https://help.make.com/make-ai-agents-new-app)
- [Make AI Agents (New) Best Practices](https://help.make.com/make-ai-agents-new-best-practices)


See also: [Routing](./routing.md) and [Branching](./branching.md) for deterministic alternatives.

For detailed module configuration (AI-decided fields, restore objects, tool setup, blueprint structure), see [AI Agents Configuration](../make-module-configuring/ai-agents.md).