import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export function UserAvatar({
  firstName,
  lastName,
  avatarUrl,
  className,
}: {
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  className?: string;
}) {
  const initials =
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "?";
  return (
    <Avatar className={cn("border border-border", className)}>
      {avatarUrl && <AvatarImage src={avatarUrl} alt={`${firstName} ${lastName}`} />}
      <AvatarFallback className="bg-primary/15 text-xs font-bold text-primary">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
