# Resolve concurrent edits

## Metadata or lifecycle conflict

Read `function_get` with `{"functionId":42}` and retain its ETag. A rename uses:

```json
{"tool":"function_update","arguments":{"functionId":42,"etag":"\"observed-etag\"","name":"Approved new name"}}
```

If the token is stale, read again and compare the changed resource with the intended operation. Preserve
unrelated edits. Continue with the new token only if the operation still matches the user's authorized
intent; ask for a decision when the intervening change alters that intent. Do not blindly refresh the token
and replay a deletion or activation. If no ETag is returned, report the missing prerequisite rather than
sending a wildcard or fabricated value.

## Source publication conflict

Read metadata and `function_version_get` for the latest version before modifying source. If publication
with `expectedLatestVersion: 2` conflicts because version 3 now exists, retrieve version 3 and compare its
source/contracts with the intended edit. Reconcile the content, test the revised candidate when appropriate,
and publish using 3 only after resolving the conflict. Do not overwrite another author's version by merely
incrementing the expected number.

Publication can also have an uncertain transport outcome. Before publishing again, read version history and
the relevant version content to establish whether the first publication succeeded. Do not assume that a
lost response means no new version exists.
