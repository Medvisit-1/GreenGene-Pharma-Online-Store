"use client";

/**
 * A submit button that asks for confirmation before the form's server action
 * runs. If the user cancels, submission is prevented.
 */
export function ConfirmSubmit({
  message = "Are you sure? This cannot be undone.",
  className,
  children,
}: {
  message?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
