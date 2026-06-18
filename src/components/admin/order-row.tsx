"use client";

import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils";

const statusColor: Record<string, string> = {
  unfulfilled: "bg-amber-100 text-amber-700",
  fulfilled: "bg-brand-100 text-brand-700",
};

export type OrderRowData = {
  id: string;
  orderNumber: string;
  email: string;
  createdAt: string; // ISO
  itemCount: number;
  status: string;
  paymentStatus: string;
  total: number;
};

export function OrderRow({ order }: { order: OrderRowData }) {
  const router = useRouter();
  const go = () => router.push(`/admin/orders/${order.id}`);

  return (
    <tr onClick={go} className="cursor-pointer hover:bg-brand-50/40">
      <td className="px-4 py-3 font-semibold text-brand-700">{order.orderNumber}</td>
      <td className="px-4 py-3 text-muted-foreground">{order.email}</td>
      <td className="px-4 py-3 text-muted-foreground">
        {new Date(order.createdAt).toLocaleString("en-ZA", {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: "Africa/Johannesburg",
        })}
      </td>
      <td className="px-4 py-3">{order.itemCount}</td>
      <td className="px-4 py-3">
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${statusColor[order.status] ?? "bg-gray-100"}`}>
          {order.status}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${order.paymentStatus === "paid" ? "bg-brand-100 text-brand-700" : "bg-red-100 text-red-700"}`}>
          {order.paymentStatus}
        </span>
      </td>
      <td className="px-4 py-3 text-right font-medium">{formatPrice(order.total)}</td>
    </tr>
  );
}
