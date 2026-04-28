---
name: general-principles
description: Step-by-step workflow for configuring any Make module — reading the interface (instructions format), understanding parameters vs mapper, resolving components, running RPCs, validating configuration.
---

# General Principles of Module Configuration

## What It Is

Module configuration is the process of filling in a module's parameters and mapper so it performs the desired operation. Every module has a defined interface — a set of inputs with types, constraints, and dependencies. Configuring a module means providing the right values in the right domain (parameters or mapper).

## The Two Configuration Domains

Understanding the distinction between **parameters** and **mapper** is fundamental. Placing a value in the wrong domain causes validation errors.

### Parameters (Static Configuration)

Parameters hold values that are fixed at design time and cannot change during scenario execution:

- **Component references** — connection IDs, key IDs, webhook IDs, data store IDs, data structure IDs
- **Mode selectors and dropdowns** — operation type, HTTP method, output format
- **Resource identifiers** — selected from RPC-loaded lists (spreadsheet ID, folder ID, channel ID)
- **Fixed settings** — batch size, timeout, encoding

Parameters are baked into the module when the scenario is saved. They do not support IML expressions.

### Mapper (Dynamic Configuration)

The mapper holds values that are evaluated at runtime using IML (Inline Mapping Language):

- **References to upstream module outputs** — `{{1.email}}`, `{{3.items[1].name}}`
- **Transformations** — `{{upper(1.name)}}`, `{{formatDate(1.created_at; "YYYY-MM-DD")}}`
- **Conditional logic** — `{{if(1.status = "active"; "Yes"; "No")}}`
- **Literal values that could also be mapped** — static text in a mapper field is valid, but IML expressions are the primary use case

The mapper is where data flows between modules. See [IML Expressions](./iml-expressions.md) for the full expression language and [Mapping](./mapping.md) for mapping patterns.

**Common mistake:** Putting static dropdown selections in the mapper instead of parameters → causes "Field mandatory" + "Unknown field" errors.

## The Configuration Workflow

Follow this sequence for every module:

### Phase 1: Read the Module Interface

Call `app-module_get` with the **instructions** output format. Pass:
- **appName** — exact app name
- **appVersion** — exact version number
- **moduleName** — exact module slug

The instructions format returns everything needed to configure the module:
- **Input schema** — all parameters and mapper fields with types, required/optional status, allowed values
- **Output schema** — what data the module produces (needed for downstream mapping)
- **Component instructions** — which connections, keys, webhooks, data stores, or data structures the module needs
- **RPC instructions** — which RPCs to call to load dynamic field options, and what data to pass

Study the interface before setting any values. Never guess parameter names or structures.

### Phase 2: Resolve Components (Authentication & Resources)

Before filling parameters, ensure all required components exist. The module interface specifies which components are needed.

**Priority order:** Data structures first (other components may depend on them) → webhooks → connections → keys → data stores.

**Two creation paths:**

| Component | Creation method | Why |
|-----------|----------------|-----|
| **Connections** | Credential requests | Cannot create directly — involves OAuth flows or sensitive credential entry that the user must complete |
| **Keys** | Credential requests | Same reason — cryptographic material must be provided by the user |
| **Webhooks** | Direct MCP creation | Can be created programmatically via `hooks_create` |
| **Data stores** | Direct MCP creation | Can be created programmatically via `data-stores_create` (requires data structure ID) |
| **Data structures** | Direct MCP creation | Can be created programmatically via `data-structures_create` |

For connections and keys: create a credential request, provide the user with the authorization URL, wait for them to complete the flow, then retrieve the resulting component ID.

Store all component IDs — they go into the **parameters** domain.

### Phase 3: Load Dynamic Field Options (RPCs)

Some parameters have values that must be fetched dynamically — e.g., a list of Google spreadsheets, Slack channels, or database tables. The module interface (from Phase 1) specifies which RPCs to call.

Call `rpc_execute` with:
- **appName** and **appVersion** — same as the module
- **rpcName** — the exact RPC name from the interface instructions
- **data** — context object; at minimum include the connection or key ID (e.g., `{"__IMTCONN__": <id>}`). Never omit the data parameter — it causes schema validation errors.

RPC responses return a list of options. If the list is very large (500+ items), ask the user for a specific name or search keywords rather than presenting the full list.

If an RPC fails with a 403 or permission error, the connection may lack required OAuth scopes. The user needs to create a new connection with the correct permissions.

### Phase 4: Fill Parameters and Mapper

Work through the fields systematically:

1. **Parameters first:** Set component references (connection ID, webhook ID, etc.), dropdown selections, and RPC-selected resource IDs.
2. **Mapper second:** Set dynamic values using IML expressions referencing upstream module outputs. Use literal values only where no upstream data is needed.

The module interface schema tells which fields belong in parameters vs mapper. Follow it exactly.

### Phase 5: Validate

Call `validate_module_configuration` with the assembled parameters and mapper. **Always validate — no exceptions.** This catches:
- Missing required fields
- Type mismatches
- Invalid select/dropdown values
- Structural errors in nested collections/arrays
- Incorrect parameter placement (parameters vs mapper)

Fix all reported errors before proceeding to the next module.

**Example — catching a missing `valueInputOption` in Google Sheets `addRow`:**

If `validate_module_configuration` is called for `google-sheets:addRow` with a mapper that omits `valueInputOption`:

```
// Incomplete mapper — missing valueInputOption
{
  "appName": "google-sheets",
  "appVersion": 2,
  "moduleName": "addRow",
  "parameters": { "__IMTCONN__": 12345, "mode": "select", "spreadsheetId": "/1abc..." },
  "mapper": { "values": { "0": "{{1.name}}" } }
}
```

Validation returns an error like `"valueInputOption" is required`. Corrected mapper:

