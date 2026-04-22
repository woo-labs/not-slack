import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/stores/authStore"
import { LoginPage } from "@/components/auth/LoginPage"
import { Sidebar } from "@/components/layout/Sidebar"
import { ChatArea } from "@/components/chat/ChatArea"
import { ThreadPanel } from "@/components/chat/ThreadPanel"

function App() {
  const { user, setUser } = useAuthStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [setUser])

  if (loading) return null

  if (!user) return <LoginPage />

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar />
      <ChatArea />
      <ThreadPanel />
    </div>
  )
}

export default App
