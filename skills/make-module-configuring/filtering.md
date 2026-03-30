---
name: filtering
description: Configuring filters on Make modules — filter placement, condition structure, logical grouping (AND/OR), operator reference by type (text, number, date, time, array, boolean, basic), and IML in filter values.
---

# Filtering

## What It Is

A filter is a condition gate on a module that controls whether downstream processing occurs for a given bundle. Filters evaluate conditions against incoming data and either pass or block the bundle.

## Placement Rules

- Filters are configured on the **target (downstream) module**, not on the source.
- **Never place a filter on the trigger module** — the trigger always fires.
- A filter blocks the entire downstream path from that module, not just the filtered module itself.
- In router patterns, filters go on the **first module inside each route**, not on the router itself.

## Filter Structure

Filters use a JSON structure with a name and a nested conditions array:

```json
{
  "filter": {
    "name": "Only active users",
    "conditions": [[
      {"a": "{{1.status}}", "o": "text:equal", "b": "active"}
    ]]
  }
}
```

Each condition has three parts:
- **`a`** — the left operand (typically an IML expression referencing upstream output)
- **`o`** — the operator (from the operator reference below)
- **`b`** — the right operand (comparison value, can also be an IML expression)

## Logical Grouping

Conditions are grouped using nested arrays:

### AND (all conditions must match)

Put conditions in the **same inner array**:

```json
"conditions": [[
  {"a": "{{1.status}}", "o": "text:equal", "b": "active"},
  {"a": "{{1.age}}", "o": "number:greaterorequal", "b": "18"}
]]
```

### OR (any group must match)

Put conditions in **separate inner arrays**:

```json
"conditions": [
  [{"a": "{{1.status}}", "o": "text:equal", "b": "active"}],
  [{"a": "{{1.role}}", "o": "text:equal", "b": "admin"}]
]
```

### Complex (AND + OR)

`(A AND B) OR C`:

```json
"conditions": [
  [
    {"a": "{{1.status}}", "o": "text:equal", "b": "active"},
    {"a": "{{1.verified}}", "o": "boolean:equal", "b": "true"}
  ],
  [{"a": "{{1.role}}", "o": "text:equal", "b": "admin"}]
]
```

## Operator Reference

### Basic Operators

| Operator | Label |
|----------|-------|
| `exist` | Exists |
| `notexist` | Does not exist |

### Boolean Operators

| Operator | Label |
|----------|-------|
| `boolean:equal` | Equal to |
| `boolean:notequal` | Not equal to |

### Text Operators

| Operator | Label |
|----------|-------|
| `text:equal` | Equal to |
| `text:notequal` | Not equal to |
| `text:contain` | Contains |
| `text:notcontain` | Does not contain |
| `text:startwith` | Starts with |
| `text:notstartwith` | Does not start with |
| `text:endwith` | Ends with |
| `text:notendwith` | Does not end with |
| `text:pattern` | Matches pattern (regex) |
| `text:notpattern` | Does not match pattern |

All text operators have case-insensitive variants by appending `:ci` (e.g., `text:equal:ci`, `text:contain:ci`).

### Numeric Operators

| Operator | Label |
|----------|-------|
| `number:equal` | Equal to |
| `number:notequal` | Not equal to |
| `number:less` | Less than |
| `number:greater` | Greater than |
| `number:lessorequal` | Less than or equal to |
| `number:greaterorequal` | Greater than or equal to |

### Date Operators

| Operator | Label |
|----------|-------|
| `date:equal` | Equal to |
| `date:notequal` | Not equal to |
| `date:less` | Earlier than |
| `date:greater` | Later than |
| `date:lessorequal` | Earlier than or equal to |
| `date:greaterorequal` | Later than or equal to |

### Time Operators

| Operator | Label |
|----------|-------|
| `time:equal` | Equal to |
| `time:notequal` | Not equal to |
| `time:less` | Less than |
| `time:greater` | Greater than |
| `time:lessorequal` | Less than or equal to |
| `time:greaterorequal` | Greater than or equal to |

### Array Operators

| Operator | Label |
|----------|-------|
| `array:contain` | Contains |
| `array:notcontain` | Does not contain |
| `array:equal` | Array length equal to |
| `array:notequal` | Array length not equal to |
| `array:less` | Array length less than |
| `array:greater` | Array length greater than |
| `array:lessorequal` | Array length less than or equal to |
| `array:greaterorequal` | Array length greater than or equal to |

Array contain/notcontain also have `:ci` variants for case-insensitive matching.

## IML in Filters

Both `a` and `b` operands can use IML expressions:

```json
{"a": "{{addDays(1.date; 7)}}", "o": "date:less", "b": "{{now}}"}
```

This allows dynamic comparisons against computed values, dates, and transformed data.

## Router Filters

When using a Router module:
- The router itself has **no filter**.
- Each route is a separate execution path.
- Place filters on the **first module inside each route's flow**.
- Routes execute sequentially (top to bottom). **Multiple routes can fire** for the same bundle (unlike If-Else which is mutually exclusive).

## Gotchas

- **Choose the right operator type.** Using `text:equal` on a numeric field or `number:equal` on a text field may produce unexpected results. Match the operator group to the data type.
- **`exist`/`notexist` have no `b` value.** These operators only check whether the field has a value, not what the value is. Only the `a` operand is needed.
- **Google Sheets internal filters.** When filtering within Google Sheets modules (not Make filters), use uppercase column letters: `"a": "G"`. Lowercase letters and mapped values in the `a` field will not work.
- **Filters block the entire downstream path.** A filter on module 3 prevents modules 4, 5, 6... from executing for blocked bundles, not just module 3.

## Official Documentation

- [Filtering](https://help.make.com/filtering)

See also: [Mapping](./mapping.md) for building IML references used in filter operands, [IML Expressions](./iml-expressions.md) for the expression language.
