# IML expressions and app functions

Load this reference when expressions need transformation, parsing, validation, or
signing logic, or when a custom function requires executable tests.
Use [requests-and-responses.md](requests-and-responses.md) for HTTP orchestration.

## Keep the runtimes separate

- App IML functions are custom-app components invoked from that app's IML expressions.
  They are not organization-level Custom Functions or a general Node.js service.
- The SDK guide states that custom IML functions are not enabled by default.
  Confirm access before designing an app that depends on them; follow the documented
  support route if enablement is required.
- Prefer built-in IML functions and declarative communication when they suffice.
- A helper copied from another app must exist in the target app; its name alone
  does not make it a built-in function or a dependency available at runtime.
- Keep local directory names, generators, and test runners separate from platform
  requirements. Reuse valid short implementations, not private deployment assumptions.

Source: [Custom IML functions and availability](https://developers.make.com/custom-apps-documentation/app-components/iml-functions.md).

## Expression semantics

IML is JavaScript-like, not arbitrary JavaScript pasted into JSON. Use `{{...}}`
expressions and supported functions. Arithmetic, comparison, and logical operators
are documented; equality comparisons are strict even when written `=` or `==`.

IML arrays are **one-based**: `{{body.data[1]}}` selects the first item.
JavaScript inside a custom function uses ordinary **zero-based** array indexing.
Do not copy an exported `[0]` expression without checking which runtime evaluates it.

Use dot notation for ordinary properties, backticks for special property names,
and `get()` for a computed property. For example, the documented header form is
``{{headers.`X-HOOK-TYPE`}}``. Do not translate JavaScript method chains such as
`.startsWith()` into IML without checking the expression language.

The current IML guide defines `ifempty(a, b)` as falling back for undefined, null,
or an empty string; it does **not** define `false` or `0` as empty. Nevertheless,
`ifempty(..., undefined)` can erase an intentional null or empty string.
Truthiness defaults such as `value || fallback` can also discard valid values.
Prefer direct mapping when the provider accepts the supplied value and preserve
`false`, `0`, explicit clears, and empty arrays according to the operation contract.

Sources: [JavaScript-like IML, operators, indexing, and ifempty](https://developers.make.com/custom-apps-documentation/block-elements/iml.md),
[Empty-value handling](https://developers.make.com/custom-apps-documentation/best-practices/input-parameters/processing-of-input-parameters.md#handling-arrays-nulls-and-empty-strings).

## Custom function contract

Pass all required values as explicit arguments. Do not assume a custom JavaScript
function automatically receives `body`, `connection`, or another component context.
Return the intended collection, array, string, number, boolean, or buffer rather
than stringifying data that the surrounding directive expects as an object.

The documented runtime provides JavaScript built-in objects, ES6 features, `Buffer`,
and built-in/custom IML functions through the `iml` namespace, such as
`iml.parseDate()`. Use `JSON.parse()` and `JSON.stringify()` inside functions rather
than the expression-layer `parseJSON()` and `createJSON()` helpers.

Do not import `require`, Node `crypto`, filesystem modules, or network clients into
app code. Do not move HTTP validation into `fetch()`. Use Communication for requests;
keep functions bounded data transformations and verify signing against supported
IML primitives when needed.

The current guide lists a 10-second execution timeout and a 5,000-character function
limit. Recheck the live guide before targeting a limit; do not assume local Node
performance or package availability reproduces the app runtime.

Sources: [Function runtime and limits](https://developers.make.com/custom-apps-documentation/app-components/iml-functions.md),
[IML built-ins and JSON conversion](https://developers.make.com/custom-apps-documentation/block-elements/iml.md).

## Reuse a small testable function

The following function and the first two tests reuse the SDK's IML test example.
The third test checks null input. Names are synthetic fixture values, not account data.
Store the source and tests in the selected editor's function and test components;
`code.js` and `test.js` below are only local file conventions.

```javascript
function formatUsername(user) {
    if (!user || !user.firstName || !user.lastName) {
        return null;
    }
    return `${user.firstName} ${user.lastName}`;
}
```

```javascript
it("should format full name correctly", () => {
    const user = { firstName: "Jane", lastName: "Doe" };
    const result = formatUsername(user);
    assert.strictEqual(result, "Jane Doe");
});

it("should return null if last name missing", () => {
    const user = { firstName: "Jane" };
    const result = formatUsername(user);
    assert.strictEqual(result, null);
});

it("should return null for null input", () => {
    assert.strictEqual(formatUsername(null), null);
});
```

Run the editor's **Run IML test** action and inspect its output channel.
Set the extension's timezone when testing date/time functions.

Source: [Write and run IML tests](https://developers.make.com/custom-apps-documentation/get-started/make-apps-editor/apps-sdk/iml-tests.md).

## Make offline tests genuinely executable

A syntax check does not execute assertions. A plain Node run also does not magically
provide the function under test, `it`, `assert`, or Make's `iml` namespace.
For helpers using only standard JavaScript, a local harness can load both files:

```javascript
const fs = require("node:fs");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const files = process.argv.slice(2);
if (files.length !== 2) throw new Error("Pass source and test paths");
let passed = 0;
const sandbox = { assert, Buffer, it(name, test) { test(); passed += 1; } };
vm.createContext(sandbox);
for (const file of files) {
    vm.runInContext(fs.readFileSync(file, "utf8"), sandbox, {
        filename: file, timeout: 1000
    });
}
if (passed === 0) throw new Error("No tests executed");
console.log(`${passed} tests passed`);
```

Run it as `node run-tests.cjs code.js test.js` after saving those local files.
**The Node imports belong only to this offline harness, never to app function code.**
For helpers using `iml.*`, run SDK tests or clearly document limited test substitutes;
do not report a stubbed function as proof of real Make semantics.

## Transformation and verification gate

- Test absent, null, empty-string, zero, false, and normal inputs where meaningful.
- Test primitive arrays, nested collections, dates, and buffers before reusing a
  generic empty-removal function. Removing every null can destroy an update's erase intent.
- Preserve original fields during read/merge/write updates; changing one field must
  not silently drop unrelated `false`, `0`, or empty values.
- For XML, prefer the documented response parser; regex tag matching is not a generic
  XML parser. For signatures, use independent documented test vectors and exact bytes.
- Keep transformation helpers free of credentials, endpoint secrets, and side effects.
- Verify each custom call has a matching implementation and every test actually ran.
- Report offline assertions, SDK function tests, and full module execution separately.
  No local harness proves connection authentication, pagination, or deployment readiness.

Sources: [Conditional empty removal](https://developers.make.com/custom-apps-documentation/app-components/iml-functions/removal-of-empty-collections-and-nulls.md),
[Full-update behavior](https://developers.make.com/custom-apps-documentation/app-components/iml-functions/handling-of-full-update-approach-in-update-modules.md).
