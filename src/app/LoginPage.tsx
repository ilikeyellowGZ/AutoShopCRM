import { useState, type FormEvent } from "react";
import { WeeleeLogo } from "../components/brand/WeeleeLogo";
import { Button } from "../components/controls/Button";
import { DEMO_ACCESS_CODE, authenticateDemoAccount, demoAccounts, type DemoAccount } from "./access";

export function LoginPage({ onSignIn }: { onSignIn: (account: DemoAccount) => void }) {
  const [email, setEmail] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState("");
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = authenticateDemoAccount(email, accessCode);
    if (!result.ok) { setError(result.error); return; }
    setError("");
    onSignIn(result.account);
  };

  return <main className="demo-login">
    <section className="demo-login-intro" aria-labelledby="demo-login-title">
      <WeeleeLogo className="demo-login-logo" />
      <p className="demo-login-eyebrow">MotorCRM employee workspace</p>
      <h1 id="demo-login-title">Sign in to MotorCRM</h1>
      <p className="demo-login-summary">Choose a dealership role to explore its real navigation, branch scope, records, and available actions.</p>
      <p className="demo-login-boundary"><strong>Functional browser demo.</strong> This access screen demonstrates roles and permissions in the existing Vite application. It is not server-enforced production authentication.</p>
    </section>
    <section className="demo-login-panel" aria-label="Demo sign-in">
      <form className="demo-login-form" onSubmit={submit} noValidate>
        <label className="field"><span className="field-label">Demo account email</span><input className="field-control" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
        <label className="field"><span className="field-label">Demo access code</span><input className="field-control" type="password" autoComplete="current-password" value={accessCode} onChange={(event) => setAccessCode(event.target.value)} aria-invalid={Boolean(error)} aria-describedby={error ? "demo-login-error demo-code-hint" : "demo-code-hint"} required /></label>
        <p className="demo-code-hint" id="demo-code-hint">Shared demo access code: <code>{DEMO_ACCESS_CODE}</code></p>
        {error ? <p className="form-error" id="demo-login-error" role="alert">{error}</p> : null}
        <Button type="submit">Sign in</Button>
      </form>
      <div className="demo-account-directory">
        <header><p className="demo-login-eyebrow">Available accounts</p><h2>Choose a role</h2></header>
        <ul>{demoAccounts.map((account) => <li key={account.id}><button type="button" aria-label={`Use ${account.email}`} onClick={() => { setEmail(account.email); setError(""); }}><strong>{account.title}</strong><span>{account.email}</span><small>{account.allowedBranches.length === 1 ? account.homeBranch : `${account.allowedBranches.length} branches`}</small></button></li>)}</ul>
      </div>
    </section>
  </main>;
}
