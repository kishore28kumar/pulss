const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// Ensure QR code directory exists
const qrDir = path.join(__dirname, '../uploads/qrcodes');
if (!fs.existsSync(qrDir)) {
  fs.mkdirSync(qrDir, { recursive: true });
}

/**
 * Generate QR code for store URL
 * @param {string} url - The URL to encode in QR code
 * @param {string} tenantId - Tenant ID for filename
 * @param {object} options - QR code options
 * @returns {Promise<string>} - Path to generated QR code image
 */
const generateStoreQR = async (url, tenantId, options = {}) => {
  try {
    const filename = `store-${tenantId}-${Date.now()}.png`;
    const filepath = path.join(qrDir, filename);
    
    const qrOptions = {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 2,
      width: options.width || 400,
      color: {
        dark: options.darkColor || '#000000',
        light: options.lightColor || '#FFFFFF'
      }
    };
    
    await QRCode.toFile(filepath, url, qrOptions);
    
    return `/uploads/qrcodes/${filename}`;
  } catch (error) {
    console.error('QR generation error:', error);
    throw new Error('Failed to generate QR code');
  }
};

/**
 * Generate QR code for UPI payment
 * @param {object} upiDetails - UPI payment details
 * @returns {Promise<string>} - Path to generated QR code image
 */
const generateUPIQR = async (upiDetails, tenantId) => {
  try {
    const { upiId, merchantName, amount, transactionNote } = upiDetails;
    
    // Generate UPI payment string
    // Format: upi://pay?pa=UPI_ID&pn=NAME&am=AMOUNT&tn=NOTE
    let upiString = `upi://pay?pa=${encodeURIComponent(upiId)}`;
    
    if (merchantName) {
      upiString += `&pn=${encodeURIComponent(merchantName)}`;
    }
    
    if (amount) {
      upiString += `&am=${amount}`;
    }
    
    if (transactionNote) {
      upiString += `&tn=${encodeURIComponent(transactionNote)}`;
    }
    
    const filename = `upi-${tenantId}-${Date.now()}.png`;
    const filepath = path.join(qrDir, filename);
    
    const qrOptions = {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 2,
      width: 400
    };
    
    await QRCode.toFile(filepath, upiString, qrOptions);
    
    return `/uploads/qrcodes/${filename}`;
  } catch (error) {
    console.error('UPI QR generation error:', error);
    throw new Error('Failed to generate UPI QR code');
  }
};

/**
 * Generate QR code as base64 string (for inline display)
 * @param {string} data - Data to encode
 * @param {object} options - QR code options
 * @returns {Promise<string>} - Base64 encoded QR code
 */
const generateQRBase64 = async (data, options = {}) => {
  try {
    const qrOptions = {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 2,
      width: options.width || 400,
      color: {
        dark: options.darkColor || '#000000',
        light: options.lightColor || '#FFFFFF'
      }
    };
    
    const qrCodeDataURL = await QRCode.toDataURL(data, qrOptions);
    return qrCodeDataURL;
  } catch (error) {
    console.error('QR base64 generation error:', error);
    throw new Error('Failed to generate QR code');
  }
};

/**
 * Generate branded QR code with logo (requires sharp for image manipulation)
 * @param {string} data - Data to encode
 * @param {string} logoPath - Path to logo image
 * @param {string} tenantId - Tenant ID
 * @returns {Promise<string>} - Path to generated branded QR code
 */
const generateBrandedQR = async (data, logoPath, tenantId) => {
  try {
    // For now, generate simple QR
    // TODO: Implement logo overlay using sharp library
    return await generateStoreQR(data, tenantId);
  } catch (error) {
    console.error('Branded QR generation error:', error);
    throw new Error('Failed to generate branded QR code');
  }
};

/**
 * Delete old QR codes for a tenant
 * @param {string} tenantId - Tenant ID
 */
const cleanupOldQRCodes = async (tenantId) => {
  try {
    const files = fs.readdirSync(qrDir);
    const tenantFiles = files.filter(file => file.startsWith(`store-${tenantId}-`) || file.startsWith(`upi-${tenantId}-`));
    
    // Keep only the latest 5 QR codes
    if (tenantFiles.length > 5) {
      const sortedFiles = tenantFiles
        .map(file => ({
          name: file,
          time: fs.statSync(path.join(qrDir, file)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time);
      
      // Delete old files
      sortedFiles.slice(5).forEach(file => {
        fs.unlinkSync(path.join(qrDir, file.name));
      });
    }
  } catch (error) {
    console.error('QR cleanup error:', error);
  }
};

module.exports = {
  generateStoreQR,
  generateUPIQR,
  generateQRBase64,
  generateBrandedQR,
  cleanupOldQRCodes
};
