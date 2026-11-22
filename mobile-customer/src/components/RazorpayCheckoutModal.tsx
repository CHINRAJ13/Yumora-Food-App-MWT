import React, { useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';

interface RazorpayCheckoutModalProps {
  visible: boolean;
  orderId: string;
  keyId: string;
  amount: number; // in Rupees
  currency?: string;
  restaurantName?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  onSuccess: (data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
  onDismiss: () => void;
  onError: (errorMsg: string) => void;
}

export const RazorpayCheckoutModal: React.FC<RazorpayCheckoutModalProps> = ({
  visible,
  orderId,
  keyId,
  amount,
  currency = 'INR',
  restaurantName = 'Yumora Food',
  customerName = 'Customer',
  customerEmail = 'customer@yumora.com',
  customerPhone = '9876543210',
  onSuccess,
  onDismiss,
  onError,
}) => {
  const htmlContent = useMemo(() => {
    const amountInPaise = Math.round(amount * 100);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Razorpay Checkout</title>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <style>
    * { box-sizing: border-box; }
    body, html {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background-color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    .loading-card {
      text-align: center;
      padding: 24px;
    }
    .spinner {
      border: 3px solid #f3f4f6;
      border-top: 3px solid #ea580c;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 16px auto;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .title {
      font-size: 15px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 6px;
    }
    .subtitle {
      font-size: 12px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="loading-card">
    <div class="spinner"></div>
    <div class="title">Opening Secure Checkout...</div>
    <div class="subtitle">Powered by Razorpay • Do not press back</div>
  </div>

  <script>
    window.onload = function() {
      try {
        var options = {
          "key": "${keyId}",
          "amount": "${amountInPaise}",
          "currency": "${currency}",
          "name": "${restaurantName.replace(/"/g, '\\"')}",
          "description": "Order Payment",
          "order_id": "${orderId}",
          "prefill": {
            "name": "${customerName.replace(/"/g, '\\"')}",
            "email": "${customerEmail.replace(/"/g, '\\"')}",
            "contact": "${customerPhone.replace(/"/g, '\\"')}"
          },
          "theme": {
            "color": "#ea580c"
          },
          "handler": function (response) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'PAYMENT_SUCCESS',
              data: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              }
            }));
          },
          "modal": {
            "ondismiss": function() {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'PAYMENT_DISMISSED'
              }));
            }
          }
        };

        var rzp = new Razorpay(options);
        rzp.on('payment.failed', function (response) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'PAYMENT_FAILED',
            error: response.error ? response.error.description : 'Payment could not be processed'
          }));
        });

        rzp.open();
      } catch (e) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'PAYMENT_ERROR',
          error: e.message || 'Error opening payment gateway'
        }));
      }
    };
  </script>
</body>
</html>
    `;
  }, [orderId, keyId, amount, currency, restaurantName, customerName, customerEmail, customerPhone]);

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data);
      if (payload.type === 'PAYMENT_SUCCESS') {
        onSuccess(payload.data);
      } else if (payload.type === 'PAYMENT_DISMISSED') {
        onDismiss();
      } else if (payload.type === 'PAYMENT_FAILED' || payload.type === 'PAYMENT_ERROR') {
        onError(payload.error || 'Payment failed');
      }
    } catch {
      // Non-JSON message, ignore
    }
  };

  const handleManualClose = () => {
    Alert.alert(
      'Cancel Payment?',
      'Are you sure you want to cancel the payment process?',
      [
        { text: 'Continue Payment', style: 'cancel' },
        { text: 'Yes, Cancel', style: 'destructive', onPress: onDismiss },
      ]
    );
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={handleManualClose}>
      <SafeAreaView className="flex-1 bg-white">
        {/* Header Bar */}
        <View className="px-5 py-3.5 bg-white border-b border-gray-100 flex-row items-center justify-between shadow-xs">
          <View className="flex-row items-center gap-2.5">
            <View className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 items-center justify-center">
              <Ionicons name="shield-checkmark" size={16} color="#059669" />
            </View>
            <View>
              <Text className="text-sm font-black text-gray-900">Razorpay Secure</Text>
              <Text className="text-[10px] font-bold text-gray-400">100% Safe 256-Bit SSL</Text>
            </View>
          </View>

          <View className="flex-row items-center gap-3">
            <View className="bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-xl">
              <Text className="text-xs font-black text-primary">₹{amount}</Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleManualClose}
              className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
            >
              <Ionicons name="close" size={18} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>

        {/* WebView executing standard checkout */}
        <WebView
          originWhitelist={['*']}
          source={{ html: htmlContent, baseUrl: 'https://checkout.razorpay.com' }}
          onMessage={handleMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          renderLoading={() => (
            <View className="absolute inset-0 items-center justify-center bg-white">
              <ActivityIndicator size="large" color="#ea580c" />
              <Text className="text-xs font-bold text-gray-400 mt-2.5">
                Connecting to payment gateway...
              </Text>
            </View>
          )}
          className="flex-1"
        />
      </SafeAreaView>
    </Modal>
  );
};
