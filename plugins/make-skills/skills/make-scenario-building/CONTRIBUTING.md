# Contributing: Adding New Feature Files

This document describes how to add new core concept or feature documentation files to the `make-scenario-building` skill.

## File Location

All feature files live in this directory: `skills/make-scenario-building/`

## Template

Every feature file MUST follow this structure:

```markdown
---
name: <feature-name>
description: <one-line description of the feature in Make context>
---

# <Feature Name>

## What It Is
<Brief explanation of the concept>

## When to Use It
<Conditions/scenarios where this feature is needed>

## How It Works in Make
<Mechanics: which modules are involved, how they connect, which MCP tools to use for discovery>

## Flowchart Notation
<How to represent this feature in the Phase 1 flowchart notation used in SKILL.md>

## Example
<Concrete example of a scenario using this feature>

## Gotchas
<Common pitfalls or non-obvious behaviors>
```

## Steps to Add a New Feature

1. Create a new `.md` file in this directory using the template above.
2. Use kebab-case for the filename (e.g., `error-handling.md`, `ai-agents.md`).
3. Fill in all sections. If a section doesn't apply, write "N/A" rather than omitting it.
4. Add a reference to the new file in `SKILL.md` under the **Core Concepts** section.
5. If the feature interacts closely with another feature (e.g., filtering + routing), add cross-references in both files.

## Exemptions

`blueprint-construction.md` is a technical reference (JSON structure, field specs, deployment checklist) rather than a feature doc. It uses YAML frontmatter for discoverability but does not follow the standard section headings above.

## Naming Conventions

- **Core concepts** (e.g., bundles) describe foundational data model elements.
- **Features** (e.g., iterations, routing) describe scenario-building capabilities with specific modules.
- Use the same name in the filename, the `name` frontmatter field, and the `# Heading`.

## Cross-References

When a feature depends on or relates to another, link to it explicitly. Example:
> See also: [Iterations](./iterations.md) for the inverse operation.
