import React, { useEffect, useState, useRef } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DeliveryCountdownTimerProps {
  order: any;
  liveETA?: string | null;
  liveDistance?: string | null;
}

const parseEtaMinutes = (eta?: string | null): number | null => {
  if (!eta) return null;
  const match = eta.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
};

export const DeliveryCountdownTimer: React.FC<DeliveryCountdownTimerProps> = ({
  order,
  liveETA,
  liveDistance,
}) => {
  const [now, setNow] = useState(() => Date.now());
  const socketTargetRef = useRef<number | null>(null);

  useEffect(() => {
    const mins = parseEtaMinutes(liveETA);
    if (order?.status === 'Out for Delivery' && mins !== null && mins > 0) {
      socketTargetRef.current = Date.now() + mins * 60000;
    }
  }, [liveETA, order?.status]);

  const isActive = !['Delivered', 'Cancelled'].includes(order?.status);

  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [isActive]);

  if (!order || order.status === 'Cancelled') return null;

  const estMinutes = order.estimatedDeliveryMinutes || 35;
  const createdMs = order.createdAt ? new Date(order.createdAt).getTime() : now;

  if (order.status === 'Delivered') {
    const deliveredMs = order.deliveredAt
      ? new Date(order.deliveredAt).getTime()
      : order.updatedAt
      ? new Date(order.updatedAt).getTime()
      : now;
    const actualMins =
      order.actualDeliveryMinutes ||
      Math.max(1, Math.round((deliveredMs - createdMs) / 60000));
    const onTime = actualMins <= estMinutes;

    return (
      <View className="mt-3 p-3 bg-emerald-100/80 border border-emerald-200 rounded-2xl flex-row items-center justify-between">
        <View className="flex-row items-center gap-2.5">
          <View className="w-8 h-8 rounded-xl bg-emerald-600 items-center justify-center">
            <Ionicons name="checkmark-done" size={16} color="#ffffff" />
          </View>
          <View>
            <Text className="text-[10px] font-black uppercase text-emerald-800">
              Total Delivery Duration
            </Text>
            <Text className="text-sm font-black text-gray-900">
              Delivered in {actualMins} {actualMins === 1 ? 'min' : 'mins'}
            </Text>
          </View>
        </View>
        <View className={`px-2.5 py-1 rounded-full ${onTime ? 'bg-emerald-600' : 'bg-amber-500'}`}>
          <Text className="text-[9px] font-black uppercase text-white">
            {onTime ? '⚡ On Time' : 'Completed'}
          </Text>
        </View>
      </View>
    );
  }

  const baseTargetMs = order.targetDeliveryTime
    ? new Date(order.targetDeliveryTime).getTime()
    : createdMs + estMinutes * 60000;

  const targetMs =
    order.status === 'Out for Delivery' && socketTargetRef.current
      ? socketTargetRef.current
      : baseTargetMs;

  const remainingSec = Math.floor((targetMs - now) / 1000);
  const totalWindowMs = Math.max(60000, targetMs - createdMs);
  const elapsedMs = Math.max(0, now - createdMs);
  const progressPct = Math.min(100, Math.round((elapsedMs / totalWindowMs) * 100));

  const arrivalTimeFormatted = new Date(targetMs).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (remainingSec <= 0) {
    const lateMins = Math.max(1, Math.ceil(Math.abs(remainingSec) / 60));
    return (
      <View className="mt-3 p-3 bg-amber-100/80 border border-amber-200 rounded-2xl">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Ionicons name="alert-circle" size={18} color="#d97706" />
            <View>
              <Text className="text-[10px] font-black uppercase text-amber-800">
                Arriving Shortly
              </Text>
              <Text className="text-xs font-black text-gray-900">
                Running slightly behind (+{lateMins}m)
              </Text>
            </View>
          </View>
          {liveDistance && (
            <View className="bg-amber-200 px-2.5 py-1 rounded-full">
              <Text className="text-[10px] font-black text-amber-900">{liveDistance}</Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  const mins = Math.floor(remainingSec / 60);
  const secs = remainingSec % 60;
  const formattedCountdown = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <View className="mt-3 p-3.5 bg-white/90 border border-orange-200 rounded-2xl">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2.5">
          <View className="w-9 h-9 rounded-xl bg-primary items-center justify-center">
            <Ionicons name="timer-outline" size={18} color="#ffffff" />
          </View>
          <View>
            <Text className="text-[10px] font-black uppercase text-orange-700">
              Time Remaining {liveDistance ? `• ${liveDistance}` : ''}
            </Text>
            <View className="flex-row items-baseline gap-1.5">
              <Text className="text-xl font-black font-mono text-gray-900">
                {formattedCountdown}
              </Text>
              <Text className="text-[11px] font-bold text-gray-500">mins</Text>
            </View>
          </View>
        </View>

        <View className="items-end">
          <Text className="text-[9px] font-black uppercase text-gray-400">Arriving By</Text>
          <Text className="text-xs font-black text-gray-900 mt-0.5">{arrivalTimeFormatted}</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View className="w-full h-1.5 bg-orange-100 rounded-full overflow-hidden">
        <View
          className="h-full bg-primary rounded-full"
          style={{ width: `${progressPct}%` }}
        />
      </View>
    </View>
  );
};
