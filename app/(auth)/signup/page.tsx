import Link from "next/link";
import { signUpAction } from "@/app/actions/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function SignupPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <Card>
      <CardHeader className="flex-col items-start pb-4">
        <CardTitle className="text-[19px]">Create your account</CardTitle>
        <CardDescription>Takes about 5 minutes to get your receptionist live.</CardDescription>
      </CardHeader>
      <CardContent>
        {searchParams.error && (
          <div className="mb-4 rounded-lg border border-danger/20 bg-danger-soft px-3 py-2 text-[12.5px] text-danger">
            {searchParams.error}
          </div>
        )}
        <form action={signUpAction} className="space-y-4">
          <div>
            <Label htmlFor="fullName">Your name</Label>
            <Input id="fullName" name="fullName" type="text" required placeholder="Jamie Rivera" className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="email">Work email</Label>
            <Input id="email" name="email" type="email" required placeholder="you@business.com" className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required minLength={8} placeholder="At least 8 characters" className="mt-1.5" />
          </div>
          <Button type="submit" variant="brand" className="w-full">
            Create account
          </Button>
        </form>
        <p className="mt-4 text-center text-[11.5px] text-text-faint">
          By creating an account, you agree to our{" "}
          <Link href="/policies" className="underline hover:text-text-muted">
            Terms and Privacy Policy
          </Link>
          .
        </p>
        <p className="mt-5 text-center text-[13px] text-text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand hover:underline">
            Log in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
