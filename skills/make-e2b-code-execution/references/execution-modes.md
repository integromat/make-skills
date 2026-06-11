# Execution Modes

## Plain code execution

Use plain execution when the user wants a calculation, transformation, one-off
script, or first prototype. Persist the source under `Code/`, then run it with
the local code execution tool.

Expected proof:

- code artifact path under `Code/`
- stdout/stderr or JSON result
- process-mining entry for the code run

## Hosted E2B Code Shell

Use hosted execution when the code should be reusable, isolated, or callable as
a tool later. Make owns the scenario. Infrastructure owns the E2B runner. Hermes
provides code references and input only.

Expected proof:

- code artifact path under `Code/`
- Make scenario ID for the E2B shell
- E2B sandbox/run ID returned by the runner
- process-mining entries for code write, shell run, and result

## SaaS calls from hosted code

Generated hosted code may call Make API shell scenarios for Gmail, Calendar,
Sheets, CRM, Slack, or other SaaS systems. It must not use native provider SDK
auth, browser auth, IMAP/SMTP, raw OAuth, or direct token handling.
