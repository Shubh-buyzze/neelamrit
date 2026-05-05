"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type OrderItem = { 
  id: string; 
  quantity: number; 
  unit_price: number; 
  products: { 
    name: string; 
    price: number; 
    image_url?: string; 
    images?: string[] 
  }; 
};

type Order = { 
  id: string; 
  status: string; 
  payment_method?: string; // Added to check for COD
  total_amount: number; 
  shipping_address: any; 
  created_at: string; 
  order_items: OrderItem[]; 
};

const STATUS_STEPS = ["pending", "confirmed", "processing", "shipped", "delivered"];
const CANCEL_REASONS = [
  "Order placed by mistake",
  "Expected delivery time is too long",
  "Found a better price elsewhere",
  "Change of mind",
  "Item no longer needed",
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

  useEffect(() => { 
    fetchOrders(); 
  }, []);

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
    if (reasonType === "Something else" && !customReason.trim()) {
      return alert("Please enter your reason.");
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/orders/${selectedOrderId}/request-cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: finalReason })
      });
      const json = await res.json();

      if (json.success) {
        setOrders(prev => prev.map(o => o.id === selectedOrderId ? { ...o, status: "cancellation_requested" } : o));
        setCancelModalOpen(false);
      } else {
        alert("Failed: " + json.error);
      }
    } catch (err) {
      alert("Network Error");
    } finally { 
      setSubmitting(false); 
    }
  }

  const getDeliveryDisplay = (dateStr: string, status: string) => {
    if (!dateStr) return null;
    const orderDate = new Date(dateStr);
    const formatOpts = { day: 'numeric', month: 'short', year: 'numeric' } as const;
    
    if (status === 'delivered') {
      return <span className="text-green-600">Delivered on {orderDate.toLocaleDateString('en-US', formatOpts)}</span>;
    }
    if (status === 'cancelled' || status === 'cancellation_requested') {
      return <span className="text-red-600">Cancelled on {orderDate.toLocaleDateString('en-US', formatOpts)}</span>;
    }
    
    const expectedDate = new Date(orderDate);
    expectedDate.setDate(expectedDate.getDate() + 3);
    
    return (
      <span className="text-gray-700">
        Delivery expected by <span className="font-bold text-gray-900">{expectedDate.toLocaleDateString('en-US', formatOpts)}</span>
      </span>
    );
  };

  const getStatusColor = (status: string) => {
    if (status === 'delivered') return 'bg-green-500';
    if (status === 'cancelled') return 'bg-red-500';
    if (status === 'cancellation_requested') return 'bg-orange-500';
    return 'bg-blue-500';
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      
      {cancelModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Cancel Order</h3>
            <p className="text-sm text-gray-500 mb-6">Please tell us why you want to cancel this order.</p>

            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Select Reason</label>
                <select 
                  value={reasonType} 
                  onChange={e => setReasonType(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-1 focus:ring-amber-700 focus:border-amber-700 outline-none text-sm font-medium"
                >
                  {CANCEL_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {reasonType === "Something else" && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Your Reason</label>
                  <textarea 
                    value={customReason}
                    onChange={e => setCustomReason(e.target.value)}
                    placeholder="Type your reason here..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-1 focus:ring-amber-700 focus:border-amber-700 outline-none text-sm resize-none"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setCancelModalOpen(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors"
              >
                Go Back
              </button>
              <button 
                onClick={submitCancelRequest}
                disabled={submitting}
                className={`flex-1 py-3 font-bold text-white rounded-lg transition-colors shadow-sm ${
                  submitting ? "bg-amber-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {submitting ? "Sending..." : "Submit Request"}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {!viewingOrder ? (
          <div className="mb-6 flex items-center gap-3 border-b border-gray-200 pb-4">
            <Link href="/profile" className="flex flex-shrink-0 items-center justify-center w-8 h-8 bg-white border border-gray-200 rounded-full text-gray-500 hover:text-amber-800 hover:bg-amber-50 transition-colors shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
            </Link>
            <h1 className="text-lg font-normal text-gray-800 tracking-wide">My Orders</h1>
          </div>
        ) : (
          <div className="mb-6 flex items-center gap-3 border-b border-gray-200 pb-4">
            <button onClick={() => setViewingOrderId(null)} className="flex flex-shrink-0 items-center justify-center w-8 h-8 bg-white border border-gray-200 rounded-full text-gray-500 hover:text-amber-800 hover:bg-amber-50 transition-colors shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <h1 className="text-lg font-normal text-gray-800 tracking-wide">Order Details</h1>
          </div>
        )}

        {loading ? ( 
          <div className="animate-pulse space-y-4">
            <div className="h-28 bg-gray-200 rounded-xl w-full"></div>
            <div className="h-28 bg-gray-200 rounded-xl w-full"></div>
            <div className="h-28 bg-gray-200 rounded-xl w-full"></div>
          </div>
        ) : orders.length === 0 ? ( 
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-16 text-center shadow-sm flex flex-col items-center mt-6">
            <svg className="w-20 h-20 text-gray-300 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            <p className="text-gray-900 font-bold text-2xl mb-2">No orders yet</p>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto text-sm">Looks like you haven't tasted our premium sweets yet.</p>
            <Link href="/" className="bg-amber-800 text-white px-8 py-3.5 rounded-lg font-bold shadow-sm hover:bg-amber-900 transition-all">
              Start Shopping
            </Link>
          </div>
        ) : !viewingOrder ? (
          <div className="space-y-4">
            {orders.map(order => {
              const firstItem = order.order_items?.[0];
              const additionalItemsCount = (order.order_items?.length || 1) - 1;
              const imgUrl = firstItem?.products?.image_url || firstItem?.products?.images?.[0];

              return (
                <div 
                  key={order.id} 
                  onClick={() => setViewingOrderId(order.id)}
                  className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 sm:gap-6 cursor-pointer hover:shadow-md hover:border-amber-300 transition-all group"
                >
                  <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gray-50 border border-gray-100 rounded-md flex items-center justify-center overflow-hidden flex-shrink-0">
                    {imgUrl ? (
                      <img src={imgUrl} alt={firstItem?.products?.name || "Product"} className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col justify-center min-w-0">
                    <p className="text-[11px] sm:text-xs mb-1 tracking-wide">
                      {getDeliveryDisplay(order.created_at, order.status)}
                    </p>
                    <h3 className="font-bold text-gray-900 text-sm sm:text-base group-hover:text-amber-800 transition-colors line-clamp-2">
                      {firstItem?.products?.name || "Unknown Product"}
                    </h3>
                    {additionalItemsCount > 0 && (
                      <span className="text-[10px] sm:text-xs font-bold text-gray-500 mt-1.5 bg-gray-100 px-2 py-0.5 rounded-full inline-block w-max">
                        + {additionalItemsCount} more item{additionalItemsCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col justify-center sm:border-l sm:border-gray-100 sm:pl-6 min-w-[80px] sm:min-w-[120px] text-right sm:text-left flex-shrink-0">
                    <div className="flex items-center justify-end sm:justify-start gap-1.5">
                      <span className={`w-2 h-2 rounded-full shadow-sm flex-shrink-0 ${getStatusColor(order.status)}`}></span>
                      <span className="font-bold text-[10px] sm:text-sm text-gray-800 capitalize tracking-wide truncate">
                        {order.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center justify-center text-gray-300 group-hover:text-amber-700 transition-colors flex-shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-gray-50 px-4 sm:px-6 py-4 grid grid-cols-2 sm:grid-cols-3 gap-4 border-b border-gray-200">
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Order ID</p>
                  <p className="font-bold text-gray-900 text-sm">#{viewingOrder.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Order Date</p>
                  <p className="font-bold text-gray-900 text-sm">
                    {new Date(viewingOrder.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="col-span-2 sm:col-span-1 sm:text-right">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Total Amount</p>
                  <p className="font-black text-amber-900 text-lg leading-none">₹{viewingOrder.total_amount}</p>
                </div>
              </div>

              <div className="p-4 sm:p-6 md:p-8">
                {/* 🟢 Status Tracking Messages Logic Updated */}
                {viewingOrder.status === "cancelled" ? (
                  <div className="mb-8 bg-red-50 text-red-700 p-4 rounded-md font-bold text-center border border-red-200 text-sm flex items-center justify-center gap-2">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                    {viewingOrder.payment_method === "COD" ? "Order Cancelled." : "Order Cancelled. Refund is being processed."}
                  </div>
                ) : viewingOrder.status === "cancellation_requested" ? (
                  <div className="mb-8 bg-orange-50 text-orange-700 p-4 rounded-md font-bold border border-orange-200 flex items-start gap-3 text-sm">
                    <svg className="w-6 h-6 animate-pulse flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <div>
                      <p className="text-base">Cancellation Request Sent</p>
                      <p className="text-xs font-medium text-orange-600 mt-1">
                        {viewingOrder.payment_method === "COD" 
                          ? "Your request is under review by admin. Order will be cancelled upon approval."
                          : "Your request is under review by admin. Refund will initiate upon approval."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mb-10 overflow-x-auto pb-6 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
                    <div className="relative flex justify-between items-center w-full min-w-[500px]">
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 rounded-full z-0"></div>
                      <div 
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-amber-600 rounded-full z-0 transition-all duration-1000"
                        style={{ width: `${(Math.max(STATUS_STEPS.indexOf(viewingOrder.status), 0) / (STATUS_STEPS.length - 1)) * 100}%` }}
                      ></div>

                      {STATUS_STEPS.map((step, index) => {
                        const currentStepIndex = STATUS_STEPS.indexOf(viewingOrder.status);
                        const isCompleted = index <= currentStepIndex;
                        const isActive = index === currentStepIndex;
                        return (
                          <div key={step} className="relative z-10 flex flex-col items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-colors ${
                              isCompleted ? "bg-amber-600 border-amber-600 text-white" : "bg-white border-gray-300 text-gray-400"
                            } ${isActive ? "ring-4 ring-amber-100" : ""}`}>
                              {isCompleted ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                              ) : index + 1}
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider absolute -bottom-6 whitespace-nowrap ${
                              isCompleted ? "text-amber-800" : "text-gray-400"
                            }`}>
                              {step}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
                  <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100 pb-2 mb-4">Items Ordered</h3>
                    <div className="space-y-4">
                      {viewingOrder.order_items?.map((item) => {
                        const imgUrl = item.products?.image_url || item.products?.images?.[0];
                        return (
                          <div key={item.id} className="flex gap-4 items-start sm:items-center">
                            <div className="w-16 h-16 sm:w-14 sm:h-14 bg-gray-50 border border-gray-100 rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                              {imgUrl ? (
                                <img src={imgUrl} alt={item.products?.name} className="w-full h-full object-cover" />
                              ) : (
                                <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-gray-900 text-sm line-clamp-2 leading-snug">{item.products?.name}</h4>
                              <p className="text-xs text-gray-500 mt-1">Qty: {item.quantity} × ₹{item.unit_price}</p>
                            </div>
                            <div className="font-bold text-gray-900 text-sm whitespace-nowrap">
                              ₹{(item.unit_price * item.quantity).toFixed(2)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100 pb-2 mb-4">Delivery Details</h3>
                    {viewingOrder.shipping_address && (
                      <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-md border border-gray-100">
                        <p className="font-bold text-gray-900 mb-1 text-base">{viewingOrder.shipping_address.full_name}</p>
                        <p className="mb-3 text-gray-600 flex items-center gap-1.5 font-medium break-words">
                          <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                          {viewingOrder.shipping_address.phone}
                        </p>
                        <p className="leading-relaxed break-words">
                          {viewingOrder.shipping_address.address_line1} {viewingOrder.shipping_address.address_line2 && `, ${viewingOrder.shipping_address.address_line2}`}<br />
                          {viewingOrder.shipping_address.city}, {viewingOrder.shipping_address.state} - <span className="font-bold text-gray-900">{viewingOrder.shipping_address.pincode}</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {!["cancelled", "cancellation_requested"].includes(viewingOrder.status) && (
                  <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                    <button 
                      onClick={() => openCancelModal(viewingOrder.id)}
                      disabled={["shipped", "delivered"].includes(viewingOrder.status)}
                      className={`w-full sm:w-auto px-6 py-2.5 font-bold text-sm rounded-md transition-colors shadow-sm ${
                        ["shipped", "delivered"].includes(viewingOrder.status)
                          ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                          : "bg-white text-red-600 border border-red-200 hover:bg-red-50"
                      }`}
                    >
                      {["shipped", "delivered"].includes(viewingOrder.status) 
                        ? "Cannot Cancel (Order Shipped)" 
                        : "Request Cancellation"}
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