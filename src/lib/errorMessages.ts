// Server actions throw two very different kinds of errors: plain-language
// validation messages meant for the person using the app ("Can't archive the
// last remaining person in a group."), and internal invariant checks meant
// for a developer ("Missing settlement id.") that only fire from a stale tab
// or a bug, never from something the user typed. Only the first kind is safe
// to show verbatim on the crash screen — anything else gets a generic,
// reassuring fallback instead of leaking developer-facing text.
const USER_FACING_ERROR_MESSAGES = new Set([
  "Group name, home currency, and at least one participant are required.",
  "A name is required to add a participant.",
  "Group name and home currency are required.",
  "Can't archive the last remaining person in a group.",
  "Missing required settlement fields.",
  "At least one payer with an amount is required.",
  "At least one item is required for an item-level split.",
  "At least one participant is required for an exact split.",
  "At least one participant is required for a shares split.",
  "At least one participant is required for an even split.",
  "The amount paid must add up to the total expense amount.",
]);

export function getDisplayErrorMessage(message: string | undefined): string {
  if (message && USER_FACING_ERROR_MESSAGES.has(message)) {
    return message;
  }
  return "Something didn't save. Please try again.";
}
