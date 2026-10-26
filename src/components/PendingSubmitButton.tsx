"use client";

import { useState, type ReactNode } from "react";
import { Spinner } from "./Spinner";

/**
 * Submit button for plain HTML forms (e.g. sign-out), which post and reload the page: shows a spinner
 * and `pendingLabel` from the click until the browser navigates away.
 */
export function PendingSubmitButton({
  className,
  pendingLabel,
  children,
}: {
  className?: string;
  pendingLabel: string;
  children: ReactNode;
}) {
  const [pending, setPending] = useState(false);
  return (
    // aria-disabled (not disabled): a disabled submit button would cancel the form submission.
    <button
      className={className}
      aria-disabled={pending ? true : undefined}
      onClick={(event) => {
        if (pending) event.preventDefault();
        else setPending(true);
      }}
    >
      {pending ? <Spinner /> : null}
      {pending ? pendingLabel : children}
    </button>
  );
}
