import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/header/Header';
import Footer from '../components/footer/Footer';
import { createOrder } from '../api/orders';

const GUEST_CART_KEY = 'guestCart';
const USER_CART_KEY = 'userCart';

const buildOrderPayloadFromCartItem = (item) => {
    if (!item) return null;

    const productId = item.product_id ?? item.productId ?? item.id;
    if (!productId) {
        console.warn('Skipping cart item without product ID', item);
        return null;
    }

    const quantity = Number(item.quantity) || 1;
    const rentalPeriod = Number(item.rent_time ?? item.rentalDays ?? item.rental_period ?? 1);
    const baseUnitPrice = Number(item.unit_price ?? item.price_per_day ?? item.price ?? 0);
    
    // Always calculate total: base price per day * quantity * rental period (in days)
    const calculatedTotal = baseUnitPrice * quantity * rentalPeriod;
    
    console.log('Building order payload:', {
        productId,
        quantity,
        rentalPeriod,
        baseUnitPrice,
        calculatedTotal
    });

    const payload = {
        productId,
        quantity,
        rentalPeriod,
        unitPrice: baseUnitPrice,
        subtotal: calculatedTotal,
        totalAmount: calculatedTotal,
    };

    const size = item.properties?.size ?? item.size ?? item.product_size;
    const color = item.properties?.color ?? item.color ?? item.product_color;

    if (size) {
        payload.productSize = size;
    }
    if (color) {
        payload.productColor = color;
    }

    return payload;
};

const PaymentPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const {
        totalAmount: stateTotalAmount = 100,
        cartItems: stateCartItems = []
    } = location.state || {};
    
    // Sample seller payment information
    const sellerPaymentInfo = {
        bankId: '970422',  // MB Bank
        accountNo: '0123456789',
        accountName: 'NGUYEN VAN A',
        template: 'compact' // or 'compact2', 'compact3', 'qr_only'
    };

    const [paymentConfirmed, setPaymentConfirmed] = useState(false);
    const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
    const [orderError, setOrderError] = useState(null);

    const storedCart = useMemo(() => {
        if (typeof window === 'undefined') return null;
        try {
            const stored =
                localStorage.getItem(USER_CART_KEY) ??
                localStorage.getItem(GUEST_CART_KEY);
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.error('Failed to parse stored cart:', error);
            return null;
        }
    }, []);

    const cartItems = stateCartItems.length ? stateCartItems : storedCart?.items ?? [];
    const paymentAmount = useMemo(() => {
        if (typeof stateTotalAmount === 'number' && !Number.isNaN(stateTotalAmount)) {
            return stateTotalAmount;
        }
        const storedTotal = Number(storedCart?.total_cost);
        return Number.isNaN(storedTotal) ? 0 : storedTotal;
    }, [stateTotalAmount, storedCart]);

    const orderPayloads = useMemo(
        () => cartItems.map(buildOrderPayloadFromCartItem).filter(Boolean),
        [cartItems]
    );

    // Generate VietQR URL
    const qrCodeUrl = useMemo(() => {
        const description = encodeURIComponent(`Payment for order`);
        return `https://img.vietqr.io/image/${sellerPaymentInfo.bankId}-${sellerPaymentInfo.accountNo}-${sellerPaymentInfo.template}.png?amount=${paymentAmount}&addInfo=${description}&accountName=${sellerPaymentInfo.accountName}`;
    }, [paymentAmount, sellerPaymentInfo]);

    const handlePaymentComplete = async () => {
        if (!orderPayloads.length) {
            setOrderError('Your cart is empty.');
            return;
        }

        setIsSubmittingOrder(true);
        setOrderError(null);

        try {
            const orders = [];
            for (const payload of orderPayloads) {
                const order = await createOrder(payload);
                orders.push(order);
            }

            setPaymentConfirmed(true);

            try {
                await fetch('/api/cart/items', {
                    method: 'PUT',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ newList: [] }),
                });
            } catch (cartError) {
                console.warn('Failed to clear cart on checkout:', cartError);
            }

            if (typeof window !== 'undefined') {
                localStorage.removeItem(USER_CART_KEY);
                localStorage.removeItem(GUEST_CART_KEY);
            }

            // Navigate to orders page after a short delay
            setTimeout(() => {
                navigate('/orders', { state: { orders } });
            }, 1500);
        } catch (error) {
            console.error('Failed to create order:', error);
            setOrderError(error.message || 'Unable to create order right now.');
        } finally {
            setIsSubmittingOrder(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Payment</h1>
                    <p className="text-gray-600">Complete your payment to confirm your order</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Payment Information */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Details</h2>
                        
                        <div className="space-y-4">
                            <div className="flex justify-between items-center pb-4 border-b">
                                <span className="text-gray-600">Order Total</span>
                                <span className="text-2xl font-bold text-gray-900">${paymentAmount.toFixed(2)}</span>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h3 className="font-semibold text-blue-900 mb-2">Bank Transfer Information</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-blue-700">Bank:</span>
                                        <span className="font-semibold text-blue-900">MB Bank</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-blue-700">Account Number:</span>
                                        <span className="font-semibold text-blue-900">{sellerPaymentInfo.accountNo}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-blue-700">Account Name:</span>
                                        <span className="font-semibold text-blue-900">{sellerPaymentInfo.accountName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-blue-700">Amount:</span>
                                        <span className="font-semibold text-blue-900">${paymentAmount.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <div className="flex gap-2">
                                    <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    <div>
                                        <h4 className="font-semibold text-yellow-800 mb-1">Important Notes:</h4>
                                        <ul className="text-sm text-yellow-700 space-y-1">
                                            <li>• Scan the QR code using your banking app</li>
                                            <li>• Make sure the amount matches exactly</li>
                                            <li>• Keep your payment receipt</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* QR Code Section */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Scan QR Code</h2>
                        
                        <div className="flex flex-col items-center">
                            <div className="bg-gray-100 p-4 rounded-lg mb-4">
                                <img 
                                    src={qrCodeUrl} 
                                    alt="Payment QR Code"
                                    className="w-full max-w-sm"
                                    onError={(e) => {
                                        e.target.src = 'https://via.placeholder.com/400x400?text=QR+Code';
                                    }}
                                />
                            </div>
                            
                            <p className="text-center text-gray-600 mb-6">
                                Scan this QR code with your banking app to complete payment
                            </p>

                            {paymentConfirmed ? (
                                <div className="w-full bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                                    <div className="flex items-center justify-center gap-2 text-green-700">
                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span className="font-semibold">Payment confirmed! Redirecting to orders...</span>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={handlePaymentComplete}
                                    disabled={isSubmittingOrder || !orderPayloads.length}
                                    className={`w-full font-bold py-4 rounded-lg transition-colors ${
                                        isSubmittingOrder || !orderPayloads.length
                                            ? 'bg-gray-400 text-white cursor-not-allowed'
                                            : 'bg-black hover:bg-gray-800 text-white'
                                    }`}
                                >
                                    {isSubmittingOrder ? 'Processing...' : 'Completed payment'}
                                </button>
                            )}

                            {orderError && (
                                <p className="w-full mt-3 text-sm text-red-600 text-center">
                                    {orderError}
                                </p>
                            )}

                            <button
                                onClick={() => navigate('/cart')}
                                className="w-full mt-3 border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-3 rounded-lg transition-colors"
                            >
                                Back to Cart
                            </button>
                        </div>
                    </div>
                </div>

                {/* Additional Information */}
                <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
                    <h3 className="font-bold text-gray-900 mb-3">Payment Instructions:</h3>
                    <ol className="list-decimal list-inside space-y-2 text-gray-700">
                        <li>Open your banking app (MB Bank, Vietcombank, Techcombank, etc.)</li>
                        <li>Select "Transfer" or "QR Payment" option</li>
                        <li>Scan the QR code shown above</li>
                        <li>Verify the payment details (amount and account name)</li>
                        <li>Complete the transfer</li>
                        <li>Click "Completed payment" button once payment is complete</li>
                    </ol>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default PaymentPage;
