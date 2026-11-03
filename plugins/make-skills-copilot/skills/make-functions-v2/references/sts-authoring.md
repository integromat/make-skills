# STS authoring for Functions

Functions accepts a restricted TypeScript execution model. Ordinary TypeScript compilation alone does not
prove STS compatibility. Check these rules before creating, publishing or inline testing content:

- Default-export a function named `main` with exactly one parameter; it may be async.
- Declare named helpers at module scope and make them reachable from `main`. Use named helpers instead of
  arrows or function expressions. Named callbacks must be synchronous and used directly as call arguments.
- Keep top-level runtime initialization out of source. Literal, unexported constants are supported;
  perform calls and other computation inside functions.
- Use explicit `if` statements for conditional execution. Pure conditional value selection is allowed.
- Put `return` last in a function body, or in a direct guard: an else-less `if` directly in that body whose
  entire body is the return. Throwing an error is a separate operation.
- Avoid `switch`, `finally`, `break`, `continue` and `do/while`.
- Add `// @label ...` after the opening brace of decisions and condition-driven loops. `for…of`, `for…in`
  and endless loops have different labeling rules. Label property-assignment bookkeeping or place it in
  a labeled block where required by the validator.

## Conditional expressions

`&&`, `||`, `??` and ternaries cannot hide conditional calls, awaits, assignments or increments, even when
a call seems pure. A ternary selecting already-computed values is allowed.

```typescript
// Rejected: test() executes conditionally.
if (input.date !== undefined && !datePattern.test(input.date)) {
  throw new Error('Invalid date');
}

// Supported structure (within main or a reachable named helper).
if (input.date !== undefined) { // @label Validate supplied date
  const validDate = datePattern.test(input.date);
  if (!validDate) { // @label Reject invalid date
    throw new Error('Invalid date');
  }
}
```

Likewise, compute `Array.isArray(value)` separately instead of placing it behind `||`. Preserve evaluation
semantics: use an explicit conditional when computing a value unconditionally would be unsafe.

## Functions host restrictions

General STS supports imports; the Functions host rejects them. Do not import packages into Function source.
Use direct `make.endpoints.<app>.v<version>.<operation>({...})` calls with generated property identifiers.
Do not use computed/bracket access or alias Endpoint functions. Supply one object literal containing the
supported `input` and, when needed, `connection` fields. A connection is a literal label declared in the
content's `connections` map, not a runtime expression or a credential. Declare each called Endpoint and
its connection binding in the content. An Endpoint alias is display metadata, not a callable identifier.

Use an appropriate available STS validator locally, then check these host rules separately. Inline testing
executes real code and can cause real Endpoint side effects; it is never a validation-only substitute.
