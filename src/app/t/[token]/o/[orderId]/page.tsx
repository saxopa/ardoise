import OrderTracker from "./order-tracker";

export const metadata = { title: "Votre commande — Ardoise" };

export default async function OrderStatusPage({
  params,
}: {
  params: Promise<{ token: string; orderId: string }>;
}) {
  const { token, orderId } = await params;
  return <OrderTracker token={token} orderId={orderId} />;
}
