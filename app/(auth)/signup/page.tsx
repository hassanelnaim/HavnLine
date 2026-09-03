import Link from "next/link";
import { signUpAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignupPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div>
      <h1 className="font-display text-[22px] font-semibold text-ink">Create your account</h1>
      <p className="mt-1 text-[13px] text-text-muted">Set up your AI receptionist in minutes.</p>

      {searchParams.error && (
        <div className="mt-4 rounded-lg border border-danger/20 bg-danger-soft px-3.5 py-2.5 text-[12.5px] text-danger">
          {searchParams.error}
        </div>
      )}

      <form action={signUpAction} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" name="fullName" required className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" required minLength={8} className="mt-1.5" />
        </div>
        <Button type="submit" variant="brand" className="w-full">Create account</Button>
      </form>

      <p className="mt-4 text-center text-[11.5px] text-text-faint">
        By creating an account, you agree to our{" "}
        <Link href="/terms" className="underline hover:text-text-muted">Terms</Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline hover:text-text-muted">Privacy Policy</Link>.
      </p>

      <p className="mt-5 text-center text-[13px] text-text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-brand hover:underline">Log in</Link>
      </p>
    </div>
  );
}
