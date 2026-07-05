import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext({})

const OPERATOR_EMAIL = 'michelle@clairenhaus.com'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [client, setClient] = useState(null)
  const [isOperator, setIsOperator] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleSession(session) {
    if (!session?.user) {
      setUser(null)
      setClient(null)
      setIsOperator(false)
      setLoading(false)
      return
    }

    const u = session.user
    setUser(u)
    setIsOperator(u.email === OPERATOR_EMAIL)

    if (u.email !== OPERATOR_EMAIL) {
      const { data } = await supabase
        .from('clients')
        .select('*')
        .eq('email', u.email)
        .single()
      setClient(data)
    }

    setLoading(false)
  }

  async function signInWithGoogle() {
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
  }

  async function signInWithEmail(email, password) {
    return supabase.auth.signInWithPassword({ email, password })
  }

  async function signUpWithEmail(email, password) {
    return supabase.auth.signUp({ email, password })
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{
      user, client, isOperator, loading,
      signInWithGoogle, signInWithEmail, signUpWithEmail, signOut
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
