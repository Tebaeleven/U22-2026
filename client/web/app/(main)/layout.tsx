import { Navbar } from "@/components/shared/navbar"
import { Footer } from "@/components/shared/footer"
import { createClient } from "@/lib/supabase/server"
import { getUnreadNotificationCount } from "@/lib/supabase/queries"

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let navbarUser = null
  let unreadCount = 0
  if (user) {
    const [profile, count] = await Promise.all([
      supabase
        .from("profiles")
        .select("username, display_name")
        .eq("id", user.id)
        .single(),
      getUnreadNotificationCount(),
    ])

    navbarUser = profile.data
      ? { username: profile.data.username, displayName: profile.data.display_name }
      : { username: user.user_metadata?.username ?? "user", displayName: user.user_metadata?.username ?? "user" }
    unreadCount = count
  }

  return (
    <>
      <Navbar user={navbarUser} unreadCount={unreadCount} />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  )
}
