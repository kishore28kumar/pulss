const express = require('express');
const router = express.Router();
const privacyControllerDPDP = require('../controllers/privacyController'); // DPDP Act 2023
const privacyControllerGDPR = require('../controllers/privacy'); // GDPR
const { authMiddleware } = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// Data Principal Rights under DPDP Act 2023
router.post('/data-access', privacyControllerDPDP.requestDataAccess);
router.post('/data-correction', privacyControllerDPDP.requestDataCorrection);
router.post('/data-erasure', privacyControllerDPDP.requestDataErasure);
router.post('/consent-withdrawal', privacyControllerDPDP.withdrawConsent);

// Grievance Redressal
router.post('/grievance', privacyControllerDPDP.submitGrievance);

// Privacy Settings
router.get('/settings/:customer_id', privacyControllerDPDP.getPrivacySettings);
router.put('/settings/:customer_id', privacyControllerDPDP.updatePrivacySettings);

// Parental Consent (for users under 18)
router.post('/parental-consent/check', privacyControllerDPDP.checkParentalConsent);
router.post('/parental-consent/submit', privacyControllerDPDP.submitParentalConsent);

// Grievance Officer Contact
router.get('/grievance-officer', privacyControllerDPDP.getGrievanceOfficer);

// User consent management
router.get('/consent', privacyControllerGDPR.getUserConsent);
router.post('/consent', privacyControllerGDPR.updateUserConsent);

// Data export (GDPR Article 20 - Data Portability)
router.post('/data-export', privacyControllerGDPR.requestDataExport);
router.get('/data-export/:requestId', privacyControllerGDPR.getDataExportStatus);

// Data deletion (GDPR Article 17 - Right to be Forgotten)
router.post('/data-deletion', privacyControllerGDPR.requestDataDeletion);
router.get('/data-deletion/:requestId', privacyControllerGDPR.getDataDeletionStatus);

// Admin endpoints for managing deletion requests
router.get('/admin/data-deletion-requests', privacyControllerGDPR.listDataDeletionRequests);
router.post('/admin/data-deletion-requests/:requestId/process', privacyControllerGDPR.processDataDeletionRequest);

module.exports = router;
