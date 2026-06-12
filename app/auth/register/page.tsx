import Link from "next/link"
import type { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { AuthShell } from "@/components/auth-shell"

export const metadata: Metadata = {
  title: "Create account — ProofLoom",
}

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="Start building a verifiable track record today."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/auth/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <Card>
        <CardContent className="pt-6">
          <form className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="handle">Username</Label>
              <Input id="handle" type="text" placeholder="devloom" autoComplete="username" />
              <p className="text-xs text-muted-foreground">
                Your public profile will live at proofloom.app/u/your-handle
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" autoComplete="email" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" autoComplete="new-password" />
            </div>
            <Button type="submit" className="mt-2 w-full" asChild>
              <Link href="/dashboard">Create account</Link>
            </Button>
          </form>
        </CardContent>
      </Card>
    </AuthShell>
  )
}
