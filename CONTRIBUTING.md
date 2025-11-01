# Contributing to Pulss White-Label Platform

Thank you for your interest in contributing to the Pulss White-Label E-Commerce Platform! This guide will help you get started with development and explain our standards and processes.

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Git Workflow](#git-workflow)
- [Code Review Process](#code-review-process)
- [Testing Guidelines](#testing-guidelines)
- [Troubleshooting](#troubleshooting)

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **PostgreSQL** >= 14.0 (for backend development)
- **Git**
- **Make** (optional, for using Makefile commands)

### Quick Setup

The easiest way to get started is using our Makefile:

```bash
# Complete project setup (installs dependencies and configures hooks)
make setup

# Or manually:
npm install
cd backend && npm install
npx husky install
```

## 🛠️ Development Setup

### Frontend Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Copy environment variables:**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start development server:**
   ```bash
   npm run dev
   # or
   make dev
   ```

### Backend Setup

1. **Install dependencies:**

   ```bash
   cd backend
   npm install
   ```

2. **Configure environment:**

   ```bash
   cp .env.example .env
   # Edit with your database credentials
   ```

3. **Setup database:**

   ```bash
   # Create database
   createdb pulssdb

   # Run migrations
   npm run migrate:local

   # (Optional) Seed with sample data
   npm run seed:local
   ```

4. **Start backend server:**
   ```bash
   npm run dev
   # or from root:
   make backend-dev
   ```

## 📏 Coding Standards

We enforce strict coding standards to maintain code quality and consistency.

### Code Style

- **JavaScript/TypeScript**: Follow ESLint rules configured in `eslint.config.js`
- **CSS**: Follow Stylelint rules for Tailwind CSS
- **Formatting**: Prettier is configured for consistent formatting

### Automated Enforcement

Our pre-commit hooks automatically:

- Run ESLint and fix auto-fixable issues
- Run Prettier to format code
- Run Stylelint for CSS files

### Manual Checks

You can run these commands manually:

```bash
# Lint your code
make lint
npm run lint              # Frontend
cd backend && npm run lint # Backend

# Fix linting issues
make lint-fix
npm run lint:fix

# Format code
make format
npm run format

# Check formatting
make format-check
npm run format:check

# Run all validations
make validate
npm run validate
```

### TypeScript Guidelines

- Use explicit types where it improves code clarity
- Avoid `any` types - use proper typing or `unknown`
- Use interfaces for object shapes
- Use type aliases for unions and primitives

Example:

```typescript
// Good
interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
}

// Avoid
const user: any = { ... };
```

### Component Guidelines

- **React Components**: Use functional components with hooks
- **File naming**: PascalCase for components (`UserProfile.tsx`)
- **Props**: Define explicit prop types using TypeScript interfaces
- **State management**: Use React Query for server state

Example:

```typescript
interface UserProfileProps {
  userId: string;
  onUpdate?: (user: User) => void;
}

export function UserProfile({ userId, onUpdate }: UserProfileProps) {
  // Component logic
}
```

### CSS Guidelines

- Use Tailwind CSS utility classes
- Create custom components in `src/components/ui/` for reusable patterns
- Avoid inline styles unless absolutely necessary
- Follow mobile-first responsive design

## 🌿 Git Workflow

### Branch Naming

Follow this naming convention:

- `feature/description` - New features
- `fix/description` - Bug fixes
- `refactor/description` - Code refactoring
- `docs/description` - Documentation updates
- `chore/description` - Maintenance tasks

Examples:

```bash
git checkout -b feature/add-loyalty-program
git checkout -b fix/cart-calculation-error
git checkout -b docs/update-api-documentation
```

### Commit Messages

Write clear, descriptive commit messages following this format:

```
<type>: <subject>

<body (optional)>

<footer (optional)>
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**

```
feat: add product search by health condition

Implements AI-powered search that allows users to search for
medicines by entering health conditions or symptoms.

Closes #123
```

```
fix: resolve cart total calculation error

Fixed floating-point arithmetic issue causing incorrect totals
when multiple discounts are applied.
```

### Pull Request Process

1. **Create a feature branch:**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes and commit:**

   ```bash
   git add .
   git commit -m "feat: add your feature"
   ```

3. **Push your branch:**

   ```bash
   git push origin feature/your-feature-name
   ```

4. **Create a Pull Request:**
   - Go to GitHub and create a PR from your branch
   - Fill in the PR template with details
   - Link related issues

5. **Address review feedback:**
   - Make requested changes
   - Push additional commits to the same branch
   - Re-request review when ready

## 🔍 Code Review Process

### As a Contributor

When submitting a PR:

- Ensure all CI checks pass
- Write clear PR description explaining what and why
- Add screenshots for UI changes
- Keep PRs focused on a single concern
- Respond to feedback promptly and professionally

### As a Reviewer

When reviewing PRs:

- Check code quality and adherence to standards
- Test functionality locally when possible
- Provide constructive feedback
- Approve when satisfied, or request changes with clear explanations

### Review Checklist

- [ ] Code follows project coding standards
- [ ] Tests are included (when applicable)
- [ ] Documentation is updated
- [ ] No unnecessary dependencies added
- [ ] Performance considerations addressed
- [ ] Security best practices followed
- [ ] Accessibility standards met (for UI changes)

## 🧪 Testing Guidelines

### Frontend Testing

Currently, the project uses manual testing. When adding tests:

- Write unit tests for utility functions
- Write integration tests for complex components
- Use React Testing Library for component tests

### Backend Testing

Backend tests use Jest. To run tests:

```bash
cd backend
npm test
```

When adding tests:

- Test API endpoints thoroughly
- Mock database calls appropriately
- Test error handling
- Test authentication and authorization

## 🔧 Troubleshooting

### Pre-commit Hooks Failing

If pre-commit hooks fail:

1. **Check what's failing:**

   ```bash
   npm run validate
   ```

2. **Fix linting issues:**

   ```bash
   make lint-fix
   ```

3. **Fix formatting:**

   ```bash
   make format
   ```

4. **Try committing again:**
   ```bash
   git commit -m "your message"
   ```

### Bypass Hooks (Emergency Only)

**⚠️ Only use in emergencies:**

```bash
git commit -m "your message" --no-verify
```

### Common Issues

#### ESLint Errors

```bash
# Fix auto-fixable issues
npm run lint:fix

# Check remaining issues
npm run lint
```

#### TypeScript Errors

```bash
# Check TypeScript errors
npm run type-check
```

#### Stylelint Errors

```bash
# Fix CSS issues
npm run style:fix
```

### Build Failures

If build fails:

1. **Clean and reinstall:**

   ```bash
   make clean
   make install
   ```

2. **Check TypeScript errors:**

   ```bash
   npm run type-check
   ```

3. **Verify environment variables:**
   ```bash
   # Ensure .env file exists and has correct values
   cat .env
   ```

### Database Issues

If database connection fails:

1. **Verify PostgreSQL is running:**

   ```bash
   pg_isready
   ```

2. **Check credentials in backend/.env**

3. **Re-run migrations:**
   ```bash
   cd backend
   npm run migrate:local
   ```

## 📚 Additional Resources

- [README.md](./README.md) - Project overview and quick start
- [API Documentation](./API_DOCUMENTATION.md) - Backend API reference
- [Deployment Guide](./DEPLOYMENT_GUIDE.md) - Deployment instructions
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 🤝 Getting Help

If you need help:

1. Check existing documentation
2. Search existing issues on GitHub
3. Create a new issue with detailed information
4. Join our community discussions (if available)

## 📝 License

By contributing, you agree that your contributions will be licensed under the project's MIT License.

---

Thank you for contributing to Pulss! 🎉
