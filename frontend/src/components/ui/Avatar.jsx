const sizes = {
  sm: "h-8 w-8 text-[11px]",
  md: "h-9 w-9 text-xs",
  lg: "h-11 w-11 text-sm",
};

export function Avatar({ name = "User", src, size = "md", className = "" }) {
  const initials = name
    ?.split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (src) {
    return <img src={src} alt={name} className={`${sizes[size]} rounded-full object-cover ${className}`} />;
  }

  return (
    <div
      className={`flex ${sizes[size]} items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 font-bold text-white ${className}`}
      aria-label={name}
      role="img"
    >
      {initials}
    </div>
  );
}
