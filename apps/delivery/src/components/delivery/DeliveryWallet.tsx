import { useState, useEffect } from "react";
import * as api from "@/api";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Wallet,
  IndianRupee,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Building2,
  Receipt,
  X
} from "lucide-react";

export default function DeliveryWallet() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [wallet, setWallet] = useState<any>({
    balance: 0,
    totalEarned: 0,
    totalWithdrawn: 0,
    bankDetails: {}
  });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [bankName, setBankName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    try {
      const res: any = await api.getMyWallet();
      const data = res.data?.data || res.data;
      if (data) {
        setWallet(data.wallet || {});
        setTransactions(data.transactions || []);
        setPayouts(data.pendingPayouts || []);

        if (data.wallet?.bankDetails) {
          setAccountNumber(data.wallet.bankDetails.accountNumber || "");
          setIfscCode(data.wallet.bankDetails.ifscCode || "");
          setAccountHolder(data.wallet.bankDetails.accountHolderName || "");
          setBankName(data.wallet.bankDetails.bankName || "");
        }
      }
    } catch (err: any) {
      toast.error("Failed to load wallet data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchWallet();
    toast.success("Wallet refreshed");
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(withdrawAmount);

    if (!amount || amount <= 0) {
      toast.error("Please enter a valid withdrawal amount");
      return;
    }

    if (amount > wallet.balance) {
      toast.error(`Amount exceeds your available balance of ₹${wallet.balance}`);
      return;
    }

    if (!accountNumber.trim() || !ifscCode.trim()) {
      toast.error("Account number and IFSC code are required");
      return;
    }

    setSubmitting(true);
    try {
      await api.requestPayout(amount, {
        accountNumber: accountNumber.trim(),
        ifscCode: ifscCode.trim().toUpperCase(),
        accountHolderName: accountHolder.trim() || "Delivery Partner",
        bankName: bankName.trim()
      });

      toast.success(`Withdrawal request for ₹${amount} submitted for admin approval!`);
      setModalOpen(false);
      setWithdrawAmount("");
      fetchWallet();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit payout request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Top Bar ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900">Rider Wallet & Payouts</h2>
            <p className="text-xs text-gray-400 font-medium">Manage your delivery trip earnings and request bank transfers</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-orange-500" : ""}`} />
          </button>
          <button
            onClick={() => setModalOpen(true)}
            disabled={wallet.balance < 50}
            className="px-5 py-2.5 bg-primary hover:bg-orange-600 disabled:opacity-50 text-white rounded-2xl font-black text-xs transition-colors shadow-lg shadow-primary/20 flex items-center gap-2"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Withdraw to Bank</span>
          </button>
        </div>
      </div>

      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Available Balance</span>
          <h3 className="text-3xl font-black text-gray-900 mt-2">₹{wallet.balance?.toLocaleString() || 0}</h3>
          <p className="text-[11px] text-emerald-600 font-bold mt-1">Ready for instant payout withdrawal</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Total Lifetime Earnings</span>
          <h3 className="text-3xl font-black text-primary mt-2">₹{wallet.totalEarned?.toLocaleString() || 0}</h3>
          <p className="text-[11px] text-gray-400 font-medium mt-1">From all completed delivery orders</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Total Withdrawn</span>
          <h3 className="text-3xl font-black text-gray-700 mt-2">₹{wallet.totalWithdrawn?.toLocaleString() || 0}</h3>
          <p className="text-[11px] text-gray-400 font-medium mt-1">Successfully transferred to bank</p>
        </div>
      </div>

      {/* ── Payout Requests & Ledger Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payout History */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Bank Payout Requests</h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gray-100 text-gray-700">
              {payouts.length} total
            </span>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center"><RefreshCw className="w-6 h-6 animate-spin text-orange-500" /></div>
          ) : payouts.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8 font-medium">No withdrawal requests yet.</p>
          ) : (
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {payouts.map((p) => (
                <div key={p._id} className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-black text-gray-900">₹{p.amount}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      p.status === "approved" ? "bg-emerald-100 text-emerald-700" : p.status === "rejected" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {p.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-mono">
                    A/C: •••• {p.bankDetails?.accountNumber?.slice(-4) || "—"} ({p.bankDetails?.ifscCode || "—"})
                  </p>
                  {p.transactionReference && (
                    <p className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg w-fit">
                      UTR: {p.transactionReference}
                    </p>
                  )}
                  {p.adminComment && (
                    <p className="text-[11px] text-rose-700 bg-rose-50 px-2 py-0.5 rounded-lg">
                      Note: {p.adminComment}
                    </p>
                  )}
                  <p className="text-[10px] text-gray-400">
                    {format(new Date(p.createdAt), "dd MMM yyyy, HH:mm")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Transaction Ledger */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Wallet Ledger</h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gray-100 text-gray-700">
              {transactions.length} entries
            </span>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center"><RefreshCw className="w-6 h-6 animate-spin text-orange-500" /></div>
          ) : transactions.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8 font-medium">No wallet transactions recorded yet.</p>
          ) : (
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {transactions.map((t) => (
                <div key={t._id} className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black text-gray-900">{t.description}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {format(new Date(t.createdAt), "dd MMM yyyy")} • Balance after: ₹{t.balanceAfter}
                    </p>
                  </div>
                  <span className={`text-sm font-black ${t.type === "credit" ? "text-emerald-600" : "text-rose-600"}`}>
                    {t.type === "credit" ? `+₹${t.amount}` : `-₹${t.amount}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Withdrawal Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-100 space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <h3 className="text-lg font-black text-gray-900">Withdraw Rider Earnings</h3>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-full text-gray-400 hover:text-gray-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-gray-400 block mb-1">
                  Amount to Withdraw (Available: ₹{wallet.balance})
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-black">₹</span>
                  <input
                    type="number"
                    placeholder="e.g. 500"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    max={wallet.balance}
                    min={1}
                    required
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">Bank Details</p>
                <input
                  type="text"
                  placeholder="Account Holder Name"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold"
                />
                <input
                  type="text"
                  placeholder="Bank Account Number"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold font-mono"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="IFSC Code"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value)}
                    required
                    className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold uppercase font-mono"
                  />
                  <input
                    type="text"
                    placeholder="Bank Name"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-primary hover:bg-orange-600 text-white font-black rounded-2xl text-xs transition-colors shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
              >
                {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Submit Payout Request"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
