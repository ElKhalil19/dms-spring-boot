const adminUser = {
  id: 1,
  name: 'Alice Admin',
  email: 'admin@dms.com',
  password: 'admin123',
  role: 'admin',
  departmentId: 1,
  status: 'active',
}

const mockDocuments = [
  { id: 1, title: 'Employee Handbook', description: 'Company policies', categoryId: 1, departmentId: 1, status: 'published', uploadedBy: 1, createdAt: '2024-01-15T10:00:00Z', updatedAt: '2024-03-01T09:00:00Z', tags: ['hr', 'policy'], currentVersion: 3 },
  { id: 2, title: 'Q1 Marketing Report', description: 'Marketing Q1', categoryId: 2, departmentId: 2, status: 'published', uploadedBy: 2, createdAt: '2024-04-01T08:00:00Z', updatedAt: '2024-04-05T11:00:00Z', tags: ['marketing'], currentVersion: 1 },
  { id: 3, title: 'Software Architecture Guide', description: 'Tech architecture', categoryId: 4, departmentId: 1, status: 'draft', uploadedBy: 1, createdAt: '2024-02-10T14:00:00Z', updatedAt: '2024-02-15T10:00:00Z', tags: ['engineering'], currentVersion: 2 },
  { id: 4, title: 'Vendor Contract Template', description: 'Vendor contract', categoryId: 3, departmentId: 3, status: 'archived', uploadedBy: 3, createdAt: '2023-11-01T09:00:00Z', updatedAt: '2023-12-01T09:00:00Z', tags: ['legal'], currentVersion: 1 },
  { id: 5, title: 'IT Security Policy', description: 'Security guidelines', categoryId: 1, departmentId: 1, status: 'published', uploadedBy: 1, createdAt: '2024-03-05T10:00:00Z', updatedAt: '2024-03-10T15:00:00Z', tags: ['security'], currentVersion: 2 },
  { id: 6, title: 'Onboarding Checklist', description: 'New employee onboarding', categoryId: 4, departmentId: 3, status: 'published', uploadedBy: 3, createdAt: '2024-01-20T11:00:00Z', updatedAt: '2024-02-01T09:00:00Z', tags: ['hr'], currentVersion: 1 },
  { id: 7, title: 'Annual Budget Plan', description: 'Fiscal year budget', categoryId: 2, departmentId: 2, status: 'draft', uploadedBy: 2, createdAt: '2024-04-10T09:00:00Z', updatedAt: '2024-04-10T09:00:00Z', tags: ['finance'], currentVersion: 1 },
]

const mockCategories = [
  { id: 1, name: 'Policy' },
  { id: 2, name: 'Report' },
  { id: 3, name: 'Contract' },
  { id: 4, name: 'Manual' },
]

const mockDepartments = [
  { id: 1, name: 'Engineering' },
  { id: 2, name: 'Marketing' },
  { id: 3, name: 'HR' },
]

describe('Document List Page', () => {
  beforeEach(() => {
    cy.clearLocalStorage()

    cy.intercept('GET', '/api/documents*', {
      statusCode: 200,
      body: mockDocuments,
    }).as('getDocs')

    cy.intercept('GET', '/api/categories', {
      statusCode: 200,
      body: mockCategories,
    }).as('getCats')

    cy.intercept('GET', '/api/departments', {
      statusCode: 200,
      body: mockDepartments,
    }).as('getDepts')

    cy.visit('/documents', {
      onBeforeLoad(win) {
        win.localStorage.setItem('dms-user', JSON.stringify(adminUser))
      },
    })

    cy.wait('@getDocs')
    // Optional but makes tests less flaky if UI needs these to render filters
    cy.wait('@getCats')
    cy.wait('@getDepts')
  })

  it('renders document list', () => {
    cy.get('[data-testid="document-card"]').should('have.length.gte', 1)
  })

  it('shows document titles', () => {
    cy.contains('Employee Handbook').should('be.visible')
    cy.contains('Q1 Marketing Report').should('be.visible')
  })

  it('shows status badges', () => {
    cy.contains('published').should('be.visible')
    cy.contains('draft').should('be.visible')
  })

  it('filters documents by search term', () => {
    cy.get('[data-testid="search-input"]').type('Security')
    cy.get('[data-testid="document-card"]').should('have.length', 1)
    cy.contains('IT Security Policy').should('be.visible')
  })

  it('filters documents by status', () => {
    cy.get('[data-testid="status-filter"]').select('draft')
    cy.get('[data-testid="document-card"]').each(($card) => {
      cy.wrap($card).contains('draft')
    })
  })

  it('filters documents by category', () => {
    cy.get('[data-testid="category-filter"]').select('Policy')
    cy.get('[data-testid="document-card"]').should('have.length.gte', 1)
    cy.contains('Employee Handbook').should('be.visible')
    cy.contains('Q1 Marketing Report').should('not.exist')
  })

  it('filters documents by department', () => {
    cy.get('[data-testid="department-filter"]').select('Engineering')

    // Many UIs show department name on the card; if yours does not,
    // this assertion will fail and you should instead assert on API call params.
    cy.get('[data-testid="document-card"]').each(($card) => {
      cy.wrap($card).contains('Engineering')
    })
  })

  it('clears all filters', () => {
    cy.get('[data-testid="search-input"]').type('Security')
    cy.get('[data-testid="status-filter"]').select('published')
    cy.get('[data-testid="clear-filters"]').click()

    cy.get('[data-testid="search-input"]').should('have.value', '')

    // If your <select> uses a placeholder option, the cleared value might be "all" or similar.
    // Adjust if needed.
    cy.get('[data-testid="status-filter"]').should('have.value', '')
  })

  it('shows pagination when more than 5 items', () => {
    cy.get('.pagination').should('exist')
    cy.contains('Page 1 of').should('be.visible')
  })

  it('navigates to next page', () => {
    cy.get('.pagination').contains('Next').click()
    cy.contains('Page 2 of').should('be.visible')
  })

  it('navigates to document detail on card click', () => {
    cy.intercept('GET', '/api/documents/1', {
      statusCode: 200,
      body: mockDocuments[0],
    }).as('getDoc')

    cy.intercept('GET', '/api/versions*', {
      statusCode: 200,
      body: [],
    }).as('getVersions')

    cy.intercept('GET', '/api/comments*', {
      statusCode: 200,
      body: [],
    }).as('getComments')

    cy.intercept('GET', '/api/users', {
      statusCode: 200,
      body: [adminUser],
    }).as('getUsers')

    cy.intercept('POST', '/api/activityLogs', {
      statusCode: 201,
      body: {},
    }).as('logActivity')

    cy.get('[data-testid="document-card"]').first().click()

    cy.wait('@getDoc')
    cy.wait('@getVersions')
    cy.wait('@getComments')

    cy.url().should('match', /\/documents\/\d+/)
  })
})

