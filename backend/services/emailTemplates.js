// Default email templates with branding support

const defaultTemplates = {
  welcome: {
    name: 'Welcome Email',
    type: 'welcome',
    subject: 'Welcome to {{companyName}}!',
    htmlTemplate: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px 0; border-bottom: 3px solid {{primaryColor}}; }
    .logo { max-width: 200px; height: auto; }
    .content { padding: 30px 0; }
    .button { 
      display: inline-block; 
      padding: 12px 30px; 
      background-color: {{primaryColor}}; 
      color: white; 
      text-decoration: none; 
      border-radius: 5px; 
      margin: 20px 0;
    }
    .footer { 
      text-align: center; 
      padding: 20px 0; 
      border-top: 1px solid #eee; 
      color: #666; 
      font-size: 12px; 
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="{{logo}}" alt="{{companyName}}" class="logo">
    </div>
    <div class="content">
      <h1>Welcome, {{customerName}}!</h1>
      <p>Thank you for joining {{companyName}}. We're excited to have you on board!</p>
      <p>Your account has been successfully created and you can now start exploring our products and services.</p>
      <a href="{{dashboardUrl}}" class="button">Go to Dashboard</a>
      <p>If you have any questions, feel free to reach out to us at {{contactEmail}}.</p>
    </div>
    <div class="footer">
      <p>{{footerText}}</p>
      <p>{{companyName}} | {{contactEmail}} | {{contactPhone}}</p>
    </div>
  </div>
</body>
</html>
    `,
    textTemplate: 'Welcome {{customerName}}! Thank you for joining {{companyName}}.',
    variables: [
      { name: 'customerName', description: 'Customer name', required: true },
      { name: 'dashboardUrl', description: 'Dashboard URL', required: true },
    ],
  },
  
  order_confirmation: {
    name: 'Order Confirmation',
    type: 'order_confirmation',
    subject: 'Order Confirmation - #{{orderNumber}}',
    htmlTemplate: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px 0; border-bottom: 3px solid {{primaryColor}}; }
    .logo { max-width: 200px; height: auto; }
    .content { padding: 30px 0; }
    .order-details { background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0; }
    .order-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #ddd; }
    .total { font-weight: bold; font-size: 18px; color: {{primaryColor}}; }
    .footer { 
      text-align: center; 
      padding: 20px 0; 
      border-top: 1px solid #eee; 
      color: #666; 
      font-size: 12px; 
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="{{logo}}" alt="{{companyName}}" class="logo">
    </div>
    <div class="content">
      <h1>Order Confirmation</h1>
      <p>Hi {{customerName}},</p>
      <p>Thank you for your order! Your order #{{orderNumber}} has been confirmed and is being processed.</p>
      
      <div class="order-details">
        <h2>Order Details</h2>
        <div class="order-item">
          <span>Order Number:</span>
          <span>#{{orderNumber}}</span>
        </div>
        <div class="order-item">
          <span>Order Date:</span>
          <span>{{orderDate}}</span>
        </div>
        <div class="order-item total">
          <span>Total Amount:</span>
          <span>{{totalAmount}}</span>
        </div>
      </div>
      
      <p>You will receive another email when your order ships.</p>
      <p>Track your order: <a href="{{trackingUrl}}">Click here</a></p>
    </div>
    <div class="footer">
      <p>{{footerText}}</p>
      <p>{{companyName}} | {{contactEmail}} | {{contactPhone}}</p>
    </div>
  </div>
</body>
</html>
    `,
    textTemplate: 'Order #{{orderNumber}} confirmed! Total: {{totalAmount}}',
    variables: [
      { name: 'customerName', description: 'Customer name', required: true },
      { name: 'orderNumber', description: 'Order number', required: true },
      { name: 'orderDate', description: 'Order date', required: true },
      { name: 'totalAmount', description: 'Total amount', required: true },
      { name: 'trackingUrl', description: 'Order tracking URL', required: false },
    ],
  },
  
  invoice: {
    name: 'Invoice',
    type: 'invoice',
    subject: 'Invoice #{{invoiceNumber}} from {{companyName}}',
    htmlTemplate: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 700px; margin: 0 auto; padding: 20px; }
    .header { display: flex; justify-content: space-between; align-items: center; padding: 20px 0; border-bottom: 3px solid {{primaryColor}}; }
    .logo { max-width: 150px; height: auto; }
    .invoice-title { font-size: 36px; color: {{primaryColor}}; font-weight: bold; }
    .invoice-info { display: flex; justify-content: space-between; margin: 30px 0; }
    .info-block { flex: 1; }
    .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    .table th { background: {{primaryColor}}; color: white; }
    .total-row { font-weight: bold; font-size: 18px; background: #f5f5f5; }
    .footer { 
      text-align: center; 
      padding: 20px 0; 
      margin-top: 40px;
      border-top: 1px solid #eee; 
      color: #666; 
      font-size: 12px; 
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="{{logo}}" alt="{{companyName}}" class="logo">
      <div class="invoice-title">INVOICE</div>
    </div>
    
    <div class="invoice-info">
      <div class="info-block">
        <h3>From:</h3>
        <p><strong>{{companyName}}</strong></p>
        <p>{{companyAddress}}</p>
        <p>Tax ID: {{taxId}}</p>
      </div>
      <div class="info-block">
        <h3>To:</h3>
        <p><strong>{{customerName}}</strong></p>
        <p>{{customerAddress}}</p>
      </div>
      <div class="info-block">
        <p><strong>Invoice #:</strong> {{invoiceNumber}}</p>
        <p><strong>Date:</strong> {{invoiceDate}}</p>
        <p><strong>Due Date:</strong> {{dueDate}}</p>
      </div>
    </div>
    
    <table class="table">
      <thead>
        <tr>
          <th>Description</th>
          <th>Quantity</th>
          <th>Unit Price</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        {{items}}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3"><strong>Subtotal</strong></td>
          <td>{{subtotal}}</td>
        </tr>
        <tr>
          <td colspan="3"><strong>Tax</strong></td>
          <td>{{tax}}</td>
        </tr>
        <tr class="total-row">
          <td colspan="3"><strong>Total</strong></td>
          <td>{{total}}</td>
        </tr>
      </tfoot>
    </table>
    
    <div class="footer">
      <p><strong>Terms & Conditions:</strong></p>
      <p>{{termsAndConditions}}</p>
      <p>{{footerText}}</p>
      <p>{{companyName}} | {{contactEmail}} | {{contactPhone}}</p>
    </div>
  </div>
</body>
</html>
    `,
    textTemplate: 'Invoice #{{invoiceNumber}} - Total: {{total}}',
    variables: [
      { name: 'invoiceNumber', description: 'Invoice number', required: true },
      { name: 'invoiceDate', description: 'Invoice date', required: true },
      { name: 'dueDate', description: 'Due date', required: true },
      { name: 'customerName', description: 'Customer name', required: true },
      { name: 'customerAddress', description: 'Customer address', required: true },
      { name: 'items', description: 'Invoice items HTML', required: true },
      { name: 'subtotal', description: 'Subtotal amount', required: true },
      { name: 'tax', description: 'Tax amount', required: true },
      { name: 'total', description: 'Total amount', required: true },
    ],
  },
};

module.exports = { defaultTemplates };
