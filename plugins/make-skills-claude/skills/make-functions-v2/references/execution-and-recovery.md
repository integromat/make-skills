# Execution and recovery

Both published and inline submissions return promptly with an admitted Run. Inline execution can call real
Endpoints even when the associated Function is inactive. Neither submission is a dry run or safe to repeat
merely because it timed out.

Poll the same Run with `function_run_get`, allowing time between reads. Terminal states are `succeeded`,
`failed`, `timed_out` and `cancelled`. Queued, provisioning, compiling, running and terminating states are
pending. Bound observation to the task's time budget; if still pending, report its ID and current state
instead of inventing a result or starting another Run.

A lost response, unreadable admission response or ambiguous server failure may produce
`FUNCTION_EXECUTION_UNCERTAIN`. External side effects may already have happened. When the error includes
an observed Run ID, retrieve it. Without one, inspect available history and safe external readback as
appropriate; matching input or a nearby timestamp alone does not prove that a particular Run is the missing
submission. Do not invent an ID, automatically resubmit or claim nothing ran. If the outcome remains unknown,
report it and obtain a decision before risking duplicate execution.

A confirmed rejection differs from uncertainty: address the reported access or validation issue before
considering a new submission. For a terminal failure, inspect the Run error and Endpoint-call history,
including ambiguous outcomes and `sideEffectPossible`. A failed Run does not imply that all external work
was rolled back.

`function_run_cancel` requests cancellation. Follow with reads until terminal or report that cancellation
is still pending. Already completed Runs can reject cancellation. Deactivation prevents new published Runs;
it neither cancels existing Runs nor reverses their effects.
