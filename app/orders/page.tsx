"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type OrderItem = { 
  id: string; 
  quantity: number; 
  unit_price: number; 
  products: { name: string; price: number; image_url?: string; images?: string[] }; 
};

type Order = { 
  id: string; 
  status: string; 
  payment_method?: string; 
  total_amount: number; 
  shipping_address: any; 
  created_at: string; 
  order_items: OrderItem[]; 
};

// 🟢 FIX: 'pending' ko hamesha ke liye hata diya gaya hai
const STATUS_STEPS = ["confirmed", "processing", "shipped", "delivered"];
const CANCEL_REASONS = [
  "Order placed by mistake",
  "Expected delivery time is too long",
  "Found a better price elsewhere",
  "Change of mind",
  "Something else"
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingOrderId, setViewingOrderId] = useState<string | null>(null);
  const viewingOrder = orders.find((o) => o.id === viewingOrderId);

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [reasonType, setReasonType] = useState(CANCEL_REASONS[0]);
  const [customReason, setCustomReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchOrders(); }, []);

  async function fetchOrders() {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const json = await res.json();
        setOrders(json.data || []);
      }
    } finally { 
      setLoading(false); 
    }
  }

  function openCancelModal(orderId: string) {
    setSelectedOrderId(orderId);
    setReasonType(CANCEL_REASONS[0]);
    setCustomReason("");
    setCancelModalOpen(true);
  }

  async function submitCancelRequest() {
    if (!selectedOrderId) return;
    const finalReason = reasonType === "Something else" ? customReason : reasonType;
    if (reasonType === "Something else" && !customReason.trim()) return alert("Please enter reason.");

    setSubmitting(true);
    try {
      const res = await fetch(`/api/orders/${selectedOrderId}/request-cancel`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason: finalReason })
      });
      const json = await res.json();
      if (json.success) {
        setOrders(prev => prev.map(o => o.id === selectedOrderId ? { ...o, status: "cancellation_requested" } : o));
        setCancelModalOpen(false);
      } else {
        alert("Failed: " + json.error);
      }
    } catch (err) {
      alert("Error cancelling order");
    } finally { 
      setSubmitting(false); 
    }
  }

  // Exact Price Breakdown Calculation
  const calculatePriceDetails = (order: Order) => {
    const itemTotal = order.order_items?.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0) || 0;
    const platformFee = 5;
    const codFee = order.payment_method === 'COD' ? 15 : 0;
    const expectedTotal = itemTotal + platformFee + codFee;
    const discount = expectedTotal > order.total_amount ? expectedTotal - order.total_amount : 0;
    return { itemTotal, platformFee, codFee, discount };
  };

  const getStatusColor = (status: string) => {
    if (status === 'delivered') return 'bg-green-600';
    if (status === 'cancelled') return 'bg-red-600';
    if (status === 'cancellation_requested') return 'bg-orange-500';
    return 'bg-blue-600';
  };

  return (
    <div className="min-h-screen bg-[#f1f3f6] pb-20">
      
      {/* Cancel Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Cancel Order</h3>
            <p className="text-sm text-gray-500 mb-6">Select reason for cancellation.</p>
            <div className="space-y-4 mb-8">
              <select value={reasonType} onChange={e => setReasonType(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-300 outline-none text-sm font-medium">
                {CANCEL_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              {reasonType === "Something else" && (
                <textarea value={customReason} onChange={e => setCustomReason(e.target.value)} placeholder="Type reason..." rows={3} className="w-full px-4 py-3 rounded-lg border border-gray-300 outline-none text-sm resize-none" />
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setCancelModalOpen(false)} className="flex-1 py-3 bg-gray-100 font-bold rounded-lg hover:bg-gray-200">Go Back</button>
              <button onClick={submitCancelRequest} disabled={submitting} className={`flex-1 py-3 font-bold text-white rounded-lg ${submitting ? "bg-amber-400" : "bg-red-600 hover:bg-red-700"}`}>{submitting ? "Sending..." : "Submit Request"}</button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {!viewingOrder ? (
          <div className="mb-6 flex items-center gap-3 border-b border-gray-200 pb-4">
            <Link href="/profile" className="flex items-center justify-center w-8 h-8 bg-white border border-gray-200 rounded-full text-gray-500 hover:text-amber-800 shadow-sm"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg></Link>
            <h1 className="text-xl font-bold text-gray-900">My Orders</h1>
          </div>
        ) : (
          <div className="mb-6 flex items-center gap-3 border-b border-gray-200 pb-4">
            <button onClick={() => setViewingOrderId(null)} className="flex items-center justify-center w-8 h-8 bg-white border border-gray-200 rounded-full text-gray-500 hover:text-amber-800 shadow-sm"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg></button>
            <h1 className="text-xl font-bold text-gray-900">Order Details</h1>
          </div>
        )}

        {loading ? ( 
          <div className="animate-pulse space-y-4"><div className="h-28 bg-gray-200 rounded-xl"></div><div className="h-28 bg-gray-200 rounded-xl"></div></div>
        ) : orders.length === 0 ? ( 
          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center mt-6">
            <p className="text-gray-900 font-bold text-2xl mb-2">No orders yet</p>
            <Link href="/" className="bg-[#2874f0] text-white px-8 py-3 rounded-sm font-bold mt-4 inline-block">Start Shopping</Link>
          </div>
        ) : !viewingOrder ? (
          <div className="space-y-4">
            {orders.map(order => {
              const firstItem = order.order_items?.[0];
              const imgUrl = firstItem?.products?.image_url || firstItem?.products?.images?.[0];
              return (
                <div key={order.id} onClick={() => setViewingOrderId(order.id)} className="bg-white border border-gray-200 rounded-sm p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all">
                  <div className="w-20 h-20 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0 p-2">
                    {imgUrl ? <img src={imgUrl} className="w-full h-full object-contain" /> : <span className="text-gray-300">No Image</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-sm line-clamp-1">{firstItem?.products?.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">Order on {new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1.5 mb-1 justify-end">
                      <span className={`w-2 h-2 rounded-full ${getStatusColor(order.status)}`}></span>
                      <span className="font-bold text-[12px] text-gray-800 capitalize">{order.status.replace('_', ' ')}</span>
                    </div>
                    <span className="font-bold text-sm text-gray-900">₹{order.total_amount}</span>
                  </div>
                  <div className="hidden sm:block text-gray-400"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-white border border-gray-200 rounded-sm overflow-hidden shadow-sm">
              <div className="bg-gray-50 px-6 py-4 grid grid-cols-2 md:grid-cols-3 gap-4 border-b border-gray-200">
                <div>
                  <p className="text-[11px] font-bold text-gray-500 uppercase">Order ID</p>
                  <p className="font-bold text-gray-900 text-sm">#{viewingOrder.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-500 uppercase">Order Date</p>
                  <p className="font-bold text-gray-900 text-sm">{new Date(viewingOrder.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <div className="col-span-2 md:col-span-1 md:text-right">
                  <p className="text-[11px] font-bold text-gray-500 uppercase">Total Amount</p>
                  <p className="font-black text-gray-900 text-lg">₹{viewingOrder.total_amount.toFixed(2)}</p>
                </div>
              </div>

              <div className="p-6 md:p-8">
                
                {viewingOrder.status === "cancelled" ? (
                  <div className="mb-10 bg-red-50 text-red-700 p-4 font-bold text-center border border-red-200">Order Cancelled</div>
                ) : viewingOrder.status === "cancellation_requested" ? (
                  <div className="mb-10 bg-orange-50 text-orange-700 p-4 font-bold border border-orange-200">Cancellation Request Sent</div>
                ) : (
                  <div className="mb-12 pt-6">
                    <div className="relative flex justify-between items-center w-full max-w-2xl mx-auto">
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[3px] bg-gray-200 z-0"></div>
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-[3px] bg-[#26a541] z-0 transition-all duration-1000" style={{ width: `${(Math.max(STATUS_STEPS.indexOf(viewingOrder.status), 0) / (STATUS_STEPS.length - 1)) * 100}%` }}></div>
                      {STATUS_STEPS.map((step, index) => {
                        const isCompleted = index <= STATUS_STEPS.indexOf(viewingOrder.status);
                        return (
                          <div key={step} className="relative z-10 flex flex-col items-center gap-2">
                            <div className={`w-4 h-4 rounded-full border-[3px] ${isCompleted ? "bg-[#26a541] border-[#26a541]" : "bg-white border-gray-300"}`}></div>
                            <span className={`text-[12px] font-bold capitalize absolute -bottom-7 whitespace-nowrap ${isCompleted ? "text-[#26a541]" : "text-gray-400"}`}>{step}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex flex-col lg:flex-row gap-8">
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 pb-2 border-b">Items in this order</h3>
                    <div className="space-y-4">
                      {viewingOrder.order_items?.map((item) => (
                        <div key={item.id} className="flex gap-4 items-center">
                          <div className="w-16 h-16 bg-gray-50 border p-1 shrink-0"><img src={item.products?.image_url || ""} className="w-full h-full object-contain" /></div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 text-sm line-clamp-2">{item.products?.name}</h4>
                            <p className="text-xs text-gray-500 mt-1">Qty: {item.quantity} × ₹{item.unit_price}</p>
                          </div>
                          <div className="font-bold text-gray-900 text-sm">₹{(item.unit_price * item.quantity).toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="w-full lg:w-[350px] shrink-0 space-y-6">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 mb-4 pb-2 border-b">Delivery Address</h3>
                      <div className="text-sm text-gray-700">
                        <p className="font-bold text-gray-900">{viewingOrder.shipping_address.full_name}</p>
                        <p className="mt-1">{viewingOrder.shipping_address.address_line1}, {viewingOrder.shipping_address.city}, {viewingOrder.shipping_address.state} - <span className="font-bold text-gray-900">{viewingOrder.shipping_address.pincode}</span></p>
                        <p className="mt-2 font-medium">Phone: {viewingOrder.shipping_address.phone}</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-gray-900 mb-4 pb-2 border-b">Price Details</h3>
                      <div className="text-[13px] text-gray-700 space-y-3">
                        <div className="flex justify-between"><span>List Price</span><span>₹{calculatePriceDetails(viewingOrder).itemTotal.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span>Platform Fee</span><span>+ ₹{calculatePriceDetails(viewingOrder).platformFee.toFixed(2)}</span></div>
                        {calculatePriceDetails(viewingOrder).codFee > 0 && <div className="flex justify-between"><span>COD Handling</span><span>+ ₹{calculatePriceDetails(viewingOrder).codFee.toFixed(2)}</span></div>}
                        {calculatePriceDetails(viewingOrder).discount > 0 && <div className="flex justify-between text-green-600 font-medium"><span>Discount Applied</span><span>- ₹{calculatePriceDetails(viewingOrder).discount.toFixed(2)}</span></div>}
                        <div className="flex justify-between items-center font-bold text-gray-900 text-[15px] pt-3 border-t border-dashed"><span>Total Amount</span><span>₹{viewingOrder.total_amount.toFixed(2)}</span></div>
                      </div>
                    </div>
                  </div>
                </div>

                {!["cancelled", "cancellation_requested"].includes(viewingOrder.status) && (
                  <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                    <button onClick={() => openCancelModal(viewingOrder.id)} disabled={["shipped", "delivered"].includes(viewingOrder.status)} className={`px-6 py-2.5 font-bold text-sm rounded-sm ${["shipped", "delivered"].includes(viewingOrder.status) ? "text-gray-400 cursor-not-allowed" : "text-[#2874f0] border border-[#2874f0] hover:bg-blue-50"}`}>
                      {["shipped", "delivered"].includes(viewingOrder.status) ? "Cannot Cancel" : "Cancel Order"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}