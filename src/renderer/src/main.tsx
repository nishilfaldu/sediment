import './assets/main.css'

import { ConvexAuthProvider } from '@convex-dev/auth/react'
import { Authenticated, AuthLoading, ConvexReactClient, Unauthenticated } from 'convex/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app'
import { SignInForm } from './components/auth/sign-in-form'

const convexUrl = import.meta.env.VITE_CONVEX_URL

if (!convexUrl) {
  throw new Error(
    'Missing VITE_CONVEX_URL. Run `bunx convex dev` to create .env.local, then restart the app.'
  )
}

const convex = new ConvexReactClient(convexUrl)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConvexAuthProvider client={convex}>
      <AuthLoading>
        <div className="flex h-full min-h-screen items-center justify-center bg-surface font-mono text-xs text-ghost">
          Loading…
        </div>
      </AuthLoading>
      <Unauthenticated>
        <SignInForm />
      </Unauthenticated>
      <Authenticated>
        <App />
      </Authenticated>
    </ConvexAuthProvider>
  </StrictMode>
)
