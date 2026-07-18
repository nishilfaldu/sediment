import { useAuthActions } from '@convex-dev/auth/react'
import type { FormEvent, JSX } from 'react'
import { useState } from 'react'

type AuthStep = 'email' | { email: string }

export function SignInForm(): JSX.Element {
  const { signIn } = useAuthActions()
  const [step, setStep] = useState<AuthStep>('email')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSendCode(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    setError(null)
    setPending(true)
    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') ?? '')
    try {
      await signIn('resend-otp', formData)
      setCode('')
      setStep({ email })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send code')
    } finally {
      setPending(false)
    }
  }

  async function handleVerifyCode(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    if (step === 'email') return
    setError(null)
    setPending(true)
    // Build FormData without a hidden `email` input — browsers otherwise autofill
    // the code field with the address from that hidden field.
    const formData = new FormData()
    formData.set('email', step.email)
    formData.set('code', code.trim())
    try {
      await signIn('resend-otp', formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex h-full min-h-screen items-center justify-center bg-surface px-6">
      <div className="w-full max-w-sm border border-ui bg-card p-6 shadow-hard">
        <h1 className="font-display text-2xl font-bold text-primary">Sediment</h1>
        <p className="mt-1 font-sans text-sm text-secondary">
          {step === 'email'
            ? 'Enter your email for a one-time sign-in code'
            : `Enter the code sent to ${step.email}`}
        </p>

        {step === 'email' ? (
          <form className="mt-6 flex flex-col gap-3" onSubmit={(e) => void handleSendCode(e)}>
            <label className="flex flex-col gap-1 font-sans text-xs text-muted">
              Email
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                autoFocus
                className="border border-ui bg-surface px-3 py-2 font-sans text-sm text-primary outline-none focus:border-primary"
              />
            </label>

            {error ? <p className="font-sans text-xs text-iron">{error}</p> : null}

            <button
              type="submit"
              disabled={pending}
              className="mt-2 border border-ui bg-accent px-3 py-2 font-sans text-sm text-accent-fg transition-opacity disabled:opacity-60"
            >
              {pending ? 'Sending…' : 'Send code'}
            </button>
          </form>
        ) : (
          <form
            key={`code-${step.email}`}
            className="mt-6 flex flex-col gap-3"
            autoComplete="off"
            onSubmit={(e) => void handleVerifyCode(e)}
          >
            <label className="flex flex-col gap-1 font-sans text-xs text-muted">
              Code
              <input
                name="code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                required
                autoComplete="one-time-code"
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="border border-ui bg-surface px-3 py-2 font-mono text-sm tracking-widest text-primary outline-none focus:border-primary"
              />
            </label>

            {error ? <p className="font-sans text-xs text-iron">{error}</p> : null}

            <button
              type="submit"
              disabled={pending}
              className="mt-2 border border-ui bg-accent px-3 py-2 font-sans text-sm text-accent-fg transition-opacity disabled:opacity-60"
            >
              {pending ? 'Checking…' : 'Continue'}
            </button>

            <button
              type="button"
              className="font-sans text-xs text-secondary underline-offset-2 hover:text-primary hover:underline"
              onClick={() => {
                setError(null)
                setCode('')
                setStep('email')
              }}
            >
              Use a different email
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
