const adminUser = {
  id: 1,
  name: 'Alice Admin',
  email: 'admin@dms.com',
  password: 'admin123',
  role: 'admin',
  departmentId: 1,
  status: 'active',
}

const mockUsers = [
  { id: 1, name: 'Alice Admin', email: 'admin@dms.com', role: 'admin', departmentId: 1, status: 'active' },
  { id: 2, name: 'Bob User', email: 'bob@dms.com', role: 'user', departmentId: 2, status: 'active' },
  { id: 3, name: 'Carol User', email: 'carol@dms.com', role: 'user', departmentId: 1, status: 'active' },
]

const mockDepartments = [
  { id: 1, name: 'Engineering', description: 'Software engineering team' },
  { id: 2, name: 'Marketing', description: 'Marketing and communications' },
  { id: 3, name: 'HR', description: 'Human resources' },
]

describe('Admin Users Page', () => {
  beforeEach(() => {
    cy.clearLocalStorage()

    cy.intercept('GET', '/api/users', {
      statusCode: 200,
      body: mockUsers,
    }).as('getUsers')

    cy.intercept('GET', '/api/departments', {
      statusCode: 200,
      body: mockDepartments,
    }).as('getDepts')

    cy.visit('/admin/users', {
      onBeforeLoad(win) {
        win.localStorage.setItem('dms-user', JSON.stringify(adminUser))
      },
    })

    cy.wait('@getUsers')
    cy.wait('@getDepts')
  })

  it('shows users table', () => {
    cy.get('[data-testid="users-table"]').should('exist')
    cy.get('[data-testid="user-row"]').should('have.length', 3)
  })

  it('displays user information', () => {
    cy.contains('Alice Admin').should('be.visible')
    cy.contains('admin@dms.com').should('be.visible')
    cy.contains('Bob User').should('be.visible')
  })

  it('shows add user form', () => {
    cy.get('[data-testid="add-user-form"]').should('exist')
    cy.get('[data-testid="user-name-input"]').should('be.visible')
    cy.get('[data-testid="user-email-input"]').should('be.visible')
    cy.get('[data-testid="user-role-select"]').should('be.visible')
  })

  it('adds a new user', () => {
    const newUser = { id: 4, name: 'Dave Test', email: 'dave@dms.com', role: 'user', departmentId: 1, status: 'active' }

    cy.intercept('POST', '/api/users', {
      statusCode: 201,
      body: newUser,
    }).as('createUser')

    cy.get('[data-testid="user-name-input"]').type('Dave Test')
    cy.get('[data-testid="user-email-input"]').type('dave@dms.com')
    cy.get('input[type="password"]').type('pass123')
    cy.get('[data-testid="user-role-select"]').select('user')
    cy.get('[data-testid="user-dept-select"]').select('Engineering')
    cy.get('[data-testid="add-user-submit"]').click()

    cy.wait('@createUser')
    cy.contains('User Dave Test added!').should('be.visible')
  })

  it('deletes a user', () => {
    cy.intercept('DELETE', '/api/users/3', {
      statusCode: 200,
      body: {},
    }).as('deleteUser')

    // Prefer scoping delete to the Carol row if possible (more stable).
    // If your UI doesn't have user-row wrappers, keep the `.last()` approach.
    cy.contains('Carol User')
      .parents('[data-testid="user-row"]')
      .find('[data-testid="delete-user-btn"]')
      .click({ force: true })

    cy.wait('@deleteUser')
    cy.contains('User deleted').should('be.visible')
  })

  it('shows role badges', () => {
    cy.contains('admin').should('be.visible')
    cy.contains('user').should('be.visible')
  })

  it('shows pagination', () => {
    const manyUsers = Array.from({ length: 8 }, (_, i) => ({
      id: i + 1,
      name: `User ${i + 1}`,
      email: `user${i + 1}@dms.com`,
      role: 'user',
      departmentId: 1,
      status: 'active',
    }))

    // Override the GET /api/users response for THIS test by revisiting the page
    // with a new intercept (avoid reload ordering issues).
    cy.intercept('GET', '/api/users', {
      statusCode: 200,
      body: manyUsers,
    }).as('getManyUsers')

    cy.visit('/admin/users', {
      onBeforeLoad(win) {
        win.localStorage.setItem('dms-user', JSON.stringify(adminUser))
      },
    })

    cy.wait('@getManyUsers')
    cy.get('.pagination').should('exist')
  })

  it('redirects non-admin users away', () => {
    const regularUser = { id: 2, name: 'Bob User', email: 'bob@dms.com', role: 'user', departmentId: 2, status: 'active' }

    cy.visit('/admin/users', {
      onBeforeLoad(win) {
        win.localStorage.setItem('dms-user', JSON.stringify(regularUser))
      },
    })

    cy.url().should('not.include', '/admin/users')
  })
})

