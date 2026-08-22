import Link from "next/link";
import { signInAction } from "@/app/actions/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <Card>
      <CardHeader className="flex-col items-start pb-4">
        <CardTitle className="text-[19px]">Log in</CardTitle>
        <CardDescription>Welcome back — your receptionist missed you.</CardDescription>
      </CardHeader>
      <CardContent>
        {searchParams.error && (
          <div className="mb-4 rounded-lg border border-danger/20 bg-danger-soft px-3 py-2 text-[12.5px] text-danger">
            {searchParams.error}
          </div>
        )}
        <form action={signInAction} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required placeholder="you@business.com" className="mt-1.5" />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/forgot-password" className="text-[12px] font-medium text-brand hover:underline">
                Forgot password?
              </Link>
            </div>
            <Input id="password" name="password" type="password" required placeholder="••••••••" className="mt-1.5" />
          </div>
          <Button type="submit" variant="brand" className="w-full">
            Log in
          </Button>
        </form>
        <p className="mt-5 text-center text-[13px] text-text-muted">
          New to HavnLine?{" "}
          <Link href="/signup" className="font-medium text-brand hover:underline">
            Create an account
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