```json
"mapper": {
  "valueInputOption": "USER_ENTERED",
  "values": { "0": "{{1.name}}" }
}
```

Re-validate after fixing — this error would otherwise appear only at runtime as `400: INVALID_ARGUMENT`.

## Configuration Order Across Modules

Configure modules **left to right** (upstream to downstream) so that output schemas are available for downstream mapping.

**Exception — Array Aggregator:** The built-in array aggregator aggregates into the data structure of the module *after* it. Workflow:
1. Configure the target module (after the aggregator) to the extent possible without aggregated data
2. Configure the aggregator (which references the target's structure)
3. Return to finish the target module's mapping

## Parameter Types Reference


| Type | Description | Example value |
|------|-------------|---------------|
| **text** | Free-form string | `"Hello world"` |
| **number** | Numeric value (integer or float) | `42`, `3.14` |
| **integer** | Whole number only | `10` |
| **uinteger** | Unsigned (non-negative) integer | `0`, `100` |
| **boolean** | True or false | `true` |
| **date** | ISO 8601 date/datetime | `"2026-03-17T10:00:00Z"` |
| **select** | One value from a fixed set | `"GET"` from `["GET","POST","PUT","DELETE"]` |
| **collection** | Nested object with named fields | `{"name": "John", "age": 30}` |
| **array** | Ordered list of items | `[{"id": 1}, {"id": 2}]` |
| **buffer** | Binary/file data | File reference from upstream module |
| **url** | URL string | `"https://example.com"` |
| **email** | Email address | `"user@example.com"` |
| **uuid** | UUID string | `"550e8400-e29b-41d4-a716-446655440000"` |

## Nested Parameters (Collections and Arrays)

Many modules have nested parameter structures:

- **Collection parameters** contain sub-parameters, each with its own type and required/optional status. Treat them like a mini-module interface.
- **Array parameters** contain a template item (usually a collection). Each array element follows the same structure.
- Nesting can be multiple levels deep. Walk the tree carefully.

**Example:** An HTTP module's `headers` parameter might be an array of collections, where each collection has `name` (text, required) and `value` (text, required).

## Gotchas

- **Always use instructions format.** Calling `app-module_get` without requesting the instructions format gives less useful output. The instructions format includes component requirements and RPC instructions.
- **Do not guess parameter names or values.** Parameter names are exact slugs, not human-readable labels. Always retrieve the interface first.
- **Select parameters are strict.** Passing a value not in the allowed set causes a validation error. Check the spec for allowed values.
- **Empty vs null vs missing.** Some modules treat these differently. An empty string `""` is not the same as omitting a parameter. When in doubt, omit optional parameters rather than sending empty values.
- **Dynamic/conditional parameters.** Some modules have parameters that change based on other parameter values (e.g., selecting an action type reveals action-specific fields). The module interface describes these dependencies — set the controlling parameter first.
- **Module version matters.** Different app versions may have different parameter sets. Always use the version from `app-modules_list`.
- **Never omit RPC data parameter.** Even if only the connection ID is needed, always pass it. Omitting causes schema validation errors.
- **Always resolve targets via RPC.** When a module targets a specific user, channel, folder, or resource, resolve the target ID by calling the module's RPC — do not use connection metadata. The `userId` in OAuth connection metadata identifies the authenticated bot or app, **not** the intended recipient. Examples:
  - **Slack DM:** Use the `IMChannels` RPC to find the target user's DM channel ID. Do not use the connection's `userId` (that's the bot).
  - **Google Sheets:** Use the spreadsheets RPC to resolve a spreadsheet ID by name.
  - **Any "channel", "recipient", "user", or "folder" field:** Always resolve via the module's RPC, never hardcode or pull from connection metadata.
- **Boolean select gotcha.** Some parameters look like on/off dropdowns but use actual boolean `const` values in their schema (`{"const": true}` / `{"const": false}`), not strings. If you pass `"true"` or `"false"` (strings) where the schema requires `true` or `false` (booleans), Make will silently accept the value but behave incorrectly. Always inspect the `oneOf` schema from `app-module_get` to confirm the expected type before setting the value.

## Connection Restore Metadata

When a blueprint sets a connection parameter (e.g., `"account": 13911586`), Make's UI will show it as **"not selected"** unless the module's `metadata.restore.parameters` includes the connection's label and `accountName`. This is a display-only issue — the connection ID is correct — but it looks broken to users and can cause confusion.

**Required pattern for every connection-bearing module:**

```json
"metadata": {
  "restore": {
    "parameters": {
      "<connectionFieldName>": {
        "label": "<connection name from connections_list>",
        "data": {
          "scoped": "true",
          "connection": "<accountName from connections_list>"
        }
      }
    }
  }
}
```

**How to fill it:**

1. Call `connections_list` before assembling the module's metadata.
2. Find the connection the user selected.
3. Use `name` → `label`, `accountName` → `data.connection`.

**Example** (Microsoft SMTP/IMAP email connection):

```json
"metadata": {
  "restore": {
    "parameters": {
      "account": {
        "label": "Hotmail - Send Email",
        "data": {
          "scoped": "true",
          "connection": "microsoft-smtp-imap"
        }
      }
    }
  }
}
```

**Rule:** For every module that has a connection parameter (`account`, `__IMTCONN__`, `makeConnectionId`, or similar), always include the corresponding restore metadata. Missing restore metadata causes the UI to show the connection as unset even when the scenario runs correctly.

## Official Documentation

- [Module Settings](https://help.make.com/module-settings)

See also: [Mapping](./mapping.md) for connecting data between modules, [IML Expressions](./iml-expressions.md) for the formula language, [Connections](./connections.md) for the credential request flow, [Filtering](./filtering.md) for filter conditions on modules.
