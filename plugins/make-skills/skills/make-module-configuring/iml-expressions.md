---
name: iml-expressions
description: Complete IML (Inline Mapping Language) reference for Make module configuration — variables, backtick rule, functions (date, math, array, string, general), operators, keywords, array indexing, and common errors.
---

# IML Expressions

## What It Is

IML (Inline Mapping Language) is Make's expression language used inside the mapper domain. It evaluates at runtime to produce dynamic values from upstream module outputs, built-in variables, and transformation functions.

All IML expressions are wrapped in double curly braces: `{{expression}}`.

## Syntax Rules

### Variables (Module References)

Reference upstream module outputs by module ID and field path:

- `{{1.email}}` — field `email` from module 1
- `{{3.data.name}}` — nested field access
- `{{5.items[1].title}}` — array indexing (1-based)

### Full Bundle Reference

To reference the **entire output bundle** of a module (not a specific field), wrap the module ID in backticks:

- `{{\`1\`}}` — the full output bundle of module 1
- `{{\`3\`}}` — the full output bundle of module 3

**A bare numeric ID without backticks will NOT work.** `{{1}}` does not parse correctly in IML — it must be `{{\`1\`}}`. This is required whenever a field expects the complete module output as a single object (e.g., passing an entire bundle to a JSON stringify, a Set Variable module, or an HTTP body).

### Backtick Rule

When a field name contains spaces, special characters, or starts with a number, wrap that segment in backticks:

- `{{1.\`Customer Name\`}}` — field with space
- `{{1.\`__IMTCONN__\`}}` — system variable
- `{{1.data.\`user address\`.city}}` — only the segment with spaces needs backticks
- `{{\`1\`}}` — full bundle reference (the module ID itself is a number, so it needs backticks)

### Array Indexing

**1-based indexing.** First item is index 1, never 0.

- `{{3.output[1]}}` — first item
- `{{3.output[2].content[1].text}}` — nested array access

### Function Argument Separator

IML uses **semicolons** (`;`) to separate function arguments, not commas:

- `{{if(1.status = "active"; "Yes"; "No")}}`
- `{{formatDate(now; "YYYY-MM-DD")}}`

**`formatNumber` gotcha:** The default decimal separator is a **comma** and the default thousands separator is a **period** (opposite of many locales). Example: `formatNumber(123456789; 3; ,; .)` = `123.456.789,000`. Always specify separators explicitly to avoid confusion.

### Operators

| Operator | Meaning |
|----------|---------|
| `=` | Equal to |
| `!=` | Not equal to |
| `<` | Less than |
| `>` | Greater than |
| `<=` | Less than or equal to |
| `>=` | Greater than or equal to |
| `&` | Logical AND |
| `\|` | Logical OR |
| `+` | Addition |
| `-` | Subtraction |
| `*` | Multiplication |
| `/` | Division |
| `%` | Modulo |

## Functions Reference

**Only use functions documented here.** Never use a function, variable, operator, or keyword not listed in this reference.

### General Functions

| Function | Description |
|----------|-------------|
| `if(expr; value1; value2)` | Returns value1 if expr is true, otherwise value2 |
| `ifempty(value1; value2)` | Returns value1 if not empty, otherwise value2 |
| `switch(expr; v1; r1; ...; else)` | Matches expr against values, returns corresponding result |
| `get(object; path)` | Returns value at path in object/array. Use only when path is variable, not for static access |
| `pick(object; key1; key2; ...)` | Returns object with only the specified keys |
| `omit(object; key1; key2; ...)` | Returns object without the specified keys |
| `equal(value; value)` | Compares two values for equality |

### String Functions

| Function | Description |
|----------|-------------|
| `length(text)` | Number of characters |
| `lower(text)` | Lowercase |
| `upper(text)` | Uppercase |
| `capitalize(text)` | First character uppercase |
| `startcase(text)` | Capitalize every word, lowercase rest |
| `trim(text)` | Remove leading/trailing whitespace |
| `replace(text; search; replacement)` | Replace occurrences |
| `substring(text; start; end)` | Extract portion (0-based start index) |
| `split(text; separator)` | Split into array |
| `indexOf(string; value; [start])` | Position of first occurrence (-1 if not found) |
| `contains(text; search)` | Check if text contains search string |
| `toString(value)` | Convert any value to string |
| `stripHTML(text)` | Remove HTML tags |
| `escapeHTML(text)` | Escape HTML tags |

