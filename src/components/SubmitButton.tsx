"use client";

import { useFormStatus } from "react-dom";

/**
 * A submit button that shows a spinner and disables itself while its parent
 * form's server action is running — so tapping it once never feels like
 * "nothing happened," which is what caused people to tap Create Group
 * repeatedly (and unintentionally create duplicate groups) before this existed.
 */
export function SubmitButton({
  children,
  pendingText,
  className,
  disabled,
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={disabled || pending} className={className}>
      {pending ? (
        <span className="inline-flex items-center gap-2">
          <span
            className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
          {pendingText ?? "Saving…"}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
