---
name: iml-functions
description: The IML expression language inside `{{…}}` — operators, built-in functions by category, variables, keywords, and the syntax errors that fail at run time. Load only when a mapped value needs transforming.
---

# IML functions and expressions

IML is the expression language inside `{{…}}` in `mapper` values, `filter` conditions, and
`flags.groupBy`. Everything below is built in. **Only use what is listed here** — a misspelled or invented
function saves fine and fails every run with "Unknown function". Custom (user-defined) IML functions exist in
Make but cannot be created on this surface; a scenario that already uses one reads back fine, a new one has to
be written in the Make editor.

## Syntax

- Arguments are separated by **semicolons**: `{{if(1.status = "active"; "Yes"; "No")}}`.
- Straight quotes only (`"`), never typographic ones.
- Field names with spaces or leading digits go in backticks: `{{1.\`Customer Name\`}}`, `` {{1.`0`}} ``.
- Array indexing is **1-based**: `{{1.items[1]}}` is the first item.
- Logical operators are the symbols `&` (and) and `|` (or) — the words `AND`/`OR` do not parse.
- Comparison: `=`, `!=`, `<`, `>`, `<=`, `>=`. Arithmetic: `+`, `-`, `*`, `/`, `%`.
- No inline JSON (`{key: value}`) and no `set()` — build objects with the module's own fields instead.

## General

| Function | Returns |
|---|---|
| `if(expr; a; b)` | `a` when `expr` is true, else `b` |
| `ifempty(a; b)` | `a` unless empty, then `b` |
| `switch(expr; v1; r1; v2; r2; …; else)` | the result matching `expr` |
| `get(object; path)` | the value at a *variable* path (use dot access for static paths) |
| `pick(object; k1; k2; …)` / `omit(object; k1; …)` | the object with only / without those keys |
| `equal(a; b)` | equality test |

## Text

`length`, `lower`, `upper`, `capitalize`, `startcase`, `trim`, `replace(text; search; replacement)`,
`substring(text; start; end)` (0-based), `split(text; sep)`, `indexOf(text; value)`, `contains(text; search)`,
`toString(value)`, `stripHTML`, `escapeHTML`, `encodeURL`, `decodeURL`, `ascii(text; removeDiacritics)`,
`base64`, `toBinary`, `md5`, `sha1`, `sha256`, `sha512`, `replaceEmojiCharacters(text; replacement)`.

To put a JSON object into a text field: `{{toString(1.json)}}`.

## Dates

| Function | Notes |
|---|---|
| `formatDate(date; format; [timezone])` | e.g. `"YYYY-MM-DD"`, `"YYYY-MM-DDTHH:mm:ssZ"` |
| `parseDate(text; format; [timezone])` | string → date |
| `addDays` / `addHours` / `addMinutes` / `addSeconds` / `addMonths` / `addYears(date; n)` | negative `n` subtracts |
| `setDate` / `setDay` / `setMonth` / `setYear` / `setHour` / `setMinute` / `setSecond(date; value)` | out-of-range values roll over |

- A full datetime is **one** `formatDate` call with a format containing the literal `T`; never concatenate
  separately formatted date and time parts.
- There is no `startOfDay()`/`endOfDay()`. Day boundaries are `{{formatDate(now; "YYYY-MM-DD")}}T00:00:00Z`
  and `…T23:59:59Z` — the one sanctioned date + literal-time concatenation.

## Numbers

`round`, `ceil`, `floor`, `trunc(n; decimals)`, `abs`, `min`, `max`, `sum`, `average`, `median`,
`parseNumber(text; decimalSeparator)`, `formatNumber(n; decimals; decSep; thousandsSep)` — its defaults are a
comma decimal separator and a period thousands separator, so always pass both explicitly — `stdevS`, `stdevP`.

## Arrays

`length`, `first`, `last`, `map(array; key; [filterKey]; [filterValues])`, `join(array; sep)`,
`contains(array; value)`, `add`, `remove`, `sort(array; order; key)`, `reverse`, `shuffle`, `merge`,
`slice(array; start; end)` (0-based), `flatten`, `distinct(array; key)`, `deduplicate`, `keys(object)`,
`toArray(collection)`, `toCollection(array; keyField; valueField)`.

## Variables and keywords

Variables: `now`, `timestamp`, `pi`, `random`, `uuid`, `executionId`.
Keywords: `null`, `true`, `false`, `emptystring`, `emptyarray`, `space`, `tab`, `newline`, `nbsp`,
`carriagereturn`, `ignore` (treat the field as empty), `erase` (clear the field).