| `encodeURL(text)` | URL-encode special characters |
| `decodeURL(text)` | Decode URL-encoded text |
| `ascii(text; [removeDiacritics])` | Remove non-ASCII characters |
| `base64(text)` | Encode to base64 |
| `toBinary(value)` | Convert to binary data |
| `md5(text)` | MD5 hash |
| `sha1(text; [encoding]; [key]; [keyEncoding])` | SHA1 hash (HMAC with key) |
| `sha256(text; [encoding]; [key]; [keyEncoding])` | SHA256 hash (HMAC with key) |
| `sha512(text; [encoding]; [key]; [keyEncoding])` | SHA512 hash (HMAC with key) |
| `replaceEmojiCharacters(text; replacement)` | Replace emoji characters |

### Date Functions

| Function | Description |
|----------|-------------|
| `formatDate(date; format; [timezone])` | Format date as string |
| `parseDate(text; format; [timezone])` | Parse string to date |
| `addDays(date; number)` | Add/subtract days |
| `addHours(date; number)` | Add/subtract hours |
| `addMinutes(date; number)` | Add/subtract minutes |
| `addSeconds(date; number)` | Add/subtract seconds |
| `addMonths(date; number)` | Add/subtract months |
| `addYears(date; number)` | Add/subtract years |
| `setDate(date; number)` | Set day of month |
| `setDay(date; number/name)` | Set day of week (Sunday=1, Saturday=7, or English name e.g. `monday`) |
| `setMonth(date; number/name)` | Set month |
| `setYear(date; number)` | Set year |
| `setHour(date; number)` | Set hour (0-23) |
| `setMinute(date; number)` | Set minute (0-59) |
| `setSecond(date; number)` | Set second (0-59) |

Values outside valid ranges adjust adjacent units (e.g., setting seconds to 70 adds a minute).

**ISO 8601 datetime:** Use a single `formatDate()` call with format `"YYYY-MM-DDTHH:mm:ssZ"`. The `T` is a literal separator within the format string, `Z` outputs the timezone offset. Never concatenate separate dynamic date and time expressions into a full datetime. (Exception: combining a date-only `formatDate` result with a fixed literal time like `T00:00:00Z` for day boundaries is valid — see Common Errors.)

### Math Functions

| Function | Description |
|----------|-------------|
| `round(number)` | Round to nearest integer |
| `ceil(number)` | Round up |
| `floor(number)` | Round down |
| `trunc(number; [decimals])` | Truncate to integer or decimal places |
| `abs(number)` | Absolute value |
| `min(values)` | Smallest value |
| `max(values)` | Largest value |
| `sum(values)` | Sum of values |
| `average(values)` | Average of values |
| `median(values)` | Median of values |
| `parseNumber(text; [decimalSeparator])` | Parse string to number |
| `formatNumber(number; decimals; [decSep]; [thousSep])` | Format number as string |
| `stdevS(values)` | Sample standard deviation |
| `stdevP(values)` | Population standard deviation |

### Array Functions

| Function | Description |
|----------|-------------|
| `length(array)` | Number of items |
| `first(array)` | First element |
| `last(array)` | Last element |
| `map(array; key; [filterKey]; [filterValues])` | Extract values by key from array of objects (case-sensitive, use raw names) |
| `join(array; separator)` | Concatenate into string |
| `contains(array; value)` | Check if array contains value |
| `add(array; value1; value2; ...)` | Add values to array |
| `remove(array; value1; value2; ...)` | Remove values from array (primitive arrays only) |
| `sort(array; [order]; [key])` | Sort array (asc/desc/asc ci/desc ci) |
| `reverse(array)` | Reverse order |
| `shuffle(array)` | Random order |
| `merge(array1; array2; ...)` | Merge arrays into one |
| `slice(array; start; [end])` | Extract portion (0-based indexing) |
| `flatten(array; [depth])` | Flatten nested arrays |
| `distinct(array; [key])` | Remove duplicates |
| `deduplicate(array)` | Remove duplicates (primitive arrays) |
| `keys(object)` | Get keys of object as array |
| `toArray(collection)` | Convert collection to array of key-value pairs |
| `toCollection(array; keyField; valueField)` | Convert key-value array to collection |

