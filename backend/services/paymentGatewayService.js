const axios = require('axios');
const crypto = require('crypto');

/**
 * Payment Gateway Service
 * Integrations for Indian payment providers: Razorpay, Cashfree, Paytm
 */

class PaymentGatewayService {
  constructor() {
    // Configuration from environment
    this.razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    this.razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
    this.cashfreeAppId = process.env.CASHFREE_APP_ID;
    this.cashfreeSecretKey = process.env.CASHFREE_SECRET_KEY;
    this.cashfreeMode = process.env.CASHFREE_MODE || 'TEST'; // TEST or PROD
    this.paytmMid = process.env.PAYTM_MID;
    this.paytmMerchantKey = process.env.PAYTM_MERCHANT_KEY;
    this.paytmMode = process.env.PAYTM_MODE || 'STAGING'; // STAGING or PROD
  }

  /**
   * RAZORPAY INTEGRATION
   */

  /**
   * Create Razorpay order for subscription/invoice payment
   */
  async createRazorpayOrder(amount, currency = 'INR', receipt, notes = {}) {
    if (!this.razorpayKeyId || !this.razorpayKeySecret) {
      throw new Error('Razorpay credentials not configured');
    }

    try {
      const response = await axios.post(
        'https://api.razorpay.com/v1/orders',
        {
          amount: Math.round(amount * 100), // Razorpay expects amount in paise
          currency,
          receipt,
          notes,
        },
        {
          auth: {
            username: this.razorpayKeyId,
            password: this.razorpayKeySecret,
          },
        }
      );

      return {
        success: true,
        orderId: response.data.id,
        amount: response.data.amount,
        currency: response.data.currency,
        receipt: response.data.receipt,
        status: response.data.status,
      };
    } catch (error) {
      console.error('Razorpay order creation failed:', error.response?.data || error.message);
      throw new Error('Failed to create Razorpay order');
    }
  }

  /**
   * Verify Razorpay payment signature
   */
  verifyRazorpaySignature(orderId, paymentId, signature) {
    const body = orderId + '|' + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', this.razorpayKeySecret)
      .update(body)
      .digest('hex');

    return expectedSignature === signature;
  }

  /**
   * Create Razorpay subscription
   */
  async createRazorpaySubscription(planId, customerNotify = 1, totalCount, startAt = null) {
    if (!this.razorpayKeyId || !this.razorpayKeySecret) {
      throw new Error('Razorpay credentials not configured');
    }

    try {
      const data = {
        plan_id: planId,
        customer_notify: customerNotify,
        total_count: totalCount,
      };

      if (startAt) {
        data.start_at = Math.floor(startAt.getTime() / 1000);
      }

      const response = await axios.post('https://api.razorpay.com/v1/subscriptions', data, {
        auth: {
          username: this.razorpayKeyId,
          password: this.razorpayKeySecret,
        },
      });

      return {
        success: true,
        subscriptionId: response.data.id,
        status: response.data.status,
        startAt: response.data.start_at,
        endAt: response.data.end_at,
        chargeAt: response.data.charge_at,
      };
    } catch (error) {
      console.error(
        'Razorpay subscription creation failed:',
        error.response?.data || error.message
      );
      throw new Error('Failed to create Razorpay subscription');
    }
  }

  /**
   * Cancel Razorpay subscription
   */
  async cancelRazorpaySubscription(subscriptionId, cancelAtCycleEnd = true) {
    if (!this.razorpayKeyId || !this.razorpayKeySecret) {
      throw new Error('Razorpay credentials not configured');
    }

    try {
      const response = await axios.post(
        `https://api.razorpay.com/v1/subscriptions/${subscriptionId}/cancel`,
        {
          cancel_at_cycle_end: cancelAtCycleEnd ? 1 : 0,
        },
        {
          auth: {
            username: this.razorpayKeyId,
            password: this.razorpayKeySecret,
          },
        }
      );

      return {
        success: true,
        status: response.data.status,
        endedAt: response.data.ended_at,
      };
    } catch (error) {
      console.error(
        'Razorpay subscription cancellation failed:',
        error.response?.data || error.message
      );
      throw new Error('Failed to cancel Razorpay subscription');
    }
  }

