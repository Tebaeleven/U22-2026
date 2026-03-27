import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface UserAvatarProps {
  username: string
  displayName: string
  avatarUrl?: string
  className?: string
}

export function UserAvatar({
  displayName,
  avatarUrl,
  className,
}: UserAvatarProps) {
  const initial = displayName.charAt(0)

  return (
    <Avatar className={cn("size-8", className)}>
      {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
      <AvatarFallback className="bg-[#4d97ff] text-white text-xs">
        {initial}
      </AvatarFallback>
    </Avatar>
  )
}