## Variables

| Variable | Description |
|----------|-------------|
| `now` | Current date and time |
| `timestamp` | Unix timestamp (seconds since epoch) |
| `pi` | Mathematical constant π |
| `random` | Random float between 0 (inclusive) and 1 (exclusive) |
| `uuid` | RFC 4122 v4 unique identifier |
| `executionId` | Unique ID of the current execution |

## Keywords

| Keyword | Description |
|---------|-------------|
| `null` | Null (empty) value |
| `true` | Boolean true |
| `false` | Boolean false |
| `emptystring` | Empty text |
| `emptyarray` | Empty array |
| `space` | Space character |
| `tab` | Tab character |
| `newline` | New line character |
| `nbsp` | Non-breaking space |
| `carriagereturn` | Carriage return |
| `ignore` | Instructs engine to act as if field is empty |
| `erase` | Sets field to empty value (empty array for array fields) |

## Limitations

- **No inline JSON.** IML does not support inline JSON syntax like `{key: value}` within expressions.
- **No `set()` function.** IML cannot set a value at a specific path in an object.

## Common Errors

- **Smart quotes.** Use straight quotes `"` not curly quotes `"`. Smart quotes cause mapping failures.
- **Index 0.** Array indexing is 1-based. `{{1.items[0]}}` does not work — use `{{1.items[1]}}`.
- **Commas instead of semicolons.** Function arguments use `;` not `,`.
- **Mapping arrays to single-value fields.** If a field expects a single value but receives an array, use `first()`, `last()`, or index the specific item.
- **JSON in text fields.** To put a JSON object into a text field, use `{{toString(1.json)}}`.
- **DateTime concatenation.** Never concatenate date and time parts with `&`, `+`, or literal `T` outside a format string. Use a single `{{formatDate(date; "YYYY-MM-DDTHH:mm:ssZ")}}`.
- **Non-existent date boundary functions.** IML does not have `endOfDay()`, `startOfDay()`, `beginningOfDay()`, or similar boundary functions. These produce "Unknown function" errors. To get day boundaries, use `formatDate` to extract the date portion and append a literal time: start of day `{{formatDate(now; "YYYY-MM-DD")}}T00:00:00Z`, end of day `{{formatDate(now; "YYYY-MM-DD")}}T23:59:59Z`. This is the one valid case of combining a `formatDate` result with literal text — the "DateTime concatenation" rule above applies to building full datetimes from separate dynamic parts.
- **Google Sheets column references.** Use 0-based numeric indices wrapped in backticks:
  `{{1.\`0\`}}` (column A), `{{1.\`1\`}}` (column B), `{{1.\`2\`}}` (column C).
  This is the format the Make UI generates — do not use 1-based indices, bare numbers, or header names.
  The row number and sheet metadata are available as `{{1.__ROW_NUMBER__}}`, `{{1.__SHEET__}}`,
  and `{{1.__SPREADSHEET_ID__}}`.
  If the sheet has column headers (`includesHeaders: true`), the trigger output also includes
  named fields using the header text (e.g., `{{1.email}}`), but these are fragile — prefer the
  numeric index form for reliability.

## Official Documentation

- [Use Functions](https://help.make.com/use-functions)
- [General Functions](https://help.make.com/general-functions)
- [Math Functions](https://help.make.com/math-functions)
- [Text and Binary Functions](https://help.make.com/text-and-binary-functions)
- [Date and Time Functions](https://help.make.com/date-and-time-functions)
- [Array Functions](https://help.make.com/array-functions)

See also: [Mapping](./mapping.md) for the mapper domain and how to discover upstream outputs, [Filtering](./filtering.md) for using IML in filter conditions.
