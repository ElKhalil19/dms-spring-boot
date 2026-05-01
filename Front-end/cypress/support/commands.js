// Custom Cypress commands

Cypress.Commands.add('login', (email = 'admin@dms.com', password = 'admin123') => {
  cy.fixture('users').then((users) => {
    const user = users.find((u) => u.email === email)

    cy.intercept('GET', '/api/users', users).as('getUsers')

    cy.visit('/login')
    cy.get('input[type="email"]').type(email)
    cy.get('input[type="password"]').type(password)
    cy.get('button[type="submit"]').click()

    cy.url().should('include', '/documents')

    if (user) {
      cy.window().then((win) => {
        win.localStorage.setItem('dms-user', JSON.stringify(user))
      })
    }
  })
})

Cypress.Commands.add('loginByLocalStorage', (role = 'admin') => {
  cy.fixture('users').then((users) => {
    const user = users.find((u) => u.role === role)
    if (user) {
      cy.window().then((win) => {
        win.localStorage.setItem('dms-user', JSON.stringify(user))
      })
    }
  })
})
