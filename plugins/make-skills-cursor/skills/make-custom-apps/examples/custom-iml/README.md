# Custom IML helper: nullish-only scalar default

An app **custom IML function** with a small calling-section example. This is not an organization-level Custom Function or a Node module. App custom IML functions require feature availability in Make; the public SDK documents JavaScript built-ins (plus Buffer), not arbitrary Node APIs or imports.[11]

## Section mapping and dependencies

| File | Make section / local purpose |
| --- | --- |
| [defaultIfNull.js](defaultIfNull.js) | Code of an app IML function named exactly `defaultIfNull` |
| [expect.imljson](expect.imljson) | Example caller's Mappable parameters |
| [output.imljson](output.imljson) | **Value of `response.output`**, not a whole Communication object |
| [interface.imljson](interface.imljson) | Example caller's Interface |
| [samples.imljson](samples.imljson) | Samples (one synthetic output bundle) |
| [default-if-null.test.mjs](default-if-null.test.mjs) | Local Node tests; do not upload as function Code |

The named-function Code format and calling custom functions inside IML expressions follow the public SDK examples.[22][23] Register the function **before** using the calling output section. There is deliberately no made-up provider endpoint or claim that these caller sections form a complete module.

## Contract, assumptions, and placeholders

`defaultIfNull(value, fallback)` supports strings, booleans, finite numbers, null, and undefined. It returns the fallback only for null/undefined. It preserves `0`, `-0`, `false`, and empty text without coercion. It validates **both** arguments and throws for arrays, objects (including dates), functions, symbols, bigint, NaN, or infinities; it is not a generic deep-object helper.

The output example gives absent `count` a numeric default and absent `active` a boolean default, while the supplied sample demonstrates `count: 0` and `active: false`. No `ifempty()` or truthiness fallback is used. There are no credential or provider placeholders. Node `fs`, `vm`, `test`, and `assert` occur only in the test harness, not in the uploaded function.

## Validation level and remaining Make tests

From this folder:

```sh
node --test default-if-null.test.mjs
```

The tests load and execute the **actual sibling `defaultIfNull.js`**, not a reimplementation. They cover normal values, falsy values, nullish fallbacks and unsupported inputs, and resolve files from `import.meta.url` so synchronized plugin copies work from any working directory. A restricted Node VM helps catch accidental Node dependencies; it is **not** a Make sandbox emulator and does not evaluate IML expressions.

Offline checker tests also deliberately replace the implementation with a truthiness fallback and require the real helper test command to fail. Before deployment, confirm the custom-function feature is enabled, register the Code in a private app, and invoke both output mappings in Make with null, missing, 0, and false inputs. Check Make's coercion/error behavior and function logs. No provider credential is needed for the helper itself; any actual caller's API/connection requires separate authorized live tests. Make runtime tests have not been run.

## Sources

[11] https://developers.make.com/custom-apps-documentation/app-components/iml-functions.md
[22] https://developers.make.com/custom-apps-documentation/app-components/iml-functions/removal-of-empty-collections-and-nulls.md
[23] https://developers.make.com/custom-apps-documentation/debug-your-app/debugging-of-custom-iml-functions.md
