import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink font-display text-[13px] font-semibold text-white">
          G
        </div>
        <span className="font-display text-[16px] font-semibold text-ink">GetMade</span>
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
