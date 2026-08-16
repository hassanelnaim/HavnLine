import Link from "next/link";
import { resetPasswordAction } from "@/app/actions/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: { error?: string; sent?: string };
}) {
  return (
    <Card>
      <CardHeader className="flex-col items-start pb-4">
        <CardTitle className="text-[19px]">Reset your password</CardTitle>
        <CardDescription>We&apos;ll email you a link to set a new one.</CardDescription>
      </CardHeader>
      <CardContent>
        {searchParams.error && (
          <div className="mb-4 rounded-lg border border-danger/20 bg-danger-soft px-3 py-2 text-[12.5px] text-danger">
            {searchParams.error}
          </div>
        )}
        {searchParams.sent && (
          <div className="mb-4 rounded-lg border border-success/20 bg-success-soft px-3 py-2 text-[12.5px] text-success">
            If that email has an account, a reset link is on its way.
          </div>
        )}
        <form action={resetPasswordAction} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required placeholder="you@business.com" className="mt-1.5" />
          </div>
          <Button type="submit" variant="brand" className="w-full">
            Send reset link
          </Button>
        </form>
        <p className="mt-5 text-center text-[13px] text-text-muted">
          <Link href="/login" className="font-medium text-brand hover:underline">
            Back to log in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
