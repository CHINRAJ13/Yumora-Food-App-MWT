import { useState, useEffect, useMemo } from "react";
import * as api from "@/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
  Save,
  Calculator,
  Sparkles,
  CheckCircle2,
  X,
  IndianRupee,
  Zap,
  Loader2,
} from "lucide-react";

interface DeliverySlab {
  _id?: string;
  label: string;
  minKm: number;
  maxKm: number | null;
  chargeType: "flat" | "per_km";
  amount: number;
  isActive: boolean;
}

interface DeliveryPricingConfig {
  slabs: DeliverySlab[];
  freeDeliveryEnabled: boolean;
  freeDeliveryMinSubtotal: number;
  freeDeliveryMaxDistanceKm: number;
  longDistanceSubsidy: number;
  surgeFee: number;
  surgeLabel: string;
  roadFactorMultiplier: number;
  fallbackDistanceKm: number;
}

/**
 * Mirrors backend progressive slab evaluation so the Admin Simulator matches 1:1.
 */
const simulateQuote = (config: DeliveryPricingConfig, distanceKm: number, foodSubtotal: number) => {
  const activeSlabs = [...(config.slabs || [])]
    .filter((s) => s.isActive !== false)
    .sort((a, b) => Number(a.minKm) - Number(b.minKm));

  let slabTotal = 0;
  const breakdown: { label: string; fee: number; detail: string }[] = [];

  for (const slab of activeSlabs) {
    const minKm = Number(slab.minKm) || 0;
    const maxKm = slab.maxKm !== null && slab.maxKm !== undefined ? Number(slab.maxKm) : Infinity;
    const amount = Number(slab.amount) || 0;

    if (distanceKm <= minKm && minKm > 0) continue;

    if (slab.chargeType === "flat") {
      if (distanceKm > 0 && (distanceKm > minKm || minKm === 0)) {
        slabTotal += amount;
        breakdown.push({ label: slab.label, fee: amount, detail: `Flat ₹${amount}` });
      }
    } else {
      const kmInBand = Math.max(0, Math.min(distanceKm, maxKm) - minKm);
      if (kmInBand > 0) {
        const billedKm = Math.ceil(kmInBand);
        const fee = billedKm * amount;
        slabTotal += fee;
        breakdown.push({ label: slab.label, fee, detail: `${billedKm} km × ₹${amount}/km` });
      }
    }
  }

  const surge = Number(config.surgeFee) > 0 ? Number(config.surgeFee) : 0;
  const baseDeliveryFee = Math.round(slabTotal + surge);

  let customerFee = baseDeliveryFee;
  let isFreeDelivery = false;
  if (config.freeDeliveryEnabled && foodSubtotal > (config.freeDeliveryMinSubtotal || 199)) {
    if (distanceKm <= (config.freeDeliveryMaxDistanceKm || 5)) {
      customerFee = 0;
      isFreeDelivery = true;
    } else {
      customerFee = Math.max(0, baseDeliveryFee - (config.longDistanceSubsidy || 0));
    }
  }

  return { baseDeliveryFee, customerFee, isFreeDelivery, surge, breakdown };
};