describe('Admin Departments Page', () => {
  beforeEach(() => {
    cy.clearLocalStorage()

    cy.intercept('GET', '/api/departments', {
      statusCode: 200,
      body: mockDepartments,
    }).as('getDepts')

    cy.intercept('GET', '/api/users', {
      statusCode: 200,
      body: mockUsers,
    }).as('getUsers')

    cy.visit('/admin/departments', {
      onBeforeLoad(win) {
        win.localStorage.setItem('dms-user', JSON.stringify(adminUser))
      },
    })

    cy.wait('@getDepts')
    cy.wait('@getUsers')
  })

  it('shows department list', () => {
    cy.get('[data-testid="dept-card"]').should('have.length', 3)
    cy.contains('Engineering').should('be.visible')
    cy.contains('Marketing').should('be.visible')
    cy.contains('HR').should('be.visible')
  })

  it('selects a department and shows members', () => {
    cy.get('[data-testid="dept-card"]').first().click()
    cy.contains('Engineering — Members').should('be.visible')
  })

  it('shows existing department members', () => {
    cy.get('[data-testid="dept-card"]').first().click()
    cy.get('[data-testid="member-item"]').should('have.length.gte', 1)
    cy.contains('Alice Admin').should('be.visible')
  })

  it('shows assign user dropdown', () => {
    cy.get('[data-testid="dept-card"]').first().click()
    cy.get('[data-testid="assign-user-select"]').should('exist')
    cy.get('[data-testid="assign-user-btn"]').should('exist')
  })

  it('assigns a user to a department', () => {
    cy.intercept('PATCH', '/api/users/2', {
      statusCode: 200,
      body: { ...mockUsers[1], departmentId: 1 },
    }).as('assignUser')

    cy.get('[data-testid="dept-card"]').first().click()
    cy.get('[data-testid="assign-user-select"]').select('Bob User (bob@dms.com)')
    cy.get('[data-testid="assign-user-btn"]').click()

    cy.wait('@assignUser')
    cy.contains('User assigned to Engineering').should('be.visible')
  })

  it('shows member count on department cards', () => {
    cy.get('[data-testid="dept-card"]').first().contains('member')
  })
})

describe('Admin Activity Log Page', () => {
  const mockLogs = [
    { id: 1, userId: 1, action: 'LOGIN', description: 'Admin logged in', createdAt: '2024-04-15T08:00:00Z' },
    { id: 2, userId: 1, action: 'UPLOAD', description: 'Uploaded Employee Handbook v3', createdAt: '2024-03-01T09:00:00Z' },
    { id: 3, userId: 2, action: 'VIEW', description: 'Viewed Q1 Marketing Report', createdAt: '2024-04-02T11:00:00Z' },
  ]

  beforeEach(() => {
    cy.clearLocalStorage()

    cy.intercept('GET', '/api/activityLogs', {
      statusCode: 200,
      body: mockLogs,
    }).as('getLogs')

    cy.intercept('GET', '/api/users', {
      statusCode: 200,
      body: mockUsers,
    }).as('getUsers')

    cy.visit('/admin/activity', {
      onBeforeLoad(win) {
        win.localStorage.setItem('dms-user', JSON.stringify(adminUser))
      },
    })

    cy.wait('@getLogs')
    cy.wait('@getUsers')
  })

  it('shows activity log table', () => {
    cy.contains('Activity Log').should('be.visible')
    cy.contains('Admin logged in').should('be.visible')
    cy.contains('Uploaded Employee Handbook v3').should('be.visible')
  })

  it('shows user names in log', () => {
    cy.contains('Alice Admin').should('be.visible')
  })

  it('shows action types', () => {
    cy.contains('LOGIN').should('be.visible')
    cy.contains('UPLOAD').should('be.visible')
    cy.contains('VIEW').should('be.visible')
  })

  it('filters by action type', () => {
    cy.get('select').select('LOGIN')
    cy.contains('Uploaded Employee Handbook v3').should('not.exist')
    cy.contains('Admin logged in').should('be.visible')
  })

  it('clears filter', () => {
    cy.get('select').select('LOGIN')
    cy.contains('Clear').click()
    cy.contains('Uploaded Employee Handbook v3').should('be.visible')
  })
})