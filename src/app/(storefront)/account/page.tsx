import Link from "next/link";
import { UserCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = { title: "My Account" };

export default function AccountPage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col items-center px-4 py-24 text-center">
      <div className="rounded-full bg-brand-50 p-6">
        <UserCircle2 className="h-10 w-10 text-brand-500" />
      </div>
      <h1 className="mt-6 text-2xl font-semibold">Accounts coming soon</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        Customer accounts, order history and saved addresses are on the way. For
        now you can check out as a guest — your order confirmation and invoice
        are emailed to you.
      </p>
      <Link href="/products" className="mt-6">
        <Button size="lg">Continue shopping</Button>
      </Link>
    </div>
  );
}