const AdminDeliveryPricing = () => {
  const [config, setConfig] = useState<DeliveryPricingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingRules, setSavingRules] = useState(false);

  // Add/Edit Slab Modal State
  const [slabModalOpen, setSlabModalOpen] = useState(false);
  const [editingSlab, setEditingSlab] = useState<DeliverySlab | null>(null);
  const [slabForm, setSlabForm] = useState({
    label: "",
    minKm: "0",
    maxKm: "",
    openEnded: false,
    chargeType: "per_km" as "flat" | "per_km",
    amount: "10",
    isActive: true,
  });
  const [savingSlab, setSavingSlab] = useState(false);

  // Simulator State
  const [simDistanceKm, setSimDistanceKm] = useState("4.0");
  const [simSubtotal, setSimSubtotal] = useState("150");

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res: any = await api.getAdminDeliveryPricing();
      if (res?.data) {
        setConfig(res.data);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to load delivery pricing configuration");
    } finally {
      setLoading(false);
    }
  };

  const openAddSlab = () => {
    const lastSlab = config?.slabs?.[config.slabs.length - 1];
    const suggestedMin = lastSlab?.maxKm !== null && lastSlab?.maxKm !== undefined ? String(lastSlab.maxKm) : "0";
    setEditingSlab(null);
    setSlabForm({
      label: "",
      minKm: suggestedMin,
      maxKm: "",
      openEnded: false,
      chargeType: "per_km",
      amount: "10",
      isActive: true,
    });
    setSlabModalOpen(true);
  };

  const openEditSlab = (slab: DeliverySlab) => {
    setEditingSlab(slab);
    setSlabForm({
      label: slab.label,
      minKm: String(slab.minKm),
      maxKm: slab.maxKm !== null && slab.maxKm !== undefined ? String(slab.maxKm) : "",
      openEnded: slab.maxKm === null || slab.maxKm === undefined,
      chargeType: slab.chargeType,
      amount: String(slab.amount),
      isActive: slab.isActive !== false,
    });
    setSlabModalOpen(true);
  };

  const handleSaveSlab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slabForm.label.trim()) {
      toast.error("Please enter a slab label");
      return;
    }

    const payload = {
      label: slabForm.label.trim(),
      minKm: Number(slabForm.minKm),
      maxKm: slabForm.openEnded || !slabForm.maxKm.trim() ? null : Number(slabForm.maxKm),
      chargeType: slabForm.chargeType,
      amount: Number(slabForm.amount),
      isActive: slabForm.isActive,
    };

    setSavingSlab(true);
    try {
      const res: any = editingSlab?._id
        ? await api.updateAdminDeliverySlab(editingSlab._id, payload)
        : await api.addAdminDeliverySlab(payload);

      if (res?.data) {
        setConfig(res.data);
        setSlabModalOpen(false);
        toast.success(editingSlab ? "Distance slab updated!" : "New distance slab added!");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to save distance slab");
    } finally {
      setSavingSlab(false);
    }
  };

  const handleToggleSlab = async (slab: DeliverySlab) => {
    if (!slab._id) return;
    try {
      const res: any = await api.updateAdminDeliverySlab(slab._id, {
        isActive: !(slab.isActive !== false),
      });
      if (res?.data) {
        setConfig(res.data);
        toast.success(`Slab "${slab.label}" ${slab.isActive ? "paused" : "activated"}`);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to update slab");
    }
  };

  const handleDeleteSlab = async (slab: DeliverySlab) => {
    if (!slab._id) return;
    if (!window.confirm(`Delete delivery fee slab "${slab.label}"?`)) return;
    try {
      const res: any = await api.deleteAdminDeliverySlab(slab._id);
      if (res?.data) {
        setConfig(res.data);
        toast.success("Distance slab deleted");
      }
    } catch (err: any) {
      toast.error(err?.message || "Cannot delete slab");
    }
  };

  const handleSaveGlobalRules = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    setSavingRules(true);
    try {
      const res: any = await api.updateAdminDeliveryPricing({
        freeDeliveryEnabled: config.freeDeliveryEnabled,
        freeDeliveryMinSubtotal: Number(config.freeDeliveryMinSubtotal),
        freeDeliveryMaxDistanceKm: Number(config.freeDeliveryMaxDistanceKm),
        longDistanceSubsidy: Number(config.longDistanceSubsidy),
        surgeFee: Number(config.surgeFee),
        surgeLabel: config.surgeLabel,
        roadFactorMultiplier: Number(config.roadFactorMultiplier),
        fallbackDistanceKm: Number(config.fallbackDistanceKm),
      });
      if (res?.data) {
        setConfig(res.data);
        toast.success("Delivery pricing rules saved & live across apps!");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to save pricing rules");
    } finally {
      setSavingRules(false);
    }
  };

  const handleResetDefaults = async () => {
    if (!window.confirm("Reset all distance slabs and free-delivery rules back to platform defaults?")) return;
    try {
      const res: any = await api.resetAdminDeliveryPricing();
      if (res?.data) {
        setConfig(res.data);
        toast.success("Reset to default delivery pricing");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to reset pricing");
    }
  };

  const simResult = useMemo(() => {
    if (!config) return null;
    const d = Math.max(0, parseFloat(simDistanceKm) || 0);
    const s = Math.max(0, parseFloat(simSubtotal) || 0);
    return simulateQuote(config, d, s);
  }, [config, simDistanceKm, simSubtotal]);

  if (loading || !config) {
    return (
      <div className="bg-white rounded-[2.5rem] p-16 border border-gray-100 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm font-bold text-gray-400">Loading delivery pricing rules...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-primary flex items-center justify-center">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900">Distance-Based Delivery Pricing</h2>
            <p className="text-xs font-medium text-gray-500 mt-0.5">
              Add or edit distance fee slabs, free-delivery promotions, and peak surge charges in real time.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-xs font-black hover:bg-gray-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>
          <button
            type="button"
            onClick={openAddSlab}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-black shadow-lg shadow-primary/20 hover:opacity-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Distance Slab
          </button>
        </div>
      </div>

      {/* Distance Slabs Table */}
      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/40 border border-gray-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-gray-900">Distance Fee Slabs</h3>
            <p className="text-xs font-medium text-gray-400">
              Evaluated progressively from shortest to longest distance band
            </p>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full">
            {config.slabs.filter((s) => s.isActive !== false).length} Active Slabs
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/70 text-left">
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Slab Label</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Distance Range</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Charge Mode</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Rate / Fee</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {config.slabs.map((slab) => (
                <tr key={slab._id || slab.label} className="hover:bg-gray-50/40 transition-colors">
                  <td className="px-8 py-5 font-black text-sm text-gray-900">{slab.label}</td>
                  <td className="px-6 py-5">
                    <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-xs font-bold font-mono">
                      {slab.minKm} km – {slab.maxKm !== null && slab.maxKm !== undefined ? `${slab.maxKm} km` : "∞"}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                        slab.chargeType === "flat"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-purple-50 text-purple-700"
                      }`}
                    >
                      {slab.chargeType === "flat" ? "Flat Base Fee" : "Per KM Extra"}
                    </span>
                  </td>
                  <td className="px-6 py-5 font-black text-base text-gray-900">
                    ₹{slab.amount}
                    {slab.chargeType === "per_km" && (
                      <span className="text-xs font-semibold text-gray-400"> / km</span>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <button
                      type="button"
                      onClick={() => handleToggleSlab(slab)}
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase transition-colors ${
                        slab.isActive !== false
                          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                      }`}
                    >
                      {slab.isActive !== false ? "Active" : "Paused"}
                    </button>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEditSlab(slab)}
                        className="p-2 rounded-xl bg-gray-50 text-gray-600 hover:bg-orange-50 hover:text-primary transition-colors"
                        title="Edit Slab"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSlab(slab)}
                        className="p-2 rounded-xl bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Delete Slab"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Grid: Global Rules + Live Pricing Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Global Promo, Surge & Calibration Form */}
        <form
          onSubmit={handleSaveGlobalRules}
          className="lg:col-span-7 bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm space-y-6"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-gray-900">Free Delivery, Surge & Distance Calibration</h3>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.freeDeliveryEnabled}
                onChange={(e) => setConfig({ ...config, freeDeliveryEnabled: e.target.checked })}
                className="w-4 h-4 accent-primary rounded"
              />
              <span className="text-xs font-black text-gray-700">Free Delivery Promo</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                Free Delivery Min Subtotal (₹)
              </label>
              <input
                type="number"
                min={0}
                value={config.freeDeliveryMinSubtotal}
                onChange={(e) => setConfig({ ...config, freeDeliveryMinSubtotal: Number(e.target.value) })}
                disabled={!config.freeDeliveryEnabled}
                className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                Free Delivery Max Distance (km)
              </label>
              <input
                type="number"
                step="0.5"
                min={0}
                value={config.freeDeliveryMaxDistanceKm}
                onChange={(e) => setConfig({ ...config, freeDeliveryMaxDistanceKm: Number(e.target.value) })}
                disabled={!config.freeDeliveryEnabled}
                className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                Long-Distance Subsidy (&gt; Max km) (₹)
              </label>
              <input
                type="number"
                min={0}
                value={config.longDistanceSubsidy}
                onChange={(e) => setConfig({ ...config, longDistanceSubsidy: Number(e.target.value) })}
                disabled={!config.freeDeliveryEnabled}
                className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-500" /> Peak / Rain Surge Fee (₹)
              </label>
              <input
                type="number"
                min={0}
                value={config.surgeFee}
                onChange={(e) => setConfig({ ...config, surgeFee: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                Urban Road Multiplier (1.0 – 3.0x)
              </label>
              <input
                type="number"
                step="0.05"
                min={1}
                max={3}
                value={config.roadFactorMultiplier}
                onChange={(e) => setConfig({ ...config, roadFactorMultiplier: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                Fallback Distance (Missing GPS) (km)
              </label>
              <input
                type="number"
                step="0.5"
                min={0.5}
                max={50}
                value={config.fallbackDistanceKm}
                onChange={(e) => setConfig({ ...config, fallbackDistanceKm: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={savingRules}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gray-900 text-white text-xs font-black hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {savingRules ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {savingRules ? "Saving Rules..." : "Save Global Rules"}
            </button>
          </div>
        </form>

        {/* Live Pricing Simulator */}
        <div className="lg:col-span-5 bg-gradient-to-br from-orange-50/80 to-amber-50/40 rounded-[2.5rem] p-8 border border-orange-200/70 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-md shadow-primary/20">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900">Live Fee Simulator</h3>
              <p className="text-[11px] font-medium text-gray-500">Test your slabs & promo logic before saving</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-500">Test Distance (km)</label>
              <input
                type="number"
                step="0.5"
                min={0}
                value={simDistanceKm}
                onChange={(e) => setSimDistanceKm(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-orange-200 rounded-xl text-sm font-black text-gray-900 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-500">Order Subtotal (₹)</label>
              <input
                type="number"
                min={0}
                value={simSubtotal}
                onChange={(e) => setSimSubtotal(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-orange-200 rounded-xl text-sm font-black text-gray-900 outline-none"
              />
            </div>
          </div>

          {simResult && (
            <div className="bg-white rounded-2xl p-4 border border-orange-100 space-y-3">
              <div className="space-y-1.5">
                {simResult.breakdown.map((b, idx) => (
                  <div key={idx} className="flex justify-between text-xs font-semibold text-gray-600">
                    <span>{b.label} <span className="text-[10px] text-gray-400">({b.detail})</span></span>
                    <span className="font-bold text-gray-900">₹{b.fee}</span>
                  </div>
                ))}
                {simResult.surge > 0 && (
                  <div className="flex justify-between text-xs font-semibold text-amber-700">
                    <span>Peak / Rain Surge</span>
                    <span className="font-bold">+₹{simResult.surge}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-gray-100 grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-gray-50">
                  <p className="text-[9px] font-black uppercase text-gray-400">Customer Pays</p>
                  <p className="text-xl font-black text-primary mt-0.5">
                    {simResult.customerFee === 0 ? "FREE (₹0)" : `₹${simResult.customerFee}`}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50">
                  <p className="text-[9px] font-black uppercase text-emerald-700">Rider Earns</p>
                  <p className="text-xl font-black text-emerald-700 mt-0.5">
                    ₹{simResult.baseDeliveryFee}
                  </p>
                </div>
              </div>

              {simResult.isFreeDelivery && (
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50/70 px-3 py-2 rounded-xl">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Free delivery promo applied — rider still receives ₹{simResult.baseDeliveryFee}!</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Slab Modal */}
      <AnimatePresence>
        {slabModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-lg font-black text-gray-900">
                  {editingSlab ? "Edit Distance Slab" : "Add Distance Slab"}
                </h3>
                <button
                  type="button"
                  onClick={() => setSlabModalOpen(false)}
                  className="p-1.5 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveSlab} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-500">Slab Label *</label>
                  <input
                    value={slabForm.label}
                    onChange={(e) => setSlabForm({ ...slabForm, label: e.target.value })}
                    placeholder="e.g. Extended Zone (6 – 10 km)"
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-500">From Distance (km) *</label>
                    <input
                      type="number"
                      step="0.5"
                      min={0}
                      value={slabForm.minKm}
                      onChange={(e) => setSlabForm({ ...slabForm, minKm: e.target.value })}
                      required
                      className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-500">To Distance (km)</label>
                    <input
                      type="number"
                      step="0.5"
                      min={0}
                      value={slabForm.maxKm}
                      onChange={(e) => setSlabForm({ ...slabForm, maxKm: e.target.value })}
                      disabled={slabForm.openEnded}
                      placeholder={slabForm.openEnded ? "∞ (No Limit)" : "e.g. 6"}
                      className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-600">
                  <input
                    type="checkbox"
                    checked={slabForm.openEnded}
                    onChange={(e) => setSlabForm({ ...slabForm, openEnded: e.target.checked, maxKm: "" })}
                    className="w-4 h-4 accent-primary rounded"
                  />
                  Open-ended tier (applies for all distances above Min km)
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-500">Charge Mode</label>
                    <select
                      value={slabForm.chargeType}
                      onChange={(e) => setSlabForm({ ...slabForm, chargeType: e.target.value as "flat" | "per_km" })}
                      className="w-full px-3 py-2.5 bg-gray-50 rounded-xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="flat">Flat Base Fee (₹)</option>
                      <option value="per_km">Per Extra KM (₹/km)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-500">Amount (₹) *</label>
                    <div className="relative">
                      <IndianRupee className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="number"
                        min={0}
                        value={slabForm.amount}
                        onChange={(e) => setSlabForm({ ...slabForm, amount: e.target.value })}
                        required
                        className="w-full pl-8 pr-3 py-2.5 bg-gray-50 rounded-xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setSlabModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-xs font-black"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingSlab}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-black shadow-md disabled:opacity-50"
                  >
                    {savingSlab ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    {editingSlab ? "Update Slab" : "Add Slab"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDeliveryPricing;
