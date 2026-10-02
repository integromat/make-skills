---
description: Look up Make product or developer documentation
argument-hint: "[topic]"
allowed-tools: WebFetch(domain:help.make.com), WebFetch(domain:developers.make.com)
---

Look up $ARGUMENTS in the Make documentation.

Fetch from `https://help.make.com` for product and scenario topics, and `https://developers.make.com` for app, SDK, and API topics. Prefer the Make MCP tools (`app_find`, `module_spec`) when the question is about a specific app or module — reach for the docs only when the tools do not cover it.

Answer with the relevant excerpt plus the source URL.
