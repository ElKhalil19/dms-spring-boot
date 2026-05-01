describe('Login Flow', () => {
  const adminUser = { id: 1, name: 'Alice Admin', email: 'admin@dms.com', password: 'admin123', role: 'admin', departmentId: 1, status: 'active' }
  const regularUser = { id: 2, name: 'Bob User', email: 'bob@dms.com', password: 'user123', role: 'user', departmentId: 2, status: 'active' }

  beforeEach(() => {
    cy.clearLocalStorage()
  })

  it('shows login page at /login', () => {
    cy.visit('/login')
    cy.contains('Document Management System').should('be.visible')
    cy.get('input[type="email"]').should('exist')
    cy.get('input[type="password"]').should('exist')
    cy.get('button[type="submit"]').should('contain', 'Sign In')
  })

  it('redirects unauthenticated users to /login', () => {
    cy.visit('/documents')
    cy.url().should('include', '/login')
  })

  it('shows error on invalid credentials', () => {
    cy.fixture('users').then((users) => {
      cy.intercept('GET', '/api/users', users).as('getUsers')
      cy.visit('/login')
      cy.get('input[type="email"]').type('wrong@example.com')
      cy.get('input[type="password"]').type('wrongpass')
      cy.get('button[type="submit"]').click()
      cy.wait('@getUsers')
      cy.contains('Invalid email or password').should('be.visible')
    })
  })

  it('successfully logs in as admin and redirects to /documents', () => {
    cy.fixture('users').then((users) => {
      cy.intercept('GET', '/api/users', users).as('getUsers')
      cy.intercept('GET', '/api/documents*', []).as('getDocs')
      cy.intercept('GET', '/api/categories', []).as('getCats')
      cy.intercept('GET', '/api/departments', []).as('getDepts')

      cy.visit('/login')
      cy.get('input[type="email"]').type(adminUser.email)
      cy.get('input[type="password"]').type(adminUser.password)
      cy.get('button[type="submit"]').click()

      cy.wait('@getUsers')
      cy.url().should('include', '/documents')
    })
  })

  it('shows admin navigation links for admin users', () => {
    cy.fixture('users').then((users) => {
      cy.intercept('GET', '/api/users', users).as('getUsers')
      cy.intercept('GET', '/api/documents*', []).as('getDocs')
      cy.intercept('GET', '/api/categories', []).as('getCats')
      cy.intercept('GET', '/api/departments', []).as('getDepts')

      cy.visit('/login')
      cy.get('input[type="email"]').type(adminUser.email)
      cy.get('input[type="password"]').type(adminUser.password)
      cy.get('button[type="submit"]').click()
      cy.wait('@getUsers')

      cy.contains('Users').should('be.visible')
      cy.contains('Departments').should('be.visible')
      cy.contains('Activity Log').should('be.visible')
    })
  })

  it('does not show admin links for regular users', () => {
    cy.fixture('users').then((users) => {
      cy.intercept('GET', '/api/users', users).as('getUsers')
      cy.intercept('GET', '/api/documents*', []).as('getDocs')
      cy.intercept('GET', '/api/categories', []).as('getCats')
      cy.intercept('GET', '/api/departments', []).as('getDepts')

      cy.visit('/login')
      cy.get('input[type="email"]').type(regularUser.email)
      cy.get('input[type="password"]').type(regularUser.password)
      cy.get('button[type="submit"]').click()
      cy.wait('@getUsers')

      cy.contains('Activity Log').should('not.exist')
    })
  })

  it('logs out and redirects to /login', () => {
    cy.fixture('users').then((users) => {
      cy.intercept('GET', '/api/users', users).as('getUsers')
      cy.intercept('GET', '/api/documents*', []).as('getDocs')
      cy.intercept('GET', '/api/categories', []).as('getCats')
      cy.intercept('GET', '/api/departments', []).as('getDepts')

      cy.visit('/login')
      cy.get('input[type="email"]').type(adminUser.email)
      cy.get('input[type="password"]').type(adminUser.password)
      cy.get('button[type="submit"]').click()
      cy.wait('@getUsers')

      cy.contains('Logout').click()
      cy.url().should('include', '/login')
    })
  })

  it('persists login across page reload via localStorage', () => {
    cy.window().then((win) => {
      win.localStorage.setItem('dms-user', JSON.stringify(adminUser))
    })
    cy.intercept('GET', '/api/documents*', []).as('getDocs')
    cy.intercept('GET', '/api/categories', []).as('getCats')
    cy.intercept('GET', '/api/departments', []).as('getDepts')

    cy.visit('/documents')
    cy.url().should('include', '/documents')
    cy.contains('Alice Admin').should('be.visible')
  })
})
