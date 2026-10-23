# Custom-app component examples

A directly reused [library of 71 copied/adapted examples](copied-snippets/README.md), plus five focused component examples below. These are **teaching sections/templates, not deployable apps**. The folders are a local example convention, not an official universal Make SDK project layout. No private app exports, uploader, credentials, or provider fixtures are bundled. Map each file to the section or fragment specified by its README/manifest; copied QA records are planning templates, not SDK input. Component linking is a separate editor/API step, not inferred from folder names.

| Example | Teaches | Status |
| --- | --- | --- |
| [GitHub search](github-search/README.md) | Search inputs, output interface, one-based pagination | Public-read section example |
| [GitHub polling](github-polling/README.md) | Date/ID ordering and Epoch overrides | Public-read section example |
| [Dropbox OAuth2](dropbox-oauth/README.md) | Authorization code, refresh, connection info | Credentials required |
| [GitHub dedicated webhook](github-webhook/README.md) | Connection → attach → receive → detach → instant trigger | **Deployment blocked** until signature/security work is implemented and tested |
| [Custom IML helper](custom-iml/README.md) | Nullish-only scalar defaults, executable tests | Node unit-tested; Make runtime untested |

## Offline validation

From the repository root, with Node.js 22 or newer and no dependencies:

```sh
node scripts/check-custom-app-examples.mjs
node --test scripts/check-custom-app-examples.test.mjs
```

The first command parses every shipped example `.json`/`.imljson`, checks the copied-snippet manifest/file coverage, expected section dependencies and local README links, checks a deliberately small set of regression invariants, and **runs the actual helper source through its Node tests**. The second command tests the checker against deliberately broken temporary copies, including page `+ 1`, missing dependencies, schema drift, and falsy-value loss. Temporary copies are deleted afterward. No network requests or Make/provider writes are made.

The repository checker also accepts `--examples-root PATH_TO_COPIED_EXAMPLES` for a synchronized plugin copy. Default discovery is relative to the script, not the working directory. The helper test can run in any copied skill folder:

```sh
node --test path/to/make-custom-apps/examples/custom-iml/default-if-null.test.mjs
```

## Evidence boundaries

- **Static:** JSON parsing, local links/required files, known expressions and the illustrated flat input/output/sample schemas. This is not an official SDK validator or a general IML parser/interpreter.
- **Unit:** the unmodified JavaScript helper executes in a Node VM without injected Node APIs. This is not Make's sandbox.
- **Not performed:** Make component creation/upload/readback, IML evaluation, authorization/refresh, pagination/cursor execution, provider delivery, or webhook write tests. Passing offline checks does not make the disabled webhook deployable.

Samples are invented **UI example values**, clearly not observed provider responses. Every example lists its assumptions, placeholders, public sources, and remaining credential/live tests. Never replace committed placeholders with secrets.
