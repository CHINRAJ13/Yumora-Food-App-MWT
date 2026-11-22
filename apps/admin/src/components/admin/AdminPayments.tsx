import { useState, useEffect } from "react";
import * as api from "@/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  CreditCard,
  IndianRupee,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Eye,
  Check,
  X,
  Building2,
  Bike,
  ShieldCheck,
  Copy,
  Receipt,
  FileText
} from "lucide-react";

type SubTab = "transactions" | "payouts" | "refunds" | "settlements";

const AdminPayments = () => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("transactions");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Overview metrics state
  const [overview, setOverview] = useState<any>({
    gmv: 0,
    platformProfit: 0,
    restaurantPayouts: 0,
    deliveryPayouts: 0,
    successfulPayments: 0,
    successfulPaymentsAmount: 0,
    pendingPayments: 0,
    failedPayments: 0,
    refunds: { totalRefundedAmount: 0, totalRefundsCount: 0, processedCount: 0 },
    payouts: { pendingAmount: 0, pendingCount: 0, approvedAmount: 0 }
  });

  // Transactions state
  const [transactions, setTransactions] = useState<any[]>([]);
  const [txSearch, setTxSearch] = useState("");
  const [txStatusFilter, setTxStatusFilter] = useState("all");
  const [selectedTx, setSelectedTx] = useState<any | null>(null);

  // Payouts state
  const [payouts, setPayouts] = useState<any[]>([]);
  const [payoutStatusFilter, setPayoutStatusFilter] = useState("pending");
  const [processingPayout, setProcessingPayout] = useState<any | null>(null);
  const [payoutActionType, setPayoutActionType] = useState<"approve" | "reject" | null>(null);
  const [transactionReference, setTransactionReference] = useState("");
  const [adminComment, setAdminComment] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Refunds state
  const [refunds, setRefunds] = useState<any[]>([]);
  const [refundSearch, setRefundSearch] = useState("");

  // Settlements state
  const [settlements, setSettlements] = useState<any[]>([]);
  const [settlementSearch, setSettlementSearch] = useState("");

  useEffect(() => {
    fetchOverview();
  }, []);

  useEffect(() => {
    if (activeSubTab === "transactions") {
      fetchTransactions();
    } else if (activeSubTab === "payouts") {
      fetchPayouts();
    } else if (activeSubTab === "refunds") {
      fetchRefunds();
    } else if (activeSubTab === "settlements") {
      fetchSettlements();
    }
  }, [activeSubTab, txStatusFilter, payoutStatusFilter]);

  const fetchOverview = async () => {
    try {
      const res = await api.getAdminPaymentOverview();
      setOverview(res.data);
    } catch (err: any) {
      console.error("Failed to load payment overview", err);
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminPaymentTransactions({
        search: txSearch,
        paymentStatus: txStatusFilter
      });
      setTransactions(res.data.transactions || []);
    } catch (err: any) {
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  const fetchPayouts = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminPayouts(payoutStatusFilter !== "all" ? payoutStatusFilter : undefined);
      setPayouts(res.data || []);
    } catch (err: any) {
      toast.error("Failed to load payout requests");
    } finally {
      setLoading(false);
    }
  };

  const fetchRefunds = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminPaymentRefunds({ search: refundSearch });
      setRefunds(res.data || []);
    } catch (err: any) {
      toast.error("Failed to load refund records");
    } finally {
      setLoading(false);
    }
  };

  const fetchSettlements = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminPaymentSettlements({ search: settlementSearch });
      setSettlements(res.data || []);
    } catch (err: any) {
      toast.error("Failed to load settlements");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchOverview(),
      activeSubTab === "transactions" && fetchTransactions(),
      activeSubTab === "payouts" && fetchPayouts(),
      activeSubTab === "refunds" && fetchRefunds(),
      activeSubTab === "settlements" && fetchSettlements()
    ]);
    setRefreshing(false);
    toast.success("Payment data refreshed");
  };

  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label} to clipboard`);
  };

  const handleOpenPayoutModal = (payout: any, action: "approve" | "reject") => {
    setProcessingPayout(payout);
    setPayoutActionType(action);
    setTransactionReference("");
    setAdminComment("");
  };

  const handleClosePayoutModal = () => {
    setProcessingPayout(null);
    setPayoutActionType(null);
    setTransactionReference("");
    setAdminComment("");
  };

  const submitPayoutAction = async () => {
    if (!processingPayout || !payoutActionType) return;

    if (payoutActionType === "approve" && !transactionReference.trim()) {
      toast.error("Please enter the Bank UTR / Transaction Reference number");
      return;
    }

    if (payoutActionType === "reject" && !adminComment.trim()) {
      toast.error("Please provide a reason for rejecting the payout");
      return;
    }

    setActionLoading(true);
    try {
      await api.processAdminPayout(processingPayout._id, {
        status: payoutActionType === "approve" ? "approved" : "rejected",
        transactionReference: transactionReference.trim() || undefined,
        adminComment: adminComment.trim() || undefined
      });

      toast.success(
        payoutActionType === "approve"
          ? `Payout of ₹${processingPayout.amount} approved!`
          : `Payout rejected and ₹${processingPayout.amount} refunded to wallet`
      );

      handleClosePayoutModal();
      fetchPayouts();
      fetchOverview();
    } catch (err: any) {
      toast.error(err.message || "Failed to process payout");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* ── Top Bar: Title & Refresh ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-orange-500" />
            <h1 className="text-2xl font-black text-gray-900">Payment & Finance Hub</h1>
          </div>
          <p className="text-xs text-gray-400 font-medium mt-1">
            Real-time gateway transactions, Razorpay settlement, customer refunds, and partner payouts
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-2xl font-black text-xs transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {/* GMV */}
        <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Gross GMV</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-gray-900">₹{overview.gmv?.toLocaleString() || 0}</h3>
          <p className="text-[11px] text-gray-400 font-bold mt-1">Delivered order volume</p>
        </div>

        {/* Platform Net Profit */}
        <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Platform Profit</span>
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-gray-900">₹{overview.platformProfit?.toLocaleString() || 0}</h3>
          <p className="text-[11px] text-orange-500 font-bold mt-1">10% comm + ₹5 platform fees</p>
        </div>

        {/* Online Payments Success */}
        <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Online Success</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-gray-900">{overview.successfulPayments || 0}</h3>
          <p className="text-[11px] text-gray-400 font-bold mt-1">Razorpay verified payments</p>
        </div>

        {/* Total Refunded */}
        <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Total Refunded</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-gray-900">₹{overview.refunds?.totalRefundedAmount?.toLocaleString() || 0}</h3>
          <p className="text-[11px] text-rose-500 font-bold mt-1">{overview.refunds?.processedCount || 0} cancellations settled</p>
        </div>

        {/* Pending Payouts */}
        <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Pending Payouts</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-gray-900">₹{overview.payouts?.pendingAmount?.toLocaleString() || 0}</h3>
          <p className="text-[11px] text-amber-600 font-bold mt-1">{overview.payouts?.pendingCount || 0} withdrawal requests</p>
        </div>
      </div>

      {/* ── Sub-Navigation Tabs ── */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveSubTab("transactions")}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs transition-all ${
            activeSubTab === "transactions"
              ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
              : "bg-white text-gray-500 hover:text-gray-900 border border-gray-100"
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Customer Transactions</span>
        </button>

        <button
          onClick={() => setActiveSubTab("payouts")}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs transition-all relative ${
            activeSubTab === "payouts"
              ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
              : "bg-white text-gray-500 hover:text-gray-900 border border-gray-100"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Partner Payouts</span>
          {overview.payouts?.pendingCount > 0 && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeSubTab === "payouts" ? "bg-white text-orange-600" : "bg-orange-500 text-white"
              }`}
            >
              {overview.payouts.pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab("refunds")}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs transition-all ${
            activeSubTab === "refunds"
              ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
              : "bg-white text-gray-500 hover:text-gray-900 border border-gray-100"
          }`}
        >
          <ArrowDownLeft className="w-4 h-4" />
          <span>Refunds & Cancellations</span>
        </button>

        <button
          onClick={() => setActiveSubTab("settlements")}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs transition-all ${
            activeSubTab === "settlements"
              ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
              : "bg-white text-gray-500 hover:text-gray-900 border border-gray-100"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Commission & Splits</span>
        </button>
      </div>

      {/* ── Content View 1: Customer Transactions ── */}
      {activeSubTab === "transactions" && (
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 space-y-6">
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Order ID, Razorpay pay_id, customer, phone..."
                value={txSearch}
                onChange={(e) => setTxSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchTransactions()}
                className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <span className="text-xs font-bold text-gray-400">Payment Status:</span>
              <select
                value={txStatusFilter}
                onChange={(e) => setTxStatusFilter(e.target.value)}
                className="px-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 focus:outline-none"
              >
                <option value="all">All Payments</option>
                <option value="Success">Success Only</option>
                <option value="Pending">Pending Only</option>
                <option value="Failed">Failed Only</option>
              </select>
            </div>
          </div>

          {/* Transactions Table */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-400">
              <RefreshCw className="w-8 h-8 animate-spin mb-3 text-orange-500" />
              <p className="text-xs font-bold">Loading transactions...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-16 text-center text-gray-400 font-bold text-sm">
              No payment transactions found matching criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] font-black uppercase tracking-wider text-gray-400">
                    <th className="pb-3 px-4">Order / Razorpay ID</th>
                    <th className="pb-3 px-4">Customer</th>
                    <th className="pb-3 px-4">Restaurant</th>
                    <th className="pb-3 px-4">Method</th>
                    <th className="pb-3 px-4">Amount</th>
                    <th className="pb-3 px-4">Payment Status</th>
                    <th className="pb-3 px-4">Date</th>
                    <th className="pb-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs font-semibold">
                  {transactions.map((tx) => (
                    <tr key={tx._id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="font-black text-gray-900">
                            #{tx._id?.substring(tx._id.length - 8).toUpperCase()}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1 mt-0.5">
                            {tx.paymentId || "Unassigned"}
                            {tx.paymentId && (
                              <button
                                onClick={() => copyToClipboard(tx.paymentId, "Payment ID")}
                                className="hover:text-gray-700"
                                title="Copy Payment ID"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            )}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900">{tx.customerName || "Customer"}</span>
                          <span className="text-[10px] text-gray-400">{tx.phone || tx.email || "—"}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4 font-bold text-gray-700">{tx.restaurantName || "—"}</td>

                      <td className="py-4 px-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-gray-100 text-gray-700">
                          {tx.paymentMethod || "online"}
                        </span>
                      </td>

                      <td className="py-4 px-4 font-black text-gray-900 text-sm">₹{tx.totalAmount}</td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            tx.paymentStatus === "Success"
                              ? "bg-emerald-50 text-emerald-600"
                              : tx.paymentStatus === "Failed"
                              ? "bg-rose-50 text-rose-600"
                              : "bg-amber-50 text-amber-600"
                          }`}
                        >
                          {tx.paymentStatus === "Success" && <CheckCircle2 className="w-3 h-3" />}
                          {tx.paymentStatus === "Failed" && <XCircle className="w-3 h-3" />}
                          {tx.paymentStatus === "Pending" && <Clock className="w-3 h-3" />}
                          <span>{tx.paymentStatus}</span>
                        </span>
                      </td>

                      <td className="py-4 px-4 text-gray-400 text-[11px]">
                        {tx.createdAt ? format(new Date(tx.createdAt), "dd MMM yyyy, HH:mm") : "—"}
                      </td>

                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => setSelectedTx(tx)}
                          className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-xl font-black text-[11px] inline-flex items-center gap-1 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Receipt</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Content View 2: Partner Payout Requests ── */}
      {activeSubTab === "payouts" && (
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 space-y-6">
          {/* Payout Status Tabs */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPayoutStatusFilter("pending")}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  payoutStatusFilter === "pending"
                    ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Pending Requests ({overview.payouts?.pendingCount || 0})
              </button>

              <button
                onClick={() => setPayoutStatusFilter("approved")}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  payoutStatusFilter === "approved"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Approved
              </button>

              <button
                onClick={() => setPayoutStatusFilter("rejected")}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  payoutStatusFilter === "rejected"
                    ? "bg-rose-600 text-white shadow-md shadow-rose-600/20"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Rejected
              </button>
            </div>
          </div>

          {/* Payouts Table */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-400">
              <RefreshCw className="w-8 h-8 animate-spin mb-3 text-orange-500" />
              <p className="text-xs font-bold">Loading payout requests...</p>
            </div>
          ) : payouts.length === 0 ? (
            <div className="py-16 text-center text-gray-400 font-bold text-sm">
              No {payoutStatusFilter} payout requests found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] font-black uppercase tracking-wider text-gray-400">
                    <th className="pb-3 px-4">Partner</th>
                    <th className="pb-3 px-4">Role</th>
                    <th className="pb-3 px-4">Amount</th>
                    <th className="pb-3 px-4">Bank Details</th>
                    <th className="pb-3 px-4">Requested On</th>
                    <th className="pb-3 px-4">Status & Reference</th>
                    <th className="pb-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs font-semibold">
                  {payouts.map((p) => (
                    <tr key={p._id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-4 px-4">
                        <span className="font-black text-gray-900 block">{p.userName || "Partner"}</span>
                        <span className="text-[10px] text-gray-400 font-mono">ID: #{p._id?.substring(p._id.length - 6).toUpperCase()}</span>
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            p.userType === "restaurant"
                              ? "bg-blue-50 text-blue-700"
                              : "bg-purple-50 text-purple-700"
                          }`}
                        >
                          {p.userType === "restaurant" ? <Building2 className="w-3 h-3" /> : <Bike className="w-3 h-3" />}
                          <span>{p.userType}</span>
                        </span>
                      </td>

                      <td className="py-4 px-4 font-black text-gray-900 text-sm">₹{p.amount?.toLocaleString()}</td>

                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="text-gray-900 font-bold">
                            {p.bankDetails?.bankName || "Bank Account"}: •••• {p.bankDetails?.accountNumber?.slice(-4) || "—"}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono">
                            IFSC: {p.bankDetails?.ifscCode || "—"} | Name: {p.bankDetails?.accountHolderName || "—"}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-gray-400 text-[11px]">
                        {p.createdAt ? format(new Date(p.createdAt), "dd MMM yyyy, HH:mm") : "—"}
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase w-fit ${
                              p.status === "approved"
                                ? "bg-emerald-50 text-emerald-700"
                                : p.status === "rejected"
                                ? "bg-rose-50 text-rose-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {p.status}
                          </span>
                          {p.transactionReference && (
                            <span className="text-[10px] text-gray-500 font-mono">
                              UTR: {p.transactionReference}
                            </span>
                          )}
                          {p.adminComment && (
                            <span className="text-[10px] text-gray-400 italic">
                              Note: {p.adminComment}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4 text-right">
                        {p.status === "pending" ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenPayoutModal(p, "approve")}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-[11px] inline-flex items-center gap-1 shadow-sm transition-all"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => handleOpenPayoutModal(p, "reject")}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl font-bold text-[11px] inline-flex items-center gap-1 transition-all"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-400 font-bold">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Content View 3: Refunds & Cancellations ── */}
      {activeSubTab === "refunds" && (
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by Refund ID, Customer, Restaurant..."
                value={refundSearch}
                onChange={(e) => setRefundSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchRefunds()}
                className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchRefunds}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-black text-xs rounded-xl"
              >
                Search
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-400">
              <RefreshCw className="w-8 h-8 animate-spin mb-3 text-orange-500" />
              <p className="text-xs font-bold">Loading refunds...</p>
            </div>
          ) : refunds.length === 0 ? (
            <div className="py-16 text-center text-gray-400 font-bold text-sm">
              No cancelled or refunded orders found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] font-black uppercase tracking-wider text-gray-400">
                    <th className="pb-3 px-4">Order ID</th>
                    <th className="pb-3 px-4">Customer</th>
                    <th className="pb-3 px-4">Restaurant</th>
                    <th className="pb-3 px-4">Cancelled By & Reason</th>
                    <th className="pb-3 px-4">Refund Amount</th>
                    <th className="pb-3 px-4">Gateway Refund ID</th>
                    <th className="pb-3 px-4">Refund Status</th>
                    <th className="pb-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs font-semibold">
                  {refunds.map((ref) => (
                    <tr key={ref._id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-4 px-4 font-black text-gray-900">
                        #{ref._id?.substring(ref._id.length - 8).toUpperCase()}
                      </td>

                      <td className="py-4 px-4">
                        <span className="font-bold text-gray-900 block">{ref.customerName || "Customer"}</span>
                        <span className="text-[10px] text-gray-400">{ref.phone || "—"}</span>
                      </td>

                      <td className="py-4 px-4 font-bold text-gray-700">{ref.restaurantName || "—"}</td>

                      <td className="py-4 px-4">
                        <span className="capitalize font-black text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 w-fit block mb-1">
                          {ref.cancellation?.cancelledBy || "customer"}
                        </span>
                        <span className="text-[11px] text-gray-500 block max-w-xs truncate">
                          {ref.cancellation?.reason || "Cancelled"}
                        </span>
                      </td>

                      <td className="py-4 px-4 font-black text-rose-600 text-sm">
                        ₹{ref.refund?.amount || ref.totalAmount}
                      </td>

                      <td className="py-4 px-4">
                        <span className="text-[11px] font-mono text-gray-600 flex items-center gap-1">
                          {ref.refund?.refundId || "—"}
                          {ref.refund?.refundId && (
                            <button
                              onClick={() => copyToClipboard(ref.refund.refundId, "Refund ID")}
                              className="hover:text-gray-900"
                              title="Copy"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          )}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            ref.refund?.status === "processed"
                              ? "bg-emerald-50 text-emerald-700"
                              : ref.refund?.status === "failed"
                              ? "bg-rose-50 text-rose-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {ref.refund?.status === "processed" ? "✓ Refunded" : ref.refund?.status || "None"}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-gray-400 text-[11px]">
                        {ref.cancellation?.cancelledAt
                          ? format(new Date(ref.cancellation.cancelledAt), "dd MMM yyyy, HH:mm")
                          : format(new Date(ref.createdAt), "dd MMM yyyy, HH:mm")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Content View 4: Settlements & Commission Splits ── */}
      {activeSubTab === "settlements" && (
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by Restaurant or Customer..."
                value={settlementSearch}
                onChange={(e) => setSettlementSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchSettlements()}
                className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-100 text-xs font-semibold focus:outline-none"
              />
            </div>
            <p className="text-xs text-gray-400 font-bold">Showing last 50 delivered orders</p>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-400">
              <RefreshCw className="w-8 h-8 animate-spin mb-3 text-orange-500" />
              <p className="text-xs font-bold">Loading settlements...</p>
            </div>
          ) : settlements.length === 0 ? (
            <div className="py-16 text-center text-gray-400 font-bold text-sm">
              No delivered order settlements recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] font-black uppercase tracking-wider text-gray-400">
                    <th className="pb-3 px-4">Order ID</th>
                    <th className="pb-3 px-4">Restaurant</th>
                    <th className="pb-3 px-4">Customer Paid</th>
                    <th className="pb-3 px-4">Food Subtotal</th>
                    <th className="pb-3 px-4">Platform Profit (10% + ₹5)</th>
                    <th className="pb-3 px-4">Restaurant Net</th>
                    <th className="pb-3 px-4">Rider Fee</th>
                    <th className="pb-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs font-semibold">
                  {settlements.map((s) => {
                    const foodSubtotal = s.pricing?.foodSubtotal || s.totalAmount;
                    const platformProfit = s.settlement?.platformProfit || (Math.round(foodSubtotal * 0.1) + 5);
                    const restNet = s.settlement?.restaurantAmount || Math.round(foodSubtotal * 0.9);
                    const riderFee = s.settlement?.deliveryPartnerAmount || s.pricing?.deliveryFee || 30;

                    return (
                      <tr key={s._id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-4 px-4 font-black text-gray-900">
                          #{s._id?.substring(s._id.length - 8).toUpperCase()}
                        </td>

                        <td className="py-4 px-4 font-bold text-gray-900">{s.restaurantName}</td>

                        <td className="py-4 px-4 font-black text-gray-900">₹{s.totalAmount}</td>

                        <td className="py-4 px-4 text-gray-600">₹{foodSubtotal}</td>

                        <td className="py-4 px-4 font-black text-orange-600">
                          ₹{platformProfit}
                        </td>

                        <td className="py-4 px-4 font-black text-blue-600">
                          ₹{restNet}
                        </td>

                        <td className="py-4 px-4 font-black text-purple-600">
                          ₹{riderFee}
                        </td>

                        <td className="py-4 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700">
                            ✓ {s.settlement?.isSettled ? "Settled" : "Auto-Split"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Transaction Receipt Modal ── */}
      <AnimatePresence>
        {selectedTx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-100 space-y-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-orange-500" />
                  <h3 className="text-lg font-black text-gray-900">Payment Breakdown</h3>
                </div>
                <button
                  onClick={() => setSelectedTx(null)}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs font-semibold">
                <div className="bg-gray-50 p-4 rounded-2xl space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Order ID:</span>
                    <span className="font-mono text-gray-900 font-bold">#{selectedTx._id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Razorpay ID:</span>
                    <span className="font-mono text-gray-900 font-bold">{selectedTx.paymentId || "Unassigned"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Payment Method:</span>
                    <span className="uppercase font-bold text-gray-900">{selectedTx.paymentMethod || "online"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Payment Status:</span>
                    <span className="font-black text-emerald-600 uppercase">{selectedTx.paymentStatus}</span>
                  </div>
                </div>

                {/* Itemized Pricing */}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <div className="flex justify-between text-gray-600">
                    <span>Food Subtotal:</span>
                    <span>₹{selectedTx.pricing?.foodSubtotal || selectedTx.totalAmount}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Packaging Fee:</span>
                    <span>₹{selectedTx.pricing?.packagingFee || 0}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery Fee:</span>
                    <span>₹{selectedTx.pricing?.deliveryFee || 0}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Platform Fee:</span>
                    <span>₹{selectedTx.pricing?.platformFee !== undefined ? selectedTx.pricing.platformFee : 5}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Taxes:</span>
                    <span>₹{selectedTx.pricing?.tax || 0}</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-gray-900 pt-2 border-t border-gray-100">
                    <span>Total Amount Paid:</span>
                    <span className="text-orange-600">₹{selectedTx.totalAmount}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedTx(null)}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 font-black rounded-2xl text-xs transition-colors"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Payout Action Modal (Approve / Reject) ── */}
      <AnimatePresence>
        {processingPayout && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-100 space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  {payoutActionType === "approve" ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-600" />
                  )}
                  <h3 className="text-lg font-black text-gray-900">
                    {payoutActionType === "approve" ? "Approve Partner Payout" : "Reject Partner Payout"}
                  </h3>
                </div>
                <button
                  onClick={handleClosePayoutModal}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Beneficiary summary */}
              <div className="bg-gray-50 p-4 rounded-2xl space-y-2 text-xs font-semibold">
                <div className="flex justify-between">
                  <span className="text-gray-400">Partner:</span>
                  <span className="font-bold text-gray-900">{processingPayout.userName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Role:</span>
                  <span className="uppercase font-bold text-gray-900">{processingPayout.userType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Withdrawal Amount:</span>
                  <span className="font-black text-emerald-600 text-sm">₹{processingPayout.amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Bank Account:</span>
                  <span className="font-mono text-gray-900">{processingPayout.bankDetails?.accountNumber || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">IFSC Code:</span>
                  <span className="font-mono text-gray-900">{processingPayout.bankDetails?.ifscCode || "—"}</span>
                </div>
              </div>

              {payoutActionType === "approve" ? (
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-gray-500">
                    Bank UTR / Transaction Reference *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UTR198273641249"
                    value={transactionReference}
                    onChange={(e) => setTransactionReference(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <p className="text-[10px] text-gray-400">
                    Enter the UTR or reference number generated by your bank transfer.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-gray-500">
                    Rejection Reason *
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Incorrect bank account details provided"
                    value={adminComment}
                    onChange={(e) => setAdminComment(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                  <p className="text-[10px] text-rose-500 font-medium">
                    Rejecting will immediately refund ₹{processingPayout.amount} back to the partner's wallet.
                  </p>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleClosePayoutModal}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-2xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitPayoutAction}
                  disabled={actionLoading}
                  className={`flex-1 py-3 text-white font-black rounded-2xl text-xs transition-colors flex items-center justify-center gap-2 ${
                    payoutActionType === "approve"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  {actionLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : payoutActionType === "approve" ? (
                    "Confirm Payout"
                  ) : (
                    "Reject & Refund"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPayments;
