import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx}',
    supportFile: 'cypress/support/e2e.js',
    videosFolder: 'cypress/videos',
    screenshotsFolder: 'cypress/screenshots',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
})
