# Development Rules & Best Practices

## Database & Migration Rules

### ❌ Database Push Restrictions
- **NO `prisma db push` if migration is needed**
  - Always use `npx prisma migrate dev` for schema changes
  - Use `npx prisma migrate status` to check for pending migrations
  - Only use `db push` for rapid prototyping in local dev with disposable data

### ✅ Database Migration Protocol
1. **Always create migrations**: `npx prisma migrate dev --name descriptive_name`
2. **Review migration files** before committing
3. **Test migrations** on a copy of production data when possible
4. **Never edit migration files** after they've been applied
5. **Use `npx prisma migrate deploy`** for production deployments

### 🛡️ Safety Checks
- Run `npx prisma migrate status` before any database operation
- Use `npx prisma db seed` for consistent test data
- Backup database before major schema changes
- Use transactions for complex data migrations

## Software Engineering Principles

### DRY (Don't Repeat Yourself)
- **Extract reusable functions** into utility modules
- **Create shared components** for common UI elements
- **Use constants** for repeated values (API endpoints, error messages)
- **Implement service layers** to avoid duplicate business logic
- **Utilize TypeScript interfaces** for type reuse

### SOLID Principles

#### Single Responsibility Principle (SRP)
- Each function/class should have one reason to change
- Separate business logic from presentation logic
- Keep API routes focused on single operations

#### Open/Closed Principle (OCP)
- Design for extension without modification
- Use dependency injection for flexibility
- Implement plugin architectures where appropriate

#### Liskov Substitution Principle (LSP)
- Ensure derived classes can replace base classes
- Maintain consistent interfaces and contracts
- Use proper inheritance hierarchies

#### Interface Segregation Principle (ISP)
- Create specific interfaces for specific needs
- Avoid fat interfaces with unused methods
- Use composition over inheritance when appropriate

#### Dependency Inversion Principle (DIP)
- Depend on abstractions, not concretions
- Use dependency injection containers
- Define clear interface boundaries

## Code Quality Standards

### Architecture & Structure
- **Follow domain-driven design** for complex business logic
- **Implement clean architecture** with clear layer separation
- **Use repository pattern** for data access abstraction
- **Apply MVC/MVP patterns** consistently

### Error Handling
- **Implement proper error boundaries** in React components
- **Use result types** instead of throwing exceptions where appropriate
- **Log errors comprehensively** with context
- **Provide meaningful error messages** to users

### Testing Strategy
- **Write unit tests** for business logic (minimum 80% coverage)
- **Create integration tests** for API endpoints
- **Implement E2E tests** for critical user journeys
- **Use test-driven development** for complex features

### Performance & Security
- **Implement proper authentication** and authorization
- **Use environment variables** for sensitive configuration
- **Apply rate limiting** to API endpoints
- **Optimize database queries** with proper indexing
- **Implement caching strategies** where appropriate

### Documentation
- **Document API endpoints** with OpenAPI/Swagger
- **Maintain README files** for setup and deployment
- **Write inline comments** for complex business logic
- **Keep changelog** for version tracking

## Code Style & Formatting

### TypeScript Best Practices
- Use strict TypeScript configuration
- Prefer interfaces over types for object shapes
- Use union types for constrained values
- Implement proper error types

### Naming Conventions
- Use camelCase for variables and functions
- Use PascalCase for classes and components
- Use UPPER_SNAKE_CASE for constants
- Use descriptive, intention-revealing names

### File Organization
- Group related files in feature folders
- Use index files for clean imports
- Separate types, utils, and business logic
- Follow consistent folder structure

## Git & Collaboration

### Commit Standards
- Use conventional commit messages
- Keep commits atomic and focused
- Write descriptive commit messages
- Reference issues/tickets in commits

### Branch Strategy
- Use feature branches for new development
- Implement pull request reviews
- Keep main branch always deployable
- Use semantic versioning for releases

## Review Checklist

Before any deployment or major merge:
- [ ] All tests pass
- [ ] Code coverage meets standards
- [ ] Database migrations are tested
- [ ] Security implications reviewed
- [ ] Performance impact assessed
- [ ] Documentation updated
- [ ] Error handling implemented
- [ ] Logging added for debugging

---

*These rules should be followed consistently across the entire development team. Exceptions require team discussion and approval.*
