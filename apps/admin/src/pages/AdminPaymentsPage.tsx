import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  useAuth,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
  Badge,
  ErrorDetailsAlert,
} from '@abrainoconscious/ui';
import {
  formatDateIST,
  formatPaise,
  fetchAdminOrders,
  fetchAdminRevenueStats,
} from '@abrainoconscious/shared';
import {
  CreditCard,
  RefreshCw,
  Search,
  Lock,
  Receipt,
  RotateCcw,
  Download,
  TrendingUp,
  Sparkles,
  Eye,
  Clock,
} from 'lucide-react';

export const AdminPaymentsPage: React.FC = () => {
  const { supabase, profile } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // 1. RBAC Guard: Admin Only (Staff strictly forbidden)
  if (profile && profile.role !== 'admin') {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center text-white">
        <div className="max-w-md rounded-2xl border border-rose-500/30 bg-[#081619] p-8 shadow-2xl space-y-4">
          <div className="h-12 w-12 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-white">Administrator Access Required</h2>
          <p className="text-xs text-[#8D9FA4] leading-relaxed">
            Financial orders, payments, and revenue telemetry are restricted exclusively to Administrators. Staff members do not have permission to access financial ledger screens.
          </p>
        </div>
      </div>
    );
  }

  // 2. Fetch Revenue Stats (Real zeros while payments on hold)
  const { data: revenueStats } = useQuery({
    queryKey: ['admin-revenue-stats'],
    queryFn: () => fetchAdminRevenueStats(supabase, '30d'),
    staleTime: 1000 * 60,
  });

  // 3. Fetch Orders List
  const {
    data: ordersData,
    isLoading: isLoadingOrders,
    isError: isOrdersError,
    error: ordersError,
    refetch: refetchOrders,
    isFetching: isFetchingOrders,
  } = useQuery({
    queryKey: ['admin-orders-list', searchQuery, statusFilter],
    queryFn: () =>
      fetchAdminOrders(supabase, {
        search: searchQuery || undefined,
        limit: 50,
      }),
    staleTime: 1000 * 30,
  });

  // 4. Fetch Payment Interest Lead Count by Program
  const { data: paymentInterestData = [] } = useQuery({
    queryKey: ['admin-payment-interest-panel'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('payment_interest')
        .select(`
          program_id,
          programs (
            id,
            title,
            type,
            category,
            price_paise
          )
        `);

      if (error) throw error;

      const grouped = new Map<string, { program: any; count: number }>();
      (data || []).forEach((row: any) => {
        const prog = Array.isArray(row.programs) ? row.programs[0] : row.programs;
        if (!prog) return;
        const existing = grouped.get(row.program_id) || { program: prog, count: 0 };
        existing.count++;
        grouped.set(row.program_id, existing);
      });

      return Array.from(grouped.values()).sort((a, b) => b.count - a.count);
    },
    staleTime: 1000 * 60,
  });

  const orders = ordersData?.orders || [];
  const filteredOrders = orders.filter((o: any) => {
    if (statusFilter === 'all') return true;
    return o.status === statusFilter;
  });

  const handleOpenDetail = (order: any) => {
    setSelectedOrder(order);
    setDetailModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1A373E] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-amber-500" />
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
              Orders & Payments
            </h1>
          </div>
          <p className="text-xs text-[#8D9FA4] mt-1">
            Transaction ledger, Razorpay order records, GST receipts, and payment interest demand.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchOrders()}
            disabled={isFetchingOrders}
            className="border-[#1A373E] bg-[#0E2024] text-xs text-[#8D9FA4] hover:text-white"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isFetchingOrders ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          {/* Disabled Action Buttons */}
          <div className="relative group">
            <Button
              variant="outline"
              size="sm"
              disabled
              className="border-[#1A373E] bg-[#0E2024]/40 text-xs text-[#8D9FA4]/50 cursor-not-allowed opacity-60"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              <span>Reconcile</span>
            </Button>
            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block whitespace-nowrap rounded bg-black/90 px-2 py-1 text-[10px] text-amber-300 border border-[#1A373E]">
              Available when payments go live
            </div>
          </div>

          <div className="relative group">
            <Button
              variant="outline"
              size="sm"
              disabled
              className="border-[#1A373E] bg-[#0E2024]/40 text-xs text-[#8D9FA4]/50 cursor-not-allowed opacity-60"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              <span>Export CSV</span>
            </Button>
            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block whitespace-nowrap rounded bg-black/90 px-2 py-1 text-[10px] text-amber-300 border border-[#1A373E]">
              Available when payments go live
            </div>
          </div>
        </div>
      </div>

      {/* Real Zero Revenue Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[#1A373E] bg-[#081619] p-4">
          <div className="flex items-center justify-between text-[#8D9FA4] text-xs mb-1">
            <span>Total Revenue</span>
            <TrendingUp className="h-4 w-4 text-amber-500" />
          </div>
          <div className="font-serif text-2xl font-bold text-white">
            ₹{((revenueStats?.total_revenue_paise || 0) / 100).toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-amber-400/80 mt-1">Available when payments go live</div>
        </div>

        <div className="rounded-xl border border-[#1A373E] bg-[#081619] p-4">
          <div className="flex items-center justify-between text-[#8D9FA4] text-xs mb-1">
            <span>Today (24h)</span>
            <Clock className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="font-serif text-2xl font-bold text-white">₹0</div>
          <div className="text-[10px] text-[#8D9FA4] mt-1">0 paid transactions</div>
        </div>

        <div className="rounded-xl border border-[#1A373E] bg-[#081619] p-4">
          <div className="flex items-center justify-between text-[#8D9FA4] text-xs mb-1">
            <span>Past 7 Days</span>
            <Receipt className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="font-serif text-2xl font-bold text-white">₹0</div>
          <div className="text-[10px] text-[#8D9FA4] mt-1">No captured charges</div>
        </div>

        <div className="rounded-xl border border-[#1A373E] bg-[#081619] p-4">
          <div className="flex items-center justify-between text-[#8D9FA4] text-xs mb-1">
            <span>Past 30 Days</span>
            <CreditCard className="h-4 w-4 text-purple-400" />
          </div>
          <div className="font-serif text-2xl font-bold text-white">₹0</div>
          <div className="text-[10px] text-[#8D9FA4] mt-1">Gateway in test / standby</div>
        </div>
      </div>

      {/* Payment Interest Demand Panel */}
      <div className="rounded-xl border border-[#1A373E] bg-[#081619] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <h3 className="font-serif text-base font-bold text-white">
              Student Payment Interest Demand
            </h3>
          </div>
          <Badge variant="outline" className="text-[11px] text-amber-300 border-amber-500/30">
            {paymentInterestData.reduce((acc, curr) => acc + curr.count, 0)} Total Interested Leads
          </Badge>
        </div>

        <p className="text-xs text-[#8D9FA4] leading-relaxed">
          Students who visited checkout and clicked <strong className="text-white">"Notify me when payments open"</strong> are recorded here by cohort. When payments are activated, you can broadcast immediate enrollment links to these hot leads.
        </p>

        {paymentInterestData.length === 0 ? (
          <div className="rounded-lg border border-[#1A373E] bg-[#0E2024] p-4 text-center text-xs text-[#8D9FA4]">
            No payment interest records captured yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {paymentInterestData.map(({ program, count }) => (
              <div
                key={program.id}
                className="rounded-lg border border-[#1A373E] bg-[#0E2024] p-3 flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-white text-xs truncate max-w-[180px]">
                    {program.title}
                  </div>
                  <div className="text-[10px] text-[#8D9FA4] mt-0.5">
                    Price: {formatPaise(program.price_paise)} • {program.type}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-serif text-base font-bold text-amber-400">{count}</div>
                  <div className="text-[9px] text-[#8D9FA4] uppercase">Interested</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-[#1A373E] bg-[#081619] p-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#8D9FA4]" />
          <input
            type="text"
            placeholder="Search order ID, student name, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-[#1A373E] bg-[#0E2024] pl-9 pr-3 py-2 text-xs text-white placeholder-[#8D9FA4] focus:outline-none focus:border-amber-500/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-[#8D9FA4] whitespace-nowrap">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto rounded-lg border border-[#1A373E] bg-[#0E2024] px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
          >
            <option value="all">All Orders</option>
            <option value="created">Created (Pending)</option>
            <option value="paid">Paid (Captured)</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>

      {isOrdersError && (
        <div className="space-y-2">
          <ErrorDetailsAlert
            title="Failed to Load Orders"
            error={ordersError}
          />
          <Button variant="outline" size="sm" onClick={() => refetchOrders()}>
            Retry Loading
          </Button>
        </div>
      )}

      {/* Orders Table */}
      <div className="overflow-hidden rounded-xl border border-[#1A373E] bg-[#081619]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#1A373E] bg-[#0E2024]/60 text-[#8D9FA4]">
              <tr>
                <th className="py-3 px-4 font-semibold">Order ID</th>
                <th className="py-3 px-4 font-semibold">Student</th>
                <th className="py-3 px-4 font-semibold">Program</th>
                <th className="py-3 px-4 font-semibold">Amount</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Created (IST)</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A373E]/50 text-white">
              {isLoadingOrders ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#8D9FA4]">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-amber-500" />
                    <span>Loading financial ledger...</span>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#8D9FA4]">
                    <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <div className="font-semibold text-white">No transactions recorded</div>
                    <div className="text-[11px] mt-1 text-amber-400/80">
                      Payment gateway is currently on hold. Orders will populate here when live payments launch.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order: any) => (
                  <tr
                    key={order.id}
                    className="hover:bg-[#0E2024]/40 transition-colors cursor-pointer"
                    onClick={() => handleOpenDetail(order)}
                  >
                    <td className="py-3.5 px-4 font-mono font-medium text-amber-400">
                      {order.razorpay_order_id || order.id.slice(0, 13)}
                    </td>
                    <td className="py-3.5 px-4 text-white">
                      {order.student_name || 'Anonymous Student'}
                    </td>
                    <td className="py-3.5 px-4 text-[#8D9FA4]">
                      {order.program_title || 'Cohort Program'}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {formatPaise(order.amount_paise)}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={order.status === 'paid' ? 'teal' : 'neutral'}
                        className="text-[10px] capitalize"
                      >
                        {order.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-[#8D9FA4] whitespace-nowrap">
                      {formatDateIST(order.created_at)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetail(order);
                        }}
                        className="h-7 text-[11px] border-[#1A373E] bg-[#0E2024] text-amber-400"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        <span>View</span>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          Order Detail Modal
         ========================================================================= */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-md bg-[#081619] border border-[#1A373E] text-white">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold text-white flex items-center gap-2">
              <Receipt className="h-5 w-5 text-amber-500" />
              <span>Order & Payment Breakdown</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-[#8D9FA4]">
              Transaction telemetry, GST breakdown, and settlement details.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            {selectedOrder && (
              <>
                <div className="rounded-xl border border-[#1A373E] bg-[#0E2024] p-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#8D9FA4]">Order Reference:</span>
                    <span className="font-mono font-bold text-amber-400">
                      {selectedOrder.razorpay_order_id || selectedOrder.id}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8D9FA4]">Program:</span>
                    <span className="font-semibold text-white">{selectedOrder.program_title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8D9FA4]">Student:</span>
                    <span className="text-white">{selectedOrder.student_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8D9FA4]">Status:</span>
                    <Badge variant="outline" className="capitalize text-[10px]">
                      {selectedOrder.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8D9FA4]">Date:</span>
                    <span>{formatDateIST(selectedOrder.created_at)}</span>
                  </div>
                </div>

                <div className="rounded-xl border border-[#1A373E] bg-[#040C0E] p-4 space-y-2 text-xs">
                  <div className="flex justify-between text-[#8D9FA4]">
                    <span>Gross Amount:</span>
                    <span>{formatPaise(selectedOrder.amount_paise + (selectedOrder.discount_paise || 0))}</span>
                  </div>
                  <div className="flex justify-between text-amber-400">
                    <span>Discount Applied:</span>
                    <span>-{formatPaise(selectedOrder.discount_paise || 0)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-white text-sm pt-2 border-t border-[#1A373E]">
                    <span>Settled Total:</span>
                    <span className="text-emerald-400">{formatPaise(selectedOrder.amount_paise)}</span>
                  </div>
                </div>

                {/* Disabled Operational Buttons */}
                <div className="pt-2 flex flex-col gap-2">
                  <div className="relative group w-full">
                    <Button
                      variant="danger"
                      size="sm"
                      disabled
                      className="w-full text-xs opacity-50 cursor-not-allowed"
                    >
                      Issue Full or Partial Refund
                    </Button>
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block whitespace-nowrap rounded bg-black/90 px-2 py-1 text-[10px] text-amber-300 border border-[#1A373E]">
                      Available when payments go live
                    </div>
                  </div>

                  <div className="relative group w-full">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                      className="w-full text-xs border-[#1A373E] opacity-50 cursor-not-allowed"
                    >
                      Download GST Tax Invoice
                    </Button>
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block whitespace-nowrap rounded bg-black/90 px-2 py-1 text-[10px] text-amber-300 border border-[#1A373E]">
                      Available when payments go live
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogBody>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDetailModalOpen(false)}
              className="border-[#1A373E] text-xs text-[#8D9FA4]"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPaymentsPage;
