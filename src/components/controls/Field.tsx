import { useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";

type SharedProps = { label: string; help?: ReactNode; error?: ReactNode; className?: string };
type FieldProps = SharedProps & InputHTMLAttributes<HTMLInputElement>;
type TextareaFieldProps = SharedProps & TextareaHTMLAttributes<HTMLTextAreaElement>;

function FieldMessage({ id, help, error }: { id: string; help?: ReactNode; error?: ReactNode }) {
  if (!help && !error) return null;
  return <div id={id} className={error ? "field-message field-message--error" : "field-message"}>{error ?? help}</div>;
}

export function Field({ label, help, error, className = "", id, "aria-describedby": describedBy, ...props }: FieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = help || error ? `${inputId}-message` : undefined;
  return <label className={`field ${className}`.trim()} htmlFor={inputId}><span className="field-label">{label}</span><input id={inputId} className="field-control" aria-invalid={Boolean(error) || undefined} aria-describedby={[describedBy, messageId].filter(Boolean).join(" ") || undefined} {...props} /><FieldMessage id={messageId ?? ""} help={help} error={error} /></label>;
}

export function TextareaField({ label, help, error, className = "", id, "aria-describedby": describedBy, ...props }: TextareaFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = help || error ? `${inputId}-message` : undefined;
  return <label className={`field ${className}`.trim()} htmlFor={inputId}><span className="field-label">{label}</span><textarea id={inputId} className="field-control field-control--textarea" aria-invalid={Boolean(error) || undefined} aria-describedby={[describedBy, messageId].filter(Boolean).join(" ") || undefined} {...props} /><FieldMessage id={messageId ?? ""} help={help} error={error} /></label>;
}
