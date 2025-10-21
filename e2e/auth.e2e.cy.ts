// e2e/auth.e2e.cy.ts - Cypress E2E tests for web application
describe('Authentication E2E Tests', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  describe('Login Flow', () => {
    it('should display login form', () => {
      cy.get('input[name="email"]').should('be.visible');
      cy.get('input[name="password"]').should('be.visible');
      cy.get('button[type="submit"]').should('be.visible');
    });

    it('should login successfully with valid credentials', () => {
      cy.get('input[name="email"]').type('admin@exitsaas.com');
      cy.get('input[name="password"]').type('admin123');
      cy.get('button[type="submit"]').click();

      cy.url().should('include', '/dashboard');
      cy.get('[data-testid="user-menu"]').should('be.visible');
    });

    it('should show error with invalid credentials', () => {
      cy.get('input[name="email"]').type('admin@exitsaas.com');
      cy.get('input[name="password"]').type('wrongpassword');
      cy.get('button[type="submit"]').click();

      cy.get('[role="alert"]').should('contain', 'Invalid credentials');
    });

    it('should show validation error with empty form', () => {
      cy.get('button[type="submit"]').click();

      cy.get('[role="alert"]').should('exist');
    });

    it('should show validation error with invalid email', () => {
      cy.get('input[name="email"]').type('not-an-email');
      cy.get('input[name="password"]').type('password123');
      cy.get('button[type="submit"]').click();

      cy.get('[role="alert"]').should('contain', 'Invalid email');
    });
  });

  describe('Navigation Protection', () => {
    it('should redirect unauthenticated users to login', () => {
      cy.visit('/dashboard');
      cy.url().should('include', '/login');
    });

    it('should allow authenticated users to access dashboard', () => {
      cy.login('admin@exitsaas.com', 'admin123');
      cy.visit('/dashboard');
      cy.url().should('include', '/dashboard');
    });
  });

  describe('Logout', () => {
    it('should logout successfully', () => {
      cy.login('admin@exitsaas.com', 'admin123');
      cy.get('[data-testid="user-menu"]').click();
      cy.get('[data-testid="logout-button"]').click();

      cy.url().should('include', '/login');
    });
  });
});

describe('User Management E2E Tests', () => {
  beforeEach(() => {
    cy.login('admin@exitsaas.com', 'admin123');
  });

  describe('User List', () => {
    it('should display user list', () => {
      cy.visit('/admin/users');
      cy.get('[data-testid="user-table"]').should('be.visible');
    });

    it('should search users', () => {
      cy.visit('/admin/users');
      cy.get('input[placeholder="Search users"]').type('admin');
      cy.get('[data-testid="user-table"] tbody tr').should('have.length.greaterThan', 0);
    });

    it('should paginate user list', () => {
      cy.visit('/admin/users');
      cy.get('[data-testid="next-page-button"]').click();
      cy.url().should('include', 'page=2');
    });
  });

  describe('Create User', () => {
    it('should create new user', () => {
      cy.visit('/admin/users/new');

      cy.get('input[name="email"]').type(`user-${Date.now()}@example.com`);
      cy.get('input[name="firstName"]').type('John');
      cy.get('input[name="lastName"]').type('Doe');
      cy.get('input[name="password"]').type('SecurePass123!');
      cy.get('button[type="submit"]').click();

      cy.get('[role="alert"]').should('contain', 'User created');
      cy.url().should('include', '/admin/users');
    });

    it('should validate email uniqueness', () => {
      cy.visit('/admin/users/new');

      cy.get('input[name="email"]').type('admin@exitsaas.com');
      cy.get('input[name="firstName"]').type('Test');
      cy.get('input[name="lastName"]').type('User');
      cy.get('input[name="password"]').type('Password123!');
      cy.get('button[type="submit"]').click();

      cy.get('[role="alert"]').should('contain', 'Email already exists');
    });
  });
});

describe('Dashboard E2E Tests', () => {
  beforeEach(() => {
    cy.login('admin@exitsaas.com', 'admin123');
  });

  describe('Dashboard Display', () => {
    it('should display dashboard stats', () => {
      cy.visit('/dashboard');

      cy.get('[data-testid="stat-card-users"]').should('be.visible');
      cy.get('[data-testid="stat-card-roles"]').should('be.visible');
      cy.get('[data-testid="stat-card-permissions"]').should('be.visible');
    });

    it('should display charts', () => {
      cy.visit('/dashboard');
      cy.get('[data-testid="chart-login-activity"]').should('be.visible');
      cy.get('[data-testid="chart-permission-usage"]').should('be.visible');
    });
  });

  describe('Navigation', () => {
    it('should navigate through main menu items', () => {
      cy.get('[data-testid="menu-users"]').click();
      cy.url().should('include', '/admin/users');

      cy.get('[data-testid="menu-roles"]').click();
      cy.url().should('include', '/admin/roles');

      cy.get('[data-testid="menu-permissions"]').click();
      cy.url().should('include', '/admin/permissions');
    });
  });
});

describe('Theme & Preferences E2E Tests', () => {
  beforeEach(() => {
    cy.login('admin@exitsaas.com', 'admin123');
  });

  describe('Dark Mode Toggle', () => {
    it('should toggle dark mode', () => {
      cy.get('[data-testid="theme-toggle"]').click();
      cy.get('body').should('have.class', 'dark-mode');

      cy.get('[data-testid="theme-toggle"]').click();
      cy.get('body').should('not.have.class', 'dark-mode');
    });

    it('should persist theme preference', () => {
      cy.get('[data-testid="theme-toggle"]').click();
      cy.reload();
      cy.get('body').should('have.class', 'dark-mode');
    });
  });

  describe('Settings', () => {
    it('should update user profile', () => {
      cy.visit('/settings/profile');

      cy.get('input[name="firstName"]').clear().type('Updated');
      cy.get('button[type="submit"]').click();

      cy.get('[role="alert"]').should('contain', 'Profile updated');
    });
  });
});
