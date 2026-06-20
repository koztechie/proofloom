import Link from "next/link"
import { Logo } from "@/components/shared/logo"

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
  footer: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="container flex h-16 items-center">
        <Link href="/" className="flex items-center gap-2">
          <Logo className="size-7" />
          <span className="text-lg font-semibold tracking-tight">ProofLoom</span>
        </Link>
      </div>
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="flex w-full max-w-sm flex-col gap-6">
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
          {children}
          <p className="text-center text-sm text-muted-foreground">{footer}</p>
        </div>
      </main>
    </div>
  )
}
