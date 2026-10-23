# GitHub new issue / pull-request polling

A complete set of **polling trigger sections** for newly created repository issues, including pull requests. This is not an update-event stream or a deployable app. No connection or Base dependency is used; the example is limited to a public repository and an absolute API URL.

## Section mapping and dependencies

Create a polling Trigger and map:

| File | Make section |
| --- | --- |
| [api.imljson](api.imljson) | Communication |
| [parameters.imljson](parameters.imljson) | Static parameters, not mappable parameters |
| [epoch.imljson](epoch.imljson) | Epoch overrides |
| [interface.imljson](interface.imljson) | Interface |
| [samples.imljson](samples.imljson) | Samples (one synthetic output bundle) |

Polling triggers use static inputs. `response.trigger` declares `type: date`, mandatory `id`, the created timestamp, and `order: desc`, matching `sort=created&direction=desc` in the request.[6][3] The timestamp is parsed with `parseDate` in trigger/output/Epoch so the output is a Make date, not an untyped timestamp string.[48]

## Assumptions and placeholders

- Enter a real public repository owner/name. `encodeURL` encodes path segments; the input patterns conservatively exclude slashes. Samples are fictional UI values, not responses fetched from that repository.
- `GET /repos/{owner}/{repo}/issues` with `state=all` avoids watching only currently open records. GitHub's Issues API also includes pull requests; the module is deliberately named to acknowledge that. It does not filter them out.[3]
- **Do not add `since=data.lastDate` to this created-item watcher:** GitHub's `since` filters by last **update**, not creation. Make's documented date/ID trigger mechanism handles progress; there is no hand-written cursor or promise of exactly-once delivery here.[3][6]
- First request is page 1; pagination maps `{{pagination.page}}` unchanged. Make prepares page 2 for the next request.[12]
- Epoch is an override merged with Communication, not a second complete API definition. Its output has **only `label` and `date`**; URL, iteration, pagination, and trigger identity are inherited. The Epoch limit is 300, the documented recommended record limit. Date triggers offer All, Since specific date, From now on, and manual selection when Epoch is configured.[7]
- The execution limit is an intentionally conservative 1–1000. It does not override Make's pagination/time/record ceilings or guarantee exhaustive historical backfill.[12]

## Validation level and remaining live tests

Offline checks cover JSON, static inputs, projection/interface/sample agreement, unchanged page mapping, trigger metadata, and Epoch shape. They **do not simulate cursor state or execute Make IML**.

With an authorized test repository, verify each Epoch option, two successive runs, multiple records sharing a timestamp, ID tie-breaking, pagination across three pages, no-new-item runs, same-record updates, restart/replay behavior, deletions, and a backlog larger than the run limit. Confirm that updates to old records are not emitted as new creations. Check rate limits and the platform's historical backfill ceilings before scheduling. Public reads need no credentials; private repositories require a separate connection and permission tests. No provider or Make runtime tests have been run.

## Sources

[3] https://docs.github.com/en/rest/issues/issues
[6] https://developers.make.com/custom-apps-documentation/app-components/modules/trigger.md
[7] https://developers.make.com/custom-apps-documentation/component-blocks/epoch.md
[12] https://developers.make.com/custom-apps-documentation/component-blocks/api/pagination.md
[48] https://developers.make.com/custom-apps-documentation/block-elements/parameters/date.md