describe('Document Detail Page', () => {
  const mockDoc = mockDocuments[0]

  const mockVersions = [
    { id: 1, documentId: 1, version: 1, uploadedBy: 1, createdAt: '2024-01-15T10:00:00Z', notes: 'Initial upload', fileSize: '1.2 MB' },
    { id: 2, documentId: 1, version: 2, uploadedBy: 1, createdAt: '2024-02-01T09:00:00Z', notes: 'Updated section 3', fileSize: '1.3 MB' },
    { id: 3, documentId: 1, version: 3, uploadedBy: 1, createdAt: '2024-03-01T09:00:00Z', notes: 'Added appendix', fileSize: '1.5 MB' },
  ]

  const mockComments = [
    { id: 1, documentId: 1, userId: 2, text: 'Great doc!', createdAt: '2024-01-16T10:00:00Z' },
  ]

  beforeEach(() => {
    cy.clearLocalStorage()

    cy.intercept('GET', '/api/documents/1', {
      statusCode: 200,
      body: mockDoc,
    }).as('getDoc')

    cy.intercept('GET', '/api/versions*', {
      statusCode: 200,
      body: mockVersions,
    }).as('getVersions')

    cy.intercept('GET', '/api/comments*', {
      statusCode: 200,
      body: mockComments,
    }).as('getComments')

    cy.intercept('GET', '/api/categories', {
      statusCode: 200,
      body: mockCategories,
    }).as('getCats')

    cy.intercept('GET', '/api/departments', {
      statusCode: 200,
      body: mockDepartments,
    }).as('getDepts')

    cy.intercept('GET', '/api/users', {
      statusCode: 200,
      body: [adminUser],
    }).as('getUsers')

    cy.intercept('POST', '/api/activityLogs', {
      statusCode: 201,
      body: {},
    }).as('logActivity')

    cy.visit('/documents/1', {
      onBeforeLoad(win) {
        win.localStorage.setItem('dms-user', JSON.stringify(adminUser))
      },
    })

    cy.wait('@getDoc')
    cy.wait('@getVersions')
    cy.wait('@getComments')
  })

  it('shows document title and status', () => {
    cy.contains('Employee Handbook').should('be.visible')
    cy.contains('published').should('be.visible')
  })

  it('shows version history', () => {
    cy.contains('Version History').should('be.visible')
    cy.contains('v3').should('be.visible')
    cy.contains('Added appendix').should('be.visible')
  })

  it('shows comments', () => {
    cy.contains('Comments').should('be.visible')
    cy.contains('Great doc!').should('be.visible')
  })

  it('can post a new comment', () => {
    const createdAt = new Date().toISOString()

    cy.intercept('POST', '/api/comments', {
      statusCode: 201,
      body: { id: 99, documentId: 1, userId: 1, text: 'Test comment', createdAt },
    }).as('postComment')

    cy.get('textarea').type('Test comment')
    cy.contains('Post Comment').click()

    cy.wait('@postComment')
    cy.contains('Comment added!').should('be.visible')
  })

  it('shows upload new version form', () => {
    cy.contains('+ New Version').click()
    cy.get('textarea').first().should('be.visible')
  })
})