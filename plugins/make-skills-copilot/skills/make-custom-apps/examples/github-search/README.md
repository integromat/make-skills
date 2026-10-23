# GitHub repository search

A complete set of **search module sections** for public repository search, not a complete app. No connection or app Base is required by this example: Communication uses an absolute public API URL. The local filenames below are an example convention.

## Section mapping and dependencies

Create a Search module and map:

| File | Make section |
| --- | --- |
| [api.imljson](api.imljson) | Communication |
| [parameters.imljson](parameters.imljson) | Static parameters (empty) |
| [expect.imljson](expect.imljson) | Mappable parameters |
| [interface.imljson](interface.imljson) | Interface |
| [samples.imljson](samples.imljson) | Samples (one synthetic output bundle) |

`q` and `limit` are the only inputs referenced by Communication. `response.iterate` selects `body.items`; the explicit output projection has exactly the five fields in Interface and Samples. Search modules iterate results into separate bundles.[16]

## Assumptions and placeholders

- Uses documented `GET https://api.github.com/search/repositories` with `q`, `sort=stars`, `order=desc`, `per_page=100`, and `page`. Only public resources are in scope; no token placeholder is needed.[2]
- The first request explicitly uses `page: 1`. Subsequent requests use **`{{pagination.page}}` without `+ 1`**: Make prepares page 2 for the second request. Pagination stops on an empty page or the response limit.[12]
- The user-facing limit is bounded to 1–1000, matching GitHub's maximum accessible search results, not a claim that all matching repositories can be exported. `per_page` is independent of that bundle limit.[2][12]
- A successful page must have `incomplete_results === false`; otherwise `response.valid` raises an error rather than presenting a timeout result as complete.[2][13]
- Stars and archived flags are mapped directly, preserving `0` and `false`. Samples contain fictional IDs/names for UI illustration only.
- Nested `validate.min` / `validate.max` are SDK parameter fields; they are not JSON Schema `minimum` / `maximum`.[14][28]

## Validation level and remaining live tests

Offline checks parse JSON, check named inputs/output/sample types and the exact pagination mapping; they **do not evaluate IML or call GitHub**. Make/provider execution remains untested.

In an explicitly authorized Make test, inspect actual requested pages **1, 2, 3**, an empty final page, a partial final page, limits smaller than a page, limits spanning pages, and the 1000-result ceiling. Inspect IDs for duplicates and report incomplete results or changing search rankings; page-number search is not a snapshot. Exercise 403/429 rate-limit handling and an invalid query. Public reads need no credentials; adding private-resource access requires a separately designed connection and authorized credential tests. No live tests have been run here.

## Sources

[2] https://docs.github.com/en/rest/search/search
[12] https://developers.make.com/custom-apps-documentation/component-blocks/api/pagination.md
[13] https://developers.make.com/custom-apps-documentation/component-blocks/api/handling-responses/valid.md
[14] https://developers.make.com/custom-apps-documentation/block-elements/parameters/text.md
[16] https://developers.make.com/custom-apps-documentation/app-components/modules/search.md
[28] https://developers.make.com/custom-apps-documentation/block-elements/parameters/integer-uinteger.md
