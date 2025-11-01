/**
 * Axe-core accessibility testing integration
 * This file initializes axe-core in development mode to automatically
 * check for accessibility issues and log them to the console.
 */

import React from 'react'
import ReactDOM from 'react-dom/client'

let axe: any = null

/**
 * Initialize axe-core for accessibility testing in development mode
 */
export async function initializeAxe() {
  if (import.meta.env.DEV) {
    try {
      const axeCore = await import('@axe-core/react')
      axe = axeCore.default
      
      // Initialize axe with React and ReactDOM
      // The third parameter (1000) is the debounce time in milliseconds
      axe(React, ReactDOM, 1000, {
        // Configure axe to check specific rules
        rules: [
          // Enable all WCAG 2.1 Level A and AA rules
          { id: 'aria-allowed-attr', enabled: true },
          { id: 'aria-required-attr', enabled: true },
          { id: 'aria-required-children', enabled: true },
          { id: 'aria-required-parent', enabled: true },
          { id: 'aria-roles', enabled: true },
          { id: 'aria-valid-attr', enabled: true },
          { id: 'aria-valid-attr-value', enabled: true },
          { id: 'button-name', enabled: true },
          { id: 'color-contrast', enabled: true },
          { id: 'document-title', enabled: true },
          { id: 'duplicate-id', enabled: true },
          { id: 'html-has-lang', enabled: true },
          { id: 'html-lang-valid', enabled: true },
          { id: 'image-alt', enabled: true },
          { id: 'input-button-name', enabled: true },
          { id: 'label', enabled: true },
          { id: 'link-name', enabled: true },
          { id: 'list', enabled: true },
          { id: 'listitem', enabled: true },
          { id: 'meta-viewport', enabled: true },
          { id: 'region', enabled: true },
          { id: 'valid-lang', enabled: true },
        ],
      })
      
      console.log('✅ Axe-core accessibility testing initialized')
      console.log('Accessibility violations will be logged to the console')
    } catch (error) {
      console.warn('Failed to initialize axe-core:', error)
    }
  }
}

export { axe }
