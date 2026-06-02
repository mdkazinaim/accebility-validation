import { cn } from "@/lib/utils";
import { Tooltip } from "@/common/Tooltip";

interface AvatarProps {
  src?: string;
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const Avatar = ({ src, name, size = "lg", className }: AvatarProps) => {
  const sizeClasses = {
    sm: "h-6 w-6 text-[10px]",
    md: "h-8 w-8 text-xs",
    lg: "h-10 w-10 text-sm",
  };

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-full border-2 border-border shadow-sm items-center justify-center font-bold transition-all duration-200",
        sizeClasses[size],
        src ? "bg-light-background" : "bg-light-background text-primary-text",
        className,
      )}
    >
      {src ? (
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
};

interface AvatarStackProps {
  users: { src?: string; name: string }[];
  limit?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const AvatarStack = ({
  users,
  limit = 3,
  size = "lg",
  className,
}: AvatarStackProps) => {
  const displayUsers = users.slice(0, limit);
  const remaining = users.length - limit;

  return (
    <div className={cn("flex items-center -space-x-3", className)}>
      {displayUsers.map((user, idx) => (
        <Tooltip key={idx} content={user.name} className="z-[110]">
          <Avatar
            src={user.src}
            name={user.name}
            size={size}
            className="ring-2 ring-primary-background hover:z-10 hover:-translate-y-0.5 transition-transform duration-200 cursor-pointer"
          />
        </Tooltip>
      ))}
      {remaining > 0 && (
        <Tooltip content={users.slice(limit).map(u => u.name).join(", ")} className="z-[110]">
          <Avatar
            name={`+${remaining}`}
            size={size}
            className="bg-secondary-brand/10 border-secondary-brand/20 text-secondary-brand ring-2 ring-primary-background z-0"
          />
        </Tooltip>
      )}
    </div>
  );
};