  /**
   * Process Razorpay refund
   */
  async processRazorpayRefund(paymentId, amount, notes = {}) {
    if (!this.razorpayKeyId || !this.razorpayKeySecret) {
      throw new Error('Razorpay credentials not configured');
    }

    try {
      const data = {
        notes,
      };

      if (amount) {
        data.amount = Math.round(amount * 100); // Amount in paise
      }

      const response = await axios.post(
        `https://api.razorpay.com/v1/payments/${paymentId}/refund`,
        data,
        {
          auth: {
            username: this.razorpayKeyId,
            password: this.razorpayKeySecret,
          },
        }
      );

      return {
        success: true,
        refundId: response.data.id,
        status: response.data.status,
        amount: response.data.amount / 100,
        currency: response.data.currency,
      };
    } catch (error) {
      console.error('Razorpay refund failed:', error.response?.data || error.message);
      throw new Error('Failed to process Razorpay refund');
    }
  }

  /**
   * CASHFREE INTEGRATION
   */

  /**
   * Create Cashfree order
   */
  async createCashfreeOrder(
    orderId,
    orderAmount,
    customerName,
    customerPhone,
    customerEmail,
    returnUrl
  ) {
    if (!this.cashfreeAppId || !this.cashfreeSecretKey) {
      throw new Error('Cashfree credentials not configured');
    }

    try {
      const baseUrl =
        this.cashfreeMode === 'PROD'
          ? 'https://api.cashfree.com/pg/orders'
          : 'https://sandbox.cashfree.com/pg/orders';

      const response = await axios.post(
        baseUrl,
        {
          order_id: orderId,
          order_amount: orderAmount,
          order_currency: 'INR',
          customer_details: {
            customer_id: orderId,
            customer_name: customerName,
            customer_email: customerEmail,
            customer_phone: customerPhone,
          },
          order_meta: {
            return_url: returnUrl,
          },
        },
        {
          headers: {
            'x-client-id': this.cashfreeAppId,
            'x-client-secret': this.cashfreeSecretKey,
            'x-api-version': '2022-09-01',
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        orderId: response.data.order_id,
        paymentSessionId: response.data.payment_session_id,
        orderStatus: response.data.order_status,
      };
    } catch (error) {
      console.error('Cashfree order creation failed:', error.response?.data || error.message);
      throw new Error('Failed to create Cashfree order');
    }
  }

  /**
   * Verify Cashfree signature
   */
  verifyCashfreeSignature(orderId, orderAmount, signature) {
    const body = orderId + orderAmount;
    const expectedSignature = crypto
      .createHmac('sha256', this.cashfreeSecretKey)
      .update(body)
      .digest('base64');

    return expectedSignature === signature;
  }

  /**
   * Get Cashfree order status
   */
  async getCashfreeOrderStatus(orderId) {
    if (!this.cashfreeAppId || !this.cashfreeSecretKey) {
      throw new Error('Cashfree credentials not configured');
    }

    try {
      const baseUrl =
        this.cashfreeMode === 'PROD'
          ? `https://api.cashfree.com/pg/orders/${orderId}`
          : `https://sandbox.cashfree.com/pg/orders/${orderId}`;

      const response = await axios.get(baseUrl, {
        headers: {
          'x-client-id': this.cashfreeAppId,
          'x-client-secret': this.cashfreeSecretKey,
          'x-api-version': '2022-09-01',
        },
      });

      return {
        success: true,
        orderId: response.data.order_id,
        orderStatus: response.data.order_status,
        orderAmount: response.data.order_amount,
        paymentTime: response.data.payment_time,
      };
    } catch (error) {
      console.error('Cashfree order status check failed:', error.response?.data || error.message);
      throw new Error('Failed to get Cashfree order status');
    }
  }

  /**
   * Process Cashfree refund
   */
  async processCashfreeRefund(orderId, refundAmount, refundId, refundNote = '') {
    if (!this.cashfreeAppId || !this.cashfreeSecretKey) {
      throw new Error('Cashfree credentials not configured');
    }

    try {
      const baseUrl =
        this.cashfreeMode === 'PROD'
          ? `https://api.cashfree.com/pg/orders/${orderId}/refunds`
          : `https://sandbox.cashfree.com/pg/orders/${orderId}/refunds`;

      const response = await axios.post(
        baseUrl,
        {
          refund_id: refundId,
          refund_amount: refundAmount,
          refund_note: refundNote,
        },
        {
          headers: {
            'x-client-id': this.cashfreeAppId,
            'x-client-secret': this.cashfreeSecretKey,
            'x-api-version': '2022-09-01',
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        refundId: response.data.refund_id,
        refundStatus: response.data.refund_status,
        refundAmount: response.data.refund_amount,
      };
    } catch (error) {
      console.error('Cashfree refund failed:', error.response?.data || error.message);
      throw new Error('Failed to process Cashfree refund');
    }
  }

  /**
   * PAYTM INTEGRATION
   */

  /**
   * Generate Paytm checksum
   */
  generatePaytmChecksum(params) {
    const data = JSON.stringify(params);
    return crypto.createHmac('sha256', this.paytmMerchantKey).update(data).digest('base64');
  }

  /**
   * Verify Paytm checksum
   */
  verifyPaytmChecksum(params, checksum) {
    const expectedChecksum = this.generatePaytmChecksum(params);
    return expectedChecksum === checksum;
  }

  /**
   * Create Paytm transaction
   */
  async createPaytmTransaction(orderId, amount, customerId, callbackUrl) {
    if (!this.paytmMid || !this.paytmMerchantKey) {
      throw new Error('Paytm credentials not configured');
    }

    try {
      const baseUrl =
        this.paytmMode === 'PROD'
          ? 'https://securegw.paytm.in/theia/api/v1/initiateTransaction'
          : 'https://securegw-stage.paytm.in/theia/api/v1/initiateTransaction';

      const params = {
        body: {
          requestType: 'Payment',
          mid: this.paytmMid,
          websiteName: 'WEBSTAGING',
          orderId: orderId,
          callbackUrl: callbackUrl,
          txnAmount: {
            value: amount.toString(),
            currency: 'INR',
          },
          userInfo: {
            custId: customerId,
          },
        },
      };

      const checksum = this.generatePaytmChecksum(params.body);

      const response = await axios.post(baseUrl, params, {
        headers: {
          'Content-Type': 'application/json',
          'x-mid': this.paytmMid,
          'x-checksum': checksum,
        },
      });

      return {
        success: true,
        txnToken: response.data.body.txnToken,
        orderId: orderId,
      };
    } catch (error) {
      console.error('Paytm transaction creation failed:', error.response?.data || error.message);
      throw new Error('Failed to create Paytm transaction');
    }
  }

  /**
   * Get Paytm transaction status
   */
  async getPaytmTransactionStatus(orderId) {
    if (!this.paytmMid || !this.paytmMerchantKey) {
      throw new Error('Paytm credentials not configured');
    }

    try {
      const baseUrl =
        this.paytmMode === 'PROD'
          ? 'https://securegw.paytm.in/v3/order/status'
          : 'https://securegw-stage.paytm.in/v3/order/status';

      const params = {
        body: {
          mid: this.paytmMid,
          orderId: orderId,
        },
      };

      const checksum = this.generatePaytmChecksum(params.body);

      const response = await axios.post(baseUrl, params, {
        headers: {
          'Content-Type': 'application/json',
          'x-mid': this.paytmMid,
          'x-checksum': checksum,
        },
      });

      return {
        success: true,
        orderId: response.data.body.orderId,
        txnId: response.data.body.txnId,
        txnAmount: response.data.body.txnAmount,
        txnStatus: response.data.body.resultInfo.resultStatus,
      };
    } catch (error) {
      console.error(
        'Paytm transaction status check failed:',
        error.response?.data || error.message
      );
      throw new Error('Failed to get Paytm transaction status');
    }
  }

  /**
   * Process Paytm refund
   */
  async processPaytmRefund(orderId, refId, txnId, refundAmount) {
    if (!this.paytmMid || !this.paytmMerchantKey) {
      throw new Error('Paytm credentials not configured');
    }

    try {
      const baseUrl =
        this.paytmMode === 'PROD'
          ? 'https://securegw.paytm.in/refund/apply'
          : 'https://securegw-stage.paytm.in/refund/apply';

      const params = {
        body: {
          mid: this.paytmMid,
          orderId: orderId,
          refId: refId,
          txnId: txnId,
          refundAmount: refundAmount.toString(),
        },
      };

      const checksum = this.generatePaytmChecksum(params.body);

      const response = await axios.post(baseUrl, params, {
        headers: {
          'Content-Type': 'application/json',
          'x-mid': this.paytmMid,
          'x-checksum': checksum,
        },
      });

      return {
        success: true,
        refId: response.data.body.refId,
        refundId: response.data.body.refundId,
        refundAmount: response.data.body.refundAmount,
        resultStatus: response.data.body.resultInfo.resultStatus,
      };
    } catch (error) {
      console.error('Paytm refund failed:', error.response?.data || error.message);
      throw new Error('Failed to process Paytm refund');
    }
  }

  /**
   * Generic method to create order for any gateway
   */
  async createOrder(gateway, orderData) {
    switch (gateway.toLowerCase()) {
      case 'razorpay':
        return await this.createRazorpayOrder(
          orderData.amount,
          orderData.currency,
          orderData.receipt,
          orderData.notes
        );

      case 'cashfree':
        return await this.createCashfreeOrder(
          orderData.orderId,
          orderData.amount,
          orderData.customerName,
          orderData.customerPhone,
          orderData.customerEmail,
          orderData.returnUrl
        );

      case 'paytm':
        return await this.createPaytmTransaction(
          orderData.orderId,
          orderData.amount,
          orderData.customerId,
          orderData.callbackUrl
        );

      default:
        throw new Error(`Unsupported payment gateway: ${gateway}`);
    }
  }

  /**
   * Generic method to verify payment
   */
  verifyPayment(gateway, verificationData) {
    switch (gateway.toLowerCase()) {
      case 'razorpay':
        return this.verifyRazorpaySignature(
          verificationData.orderId,
          verificationData.paymentId,
          verificationData.signature
        );

      case 'cashfree':
        return this.verifyCashfreeSignature(
          verificationData.orderId,
          verificationData.orderAmount,
          verificationData.signature
        );

      case 'paytm':
        return this.verifyPaytmChecksum(verificationData.params, verificationData.checksum);

      default:
        throw new Error(`Unsupported payment gateway: ${gateway}`);
    }
  }

  /**
   * Generic method to process refund
   */
  async processRefund(gateway, refundData) {
    switch (gateway.toLowerCase()) {
      case 'razorpay':
        return await this.processRazorpayRefund(
          refundData.paymentId,
          refundData.amount,
          refundData.notes
        );

      case 'cashfree':
        return await this.processCashfreeRefund(
          refundData.orderId,
          refundData.amount,
          refundData.refundId,
          refundData.note
        );

      case 'paytm':
        return await this.processPaytmRefund(
          refundData.orderId,
          refundData.refId,
          refundData.txnId,
          refundData.amount
        );

      default:
        throw new Error(`Unsupported payment gateway: ${gateway}`);
    }
  }
}

module.exports = new PaymentGatewayService();
