// English translations for DPDP Act 2023 Privacy Features
export const enTranslations = {
  privacy: {
    title: 'Privacy & Data Protection',
    subtitle: 'Your privacy is important to us. Manage your data rights, cookie preferences, and understand how we process your information in compliance with India\'s Digital Personal Data Protection Act, 2023 (DPDP Act).',
    
    // Data Principal Rights
    rights: {
      title: 'Data Principal Rights',
      subtitle: 'Exercise your rights under India\'s Digital Personal Data Protection Act, 2023 (DPDP Act). We are committed to protecting your privacy and providing transparency about your data.',
      
      access: {
        title: 'Data Access Request',
        description: 'Request a copy of all personal data we have about you',
        button: 'Request Data Access'
      },
      
      deletion: {
        title: 'Right to Erasure',
        description: 'Request deletion of your personal data',
        button: 'Request Data Deletion'
      },
      
      portability: {
        title: 'Data Portability',
        description: 'Download your data in a machine-readable format',
        button: 'Download My Data'
      },
      
      rectification: {
        title: 'Data Correction',
        description: 'Request correction of inaccurate personal data',
        button: 'Request Correction'
      }
    },
    
    // Grievance Redressal
    grievance: {
      title: 'Grievance Redressal',
      subtitle: 'Submit your grievance under India\'s Digital Personal Data Protection Act, 2023',
      
      form: {
        name: 'Full Name',
        email: 'Email Address',
        phone: 'Phone Number',
        subject: 'Subject',
        description: 'Detailed Description',
        submit: 'Submit Grievance'
      },
      
      officer: {
        title: 'Contact Grievance Officer',
        name: 'Data Protection Officer',
        email: 'privacy@pulss.com'
      }
    },
    
    // Cookie Consent
    cookies: {
      title: 'We value your privacy',
      acceptAll: 'Accept All',
      rejectAll: 'Reject All',
      success: 'Your cookie preferences have been saved successfully.'
    },
    
    // Common
    common: {
      processing: 'Processing...',
      success: 'Success',
      responseTime: 'Response Time: Within 30 days as per DPDP Act 2023',
      required: 'Required',
      back: 'Back',
      submit: 'Submit'
    }
  }
}

export type Translations = typeof enTranslations
