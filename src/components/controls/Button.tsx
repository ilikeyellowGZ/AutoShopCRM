import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "quiet"; loading?: boolean };

export function Button({ variant = "primary", className = "", type = "button", loading = false, disabled, children, ...props }: ButtonProps) {
  return <button type={type} className={`ui-button ui-button--${variant}${loading ? " ui-button--loading" : ""} ${className}`.trim()} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
    {loading ? <span className="ui-button-spinner" aria-hidden="true" /> : null}
    {children}
  </button>;
}
