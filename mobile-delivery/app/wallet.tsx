import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getMyWalletApi, requestPayoutApi } from '../src/api';

export default function DeliveryWalletScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [wallet, setWallet] = useState<any>({
    balance: 0,
    totalEarned: 0,
    totalWithdrawn: 0,
    bankDetails: {},
  });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<'payouts' | 'ledger'>('payouts');

  // Withdrawal Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const res = await getMyWalletApi();
      const data = res.data?.data || res.data;
      if (data) {
        setWallet(data.wallet || {});
        setTransactions(data.transactions || []);
        setPayouts(data.pendingPayouts || []);

        // Pre-fill bank details if saved
        if (data.wallet?.bankDetails) {
          setBankName(data.wallet.bankDetails.bankName || '');
          setAccountNumber(data.wallet.bankDetails.accountNumber || '');
          setIfscCode(data.wallet.bankDetails.ifscCode || '');
          setAccountHolder(data.wallet.bankDetails.accountHolderName || '');
        }
      }
    } catch (err: any) {
      console.error('[Wallet] Error fetching data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchWalletData();
  };

  const openWithdrawModal = () => {
    if (wallet.balance < 50) {
      Alert.alert(
        'Insufficient Balance',
        'Minimum withdrawal amount is ₹50. Deliver more orders to increase your balance!'
      );
      return;
    }
    setAmount('');
    setModalVisible(true);
  };

  const handleWithdrawSubmit = async () => {
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid withdrawal amount.');
      return;
    }

    if (numAmount > wallet.balance) {
      Alert.alert(
        'Exceeds Balance',
        `You cannot withdraw more than your available balance (₹${wallet.balance}).`
      );
      return;
    }

    if (!accountNumber.trim() || accountNumber.trim().length < 6) {
      Alert.alert('Invalid Bank Account', 'Please enter a valid bank account number.');
      return;
    }

    if (!ifscCode.trim() || ifscCode.trim().length < 4) {
      Alert.alert('Invalid IFSC', 'Please enter a valid bank IFSC code.');
      return;
    }

    setSubmitting(true);
    try {
      await requestPayoutApi(numAmount, {
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        ifscCode: ifscCode.trim().toUpperCase(),
        accountHolderName: accountHolder.trim() || 'Rider',
      });

      Alert.alert(
        'Payout Requested! 🎉',
        `Your withdrawal request for ₹${numAmount} has been submitted for admin approval. Funds will reach your bank account within 24 hours.`,
        [{ text: 'OK', onPress: () => setModalVisible(false) }]
      );

      fetchWalletData();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to request payout';
      Alert.alert('Payout Failed', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* ── Top Header ── */}
      <View className="bg-white pt-12 pb-4 px-4 border-b border-gray-100 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-2xl bg-gray-100 items-center justify-center mr-3"
          >
            <Ionicons name="chevron-back" size={20} color="#111827" />
          </TouchableOpacity>
          <View>
            <Text className="text-xl font-black text-gray-900">Rider Wallet</Text>
            <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
              Earnings & Bank Payouts
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={onRefresh}
          className="w-10 h-10 rounded-2xl bg-orange-50 items-center justify-center"
        >
          <Ionicons name="refresh" size={18} color="#ea580c" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 p-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ea580c" />}
      >
        {loading ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="large" color="#ea580c" />
            <Text className="text-xs font-bold text-gray-400 mt-3">Loading your wallet...</Text>
          </View>
        ) : (
          <>
            {/* ── Balance Card ── */}
            <View className="bg-orange-500 rounded-3xl p-6 shadow-xl shadow-orange-500/20 mb-5 relative overflow-hidden">
              <View className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10" />
              <View className="absolute right-12 -top-6 w-20 h-20 rounded-full bg-white/10" />

              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-xs font-black uppercase tracking-wider text-orange-100">
                  Available for Payout
                </Text>
                <View className="px-2.5 py-1 rounded-full bg-white/20">
                  <Text className="text-[10px] font-black text-white uppercase">Instant Settlement</Text>
                </View>
              </View>

              <Text className="text-4xl font-black text-white mb-4">
                ₹{wallet.balance?.toLocaleString() || 0}
              </Text>

              <View className="flex-row items-center justify-between pt-3 border-t border-white/20 mb-4">
                <View>
                  <Text className="text-[10px] font-bold text-orange-200 uppercase">Total Earned</Text>
                  <Text className="text-sm font-black text-white">
                    ₹{wallet.totalEarned?.toLocaleString() || 0}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-[10px] font-bold text-orange-200 uppercase">Withdrawn</Text>
                  <Text className="text-sm font-black text-white">
                    ₹{wallet.totalWithdrawn?.toLocaleString() || 0}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={openWithdrawModal}
                activeOpacity={0.9}
                className="bg-white py-3.5 rounded-2xl items-center shadow-md flex-row justify-center gap-2"
              >
                <Ionicons name="arrow-up-circle" size={18} color="#ea580c" />
                <Text className="text-primary font-black text-sm uppercase tracking-wide">
                  Withdraw to Bank Account
                </Text>
              </TouchableOpacity>
            </View>

            {/* ── Sub Tabs ── */}
            <View className="flex-row bg-gray-200/60 p-1 rounded-2xl mb-4">
              <TouchableOpacity
                onPress={() => setActiveTab('payouts')}
                className={`flex-1 py-2.5 rounded-xl items-center ${
                  activeTab === 'payouts' ? 'bg-white shadow-sm' : ''
                }`}
              >
                <Text
                  className={`text-xs font-black ${
                    activeTab === 'payouts' ? 'text-gray-900' : 'text-gray-500'
                  }`}
                >
                  Payout Requests ({payouts.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveTab('ledger')}
                className={`flex-1 py-2.5 rounded-xl items-center ${
                  activeTab === 'ledger' ? 'bg-white shadow-sm' : ''
                }`}
              >
                <Text
                  className={`text-xs font-black ${
                    activeTab === 'ledger' ? 'text-gray-900' : 'text-gray-500'
                  }`}
                >
                  Wallet History ({transactions.length})
                </Text>
              </TouchableOpacity>
            </View>

            {/* ── Tab 1: Payout Requests ── */}
            {activeTab === 'payouts' && (
              <View className="space-y-3">
                {payouts.length === 0 ? (
                  <View className="bg-white rounded-3xl p-8 items-center border border-gray-100">
                    <Ionicons name="receipt-outline" size={40} color="#d1d5db" />
                    <Text className="text-sm font-black text-gray-700 mt-2">No Payout Requests</Text>
                    <Text className="text-xs text-gray-400 text-center mt-1">
                      Whenever you withdraw your earnings to your bank, you can track the approval status here.
                    </Text>
                  </View>
                ) : (
                  payouts.map((p) => {
                    const isApproved = p.status === 'approved';
                    const isRejected = p.status === 'rejected';
                    const isPending = p.status === 'pending';

                    return (
                      <View
                        key={p._id}
                        className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm mb-3"
                      >
                        <View className="flex-row items-center justify-between pb-3 border-b border-gray-50 mb-2">
                          <View>
                            <Text className="text-base font-black text-gray-900">₹{p.amount}</Text>
                            <Text className="text-[10px] text-gray-400 font-mono">
                              A/C: •••• {p.bankDetails?.accountNumber?.slice(-4) || '—'}
                            </Text>
                          </View>

                          <View
                            className={`px-3 py-1 rounded-full ${
                              isApproved
                                ? 'bg-emerald-100'
                                : isRejected
                                ? 'bg-rose-100'
                                : 'bg-amber-100'
                            }`}
                          >
                            <Text
                              className={`text-[10px] font-black uppercase ${
                                isApproved
                                  ? 'text-emerald-700'
                                  : isRejected
                                  ? 'text-rose-700'
                                  : 'text-amber-700'
                              }`}
                            >
                              {isApproved ? '✓ Transferred' : isRejected ? 'Rejected' : 'Under Review'}
                            </Text>
                          </View>
                        </View>

                        {isApproved && p.transactionReference && (
                          <View className="bg-emerald-50/70 p-2.5 rounded-xl mb-1">
                            <Text className="text-[11px] font-black text-emerald-800">
                              Bank UTR Reference:
                            </Text>
                            <Text className="text-xs font-mono font-bold text-emerald-900">
                              {p.transactionReference}
                            </Text>
                          </View>
                        )}

                        {isRejected && (
                          <View className="bg-rose-50/70 p-2.5 rounded-xl mb-1">
                            <Text className="text-[11px] font-black text-rose-800">
                              Reason: {p.adminComment || 'Administrative reversal'}
                            </Text>
                            <Text className="text-[10px] text-rose-600 font-bold mt-0.5">
                              ✓ ₹{p.amount} has been restored back to your wallet balance.
                            </Text>
                          </View>
                        )}

                        {isPending && (
                          <Text className="text-[11px] text-gray-500 font-medium">
                            Admin is verifying bank details. Expected settlement within 24 hours.
                          </Text>
                        )}

                        <Text className="text-[10px] text-gray-400 font-bold mt-2">
                          Requested: {new Date(p.createdAt).toLocaleString()}
                        </Text>
                      </View>
                    );
                  })
                )}
              </View>
            )}

            {/* ── Tab 2: Wallet Transactions Ledger ── */}
            {activeTab === 'ledger' && (
              <View className="space-y-3">
                {transactions.length === 0 ? (
                  <View className="bg-white rounded-3xl p-8 items-center border border-gray-100">
                    <Ionicons name="wallet-outline" size={40} color="#d1d5db" />
                    <Text className="text-sm font-black text-gray-700 mt-2">No Transactions Yet</Text>
                    <Text className="text-xs text-gray-400 text-center mt-1">
                      Complete delivery trips to see your earnings recorded here.
                    </Text>
                  </View>
                ) : (
                  transactions.map((t) => {
                    const isCredit = t.type === 'credit';
                    return (
                      <View
                        key={t._id}
                        className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex-row items-center justify-between mb-3"
                      >
                        <View className="flex-row items-center flex-1 mr-3">
                          <View
                            className={`w-10 h-10 rounded-2xl items-center justify-center mr-3 ${
                              isCredit ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                            }`}
                          >
                            <Ionicons
                              name={isCredit ? 'arrow-down' : 'arrow-up'}
                              size={18}
                              color={isCredit ? '#059669' : '#e11d48'}
                            />
                          </View>
                          <View className="flex-1">
                            <Text className="text-xs font-black text-gray-900" numberOfLines={1}>
                              {t.description}
                            </Text>
                            <Text className="text-[10px] text-gray-400 mt-0.5">
                              {new Date(t.createdAt).toLocaleDateString()} • Balance: ₹{t.balanceAfter}
                            </Text>
                          </View>
                        </View>

                        <Text
                          className={`text-sm font-black ${
                            isCredit ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {isCredit ? `+₹${t.amount}` : `-₹${t.amount}`}
                        </Text>
                      </View>
                    );
                  })
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* ── Withdrawal Modal ── */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-end bg-black/50"
        >
          <View className="bg-white rounded-t-[2.5rem] p-6 shadow-2xl space-y-4">
            <View className="flex-row items-center justify-between pb-3 border-b border-gray-100">
              <View className="flex-row items-center gap-2">
                <View className="w-8 h-8 rounded-xl bg-orange-100 items-center justify-center">
                  <Ionicons name="arrow-up-circle" size={18} color="#ea580c" />
                </View>
                <Text className="text-lg font-black text-gray-900">Withdraw to Bank</Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
              >
                <Ionicons name="close" size={16} color="#4b5563" />
              </TouchableOpacity>
            </View>

            {/* Amount input */}
            <View className="space-y-1.5">
              <Text className="text-xs font-black uppercase tracking-wider text-gray-400">
                Withdrawal Amount (Max: ₹{wallet.balance})
              </Text>
              <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2">
                <Text className="text-xl font-black text-gray-900 mr-2">₹</Text>
                <TextInput
                  keyboardType="numeric"
                  placeholder="e.g. 500"
                  value={amount}
                  onChangeText={setAmount}
                  className="flex-1 text-xl font-black text-gray-900"
                />
              </View>
              {/* Quick chips */}
              <View className="flex-row gap-2 pt-1">
                {[100, 200, 500].map((val) => (
                  <TouchableOpacity
                    key={val}
                    onPress={() => setAmount(String(Math.min(val, wallet.balance)))}
                    className="px-3 py-1 rounded-xl bg-gray-100"
                  >
                    <Text className="text-xs font-bold text-gray-700">₹{val}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  onPress={() => setAmount(String(wallet.balance))}
                  className="px-3 py-1 rounded-xl bg-orange-100"
                >
                  <Text className="text-xs font-black text-primary">All (₹{wallet.balance})</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Bank details */}
            <View className="space-y-2 bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <Text className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                Bank Account Details
              </Text>

              <TextInput
                placeholder="Account Holder Name"
                value={accountHolder}
                onChangeText={setAccountHolder}
                className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900"
              />

              <TextInput
                placeholder="Bank Account Number"
                keyboardType="numeric"
                value={accountNumber}
                onChangeText={setAccountNumber}
                className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 font-mono"
              />

              <View className="flex-row gap-2">
                <TextInput
                  placeholder="IFSC Code"
                  autoCapitalize="characters"
                  value={ifscCode}
                  onChangeText={setIfscCode}
                  className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 font-mono uppercase"
                />
                <TextInput
                  placeholder="Bank Name"
                  value={bankName}
                  onChangeText={setBankName}
                  className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900"
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={handleWithdrawSubmit}
              disabled={submitting}
              className="bg-primary py-4 rounded-2xl items-center shadow-lg shadow-primary/30 mt-2"
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white font-black text-sm uppercase tracking-wide">
                  Submit Withdrawal Request
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
