// Remonté à chaque navigation : donne une entrée douce à chaque écran.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="h-full animate-rise">{children}</div>;
}
