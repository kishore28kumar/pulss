# DPDP Act 2023 Compliance Implementation

This document outlines the implementation of India's Digital Personal Data Protection Act (DPDP Act), 2023 compliance features in the Pulss platform.

## Overview

The DPDP Act 2023 is India's comprehensive data protection legislation that grants specific rights to Data Principals (individuals) and imposes obligations on Data Fiduciaries (organizations).

## Key Features Implemented

### 1. Data Principal Rights

#### Backend API Endpoints (`/api/privacy/`)
- **Data Access** (`POST /data-access`): Request a copy of personal data
- **Data Correction** (`POST /data-correction`): Request correction of inaccurate data
- **Data Erasure** (`POST /data-erasure`): Request deletion of personal data
- **Consent Withdrawal** (`POST /consent-withdrawal`): Withdraw previously given consent
- **Grievance Redressal** (`POST /grievance`): Submit grievances about data processing
- **Privacy Settings** (`GET/PUT /settings/:customer_id`): Manage privacy preferences

#### Frontend Components
- **DPDPCompliance**: Data Principal rights exercise interface
- **GrievanceRedressal**: In-app grievance submission form
- **ParentalConsent**: Consent verification for users under 18
- **PrivacySettings**: Cookie and data processing preferences

### 2. Parental Consent (Users Under 18)

As per DPDP Act 2023 requirements:
- Age verification during registration
- Parental consent collection for minors
- Verification email to parent/guardian
- Limited access until consent is verified

#### API Endpoints
- `POST /api/privacy/parental-consent/check`: Check if parental consent is required
- `POST /api/privacy/parental-consent/submit`: Submit parental consent request

### 3. Grievance Redressal System

- In-app grievance submission form (no popups)
- Grievance Officer contact information displayed
- 30-day response timeline as per DPDP Act
- Grievance tracking with unique IDs

### 4. Data Residency

- Primary data storage in India
- Cross-border transfers only to whitelisted countries
- Compliance with DPDP Act data localization requirements

### 5. Non-Blocking UX

All privacy interactions use inline feedback instead of popups:
- Success messages appear as inline banners
- No blocking dialogs or popups
- Smooth, non-intrusive user experience
- Cookie consent banner at bottom (non-blocking)

### 6. Database Schema

New tables added (see `backend/migrations/02_privacy_dpdp_act.sql`):
- `privacy_grievances`: Store grievance submissions
- `parental_consents`: Track parental consent for minors
- `customer_privacy_settings`: Manage privacy preferences

Additional columns:
- `customers.date_of_birth`: For parental consent checks
- `customers.data_residency_country`: Track data location
- `customers.deleted_at`: Soft delete for audit trail

## Compliance Features

### Data Principal Rights Under DPDP Act 2023

1. **Right to Access**: Request information about personal data held
2. **Right to Correction**: Request correction of inaccurate data
3. **Right to Erasure**: Request deletion of personal data
4. **Right to Data Portability**: Download data in machine-readable format
5. **Right to Grievance Redressal**: Submit complaints about data processing

### Privacy by Design

- Data minimization: Collect only necessary data
- Purpose limitation: Use data only for stated purposes
- Storage limitation: Retain data only as long as necessary
- Security: Encryption and protection measures

### Transparency

- Clear data processing notices
- Cookie consent with detailed explanations
- Privacy policy references DPDP Act 2023
- Grievance Officer contact information prominently displayed

## Localization (To Be Implemented)

The system is designed to support:
- English (implemented)
- Hindi (to be implemented)
- Other regional languages (configurable)

## Usage

### For Users

1. **Exercise Data Rights**: Navigate to Privacy page → Your Rights tab
2. **Submit Grievance**: Navigate to Privacy page → Grievance tab
3. **Manage Cookies**: Navigate to Privacy page → Cookies tab
4. **Parental Consent**: Automatic prompt for users under 18 during registration

### For Developers

#### Adding Privacy Features

```javascript
// Example: Request data access
const response = await fetch('/api/privacy/data-access', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ customer_id: userId })
});
```

#### Checking Parental Consent

```javascript
// Example: Check if user requires parental consent
const response = await fetch('/api/privacy/parental-consent/check', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    customer_id: userId,
    date_of_birth: userDOB 
  })
});
```

## Grievance Officer

**Contact Information:**
- Title: Data Protection Officer
- Email: privacy@pulss.com
- Address: Pulss Technologies Pvt Ltd, Privacy Department, India
- Response Time: Within 30 days as per DPDP Act 2023

## Data Protection Board

For escalations or complaints not resolved within 30 days, users can approach the Data Protection Board of India as per the DPDP Act 2023.

## Testing

To test privacy features:

1. Build the application: `npm run build`
2. Start the backend: `cd backend && npm start`
3. Navigate to `/privacy` to test all privacy features
4. Test parental consent by creating a user profile with age < 18

## Security Considerations

- All personal data is encrypted at rest and in transit
- Access to privacy APIs requires authentication
- Audit logs track all privacy-related actions
- Data deletion requests are logged before execution
- Soft delete used for maintaining audit trails

## References

- [Digital Personal Data Protection Act, 2023](https://www.meity.gov.in/writereaddata/files/Digital%20Personal%20Data%20Protection%20Act%202023.pdf)
- [DPDP Rules (when published)](https://www.meity.gov.in/)

## License

This implementation is part of the Pulss platform and follows the same license terms.

## Changelog

### Version 1.0.0 (Current)
- Initial DPDP Act 2023 compliance implementation
- Backend API endpoints for all Data Principal rights
- Frontend components for privacy management
- Parental consent system
- Grievance redressal system
- Data residency tracking
- Non-blocking UX updates
- Database migration scripts

## Future Enhancements

- [ ] Multi-language support (Hindi, regional languages)
- [ ] Automated data export in standard formats (JSON, CSV, XML)
- [ ] Enhanced audit logging dashboard
- [ ] Integration with Data Protection Board reporting
- [ ] Automated consent renewal workflows
- [ ] Data retention policy automation
