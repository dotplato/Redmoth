// Plays the success check animation (SuccessAnimation, mounted once in the root layout) after a form
// saves. Not used by the sign-in/sign-up/password forms. An event instead of a context, so any client
// component can call it without a provider.
const SUCCESS_EVENT = "redmoth:success";

/** `message` is announced to screen readers; the form's own text says what happened on screen. */
export function celebrate(message = "Saved") {
  window.dispatchEvent(new CustomEvent<string>(SUCCESS_EVENT, { detail: message }));
}

/** Returns the unsubscribe function. */
export function onCelebrate(handler: (message: string) => void) {
  const listener = (event: Event) => handler((event as CustomEvent<string>).detail);
  window.addEventListener(SUCCESS_EVENT, listener);
  return () => window.removeEventListener(SUCCESS_EVENT, listener);
}
