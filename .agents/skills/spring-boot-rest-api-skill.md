# Spring Boot REST API Development Skill

## Goal

Build scalable, maintainable, and production-ready REST APIs using Spring Boot while following modern software engineering principles.

---

# Core Principles

## SOLID

### S — Single Responsibility Principle

Each class should have one responsibility.

✅ Good

```java
UserService
UserRepository
UserController
```

❌ Bad

```java
UserController
```

Handles:

* Validation
* Business logic
* Database access
* Response formatting

---

### O — Open/Closed Principle

Code should be open for extension but closed for modification.

Use:

```java
interface PaymentProcessor
```

instead of giant if-else chains.

---

### L — Liskov Substitution Principle

Derived classes should be replaceable by their parent types.

Avoid inheritance abuse.

Prefer composition when possible.

---

### I — Interface Segregation Principle

Small focused interfaces.

✅

```java
UserReader
UserWriter
```

❌

```java
UserEverythingManager
```

---

### D — Dependency Inversion Principle

Depend on abstractions.

```java
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

}
```

---

# KISS

Keep It Simple, Stupid.

Avoid:

```java
GenericSuperFactoryManagerBuilder
```

when

```java
UserService
```

does the job.

Simple code survives longer.

---

# DRY

Don't Repeat Yourself.

If logic appears twice:

Extract it.

```java
private String normalizeEmail(String email)
```

instead of copying logic into multiple services.

---

# YAGNI

You Aren't Gonna Need It.

Do not build:

* Microservices for a university project
* Kafka for a CRUD app
* 10 abstraction layers for one implementation

Build what is needed today.

---

# Domain-Based Architecture

## Why?

Organize code by business domain, not technical layers.

Bad:

```text
controller/
service/
repository/
entity/
dto/
```

Becomes difficult to navigate as the project grows.

---

# Recommended Structure

```text
src/main/java/com/example/app

├── common
│   ├── exception
│   ├── response
│   ├── config
│   ├── util
│   └── security
│
├── user
│   ├── controller
│   ├── service
│   ├── repository
│   ├── dto
│   ├── entity
│   ├── mapper
│   └── validator
│
├── auth
│   ├── controller
│   ├── service
│   ├── repository
│   ├── dto
│   ├── entity
│   └── mapper
│
├── product
│   ├── controller
│   ├── service
│   ├── repository
│   ├── dto
│   ├── entity
│   └── mapper
│
└── Application.java
```

Each domain owns everything related to itself.

---

# Controller Layer

Responsibilities:

* Receive requests
* Validate inputs
* Return responses

Nothing else.

```java
@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/{id}")
    public UserResponse getUser(
            @PathVariable Long id) {

        return userService.findById(id);
    }
}
```

Controller should not contain business logic.

---

# Service Layer

Responsibilities:

* Business rules
* Transaction management
* Coordination

```java
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository repository;
    private final UserMapper mapper;

    public UserResponse findById(Long id) {

        User user = repository.findById(id)
                .orElseThrow(
                    () -> new UserNotFoundException(id));

        return mapper.toResponse(user);
    }
}
```

---

# Repository Layer

Responsibilities:

Database access only.

```java
@Repository
public interface UserRepository
        extends JpaRepository<User, Long> {
}
```

No business logic.

---

# DTO Layer

Never expose entities directly.

Request:

```java
public record CreateUserRequest(
        String name,
        String email
) {
}
```

Response:

```java
public record UserResponse(
        Long id,
        String name,
        String email
) {
}
```

---

# Entity Layer

Represents database tables.

```java
@Entity
@Table(name = "users")
public class User {

    @Id
    private Long id;

    private String name;

    private String email;
}
```

Avoid exposing entities through APIs.

---

# Mapper Layer

Responsible for transformations.

```java
@Component
public class UserMapper {

    public UserResponse toResponse(
            User user) {

        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail()
        );
    }
}
```

Benefits:

* Cleaner services
* Centralized transformations

---

# Validation

Use Bean Validation.

```java
public record CreateUserRequest(

        @NotBlank
        String name,

        @Email
        String email

) {
}
```

Controller:

```java
@PostMapping
public UserResponse create(
        @Valid
        @RequestBody CreateUserRequest request) {

    return service.create(request);
}
```

---

# Exception Handling

Centralize exception handling.

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ApiError> handle(
            UserNotFoundException ex) {

        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(
                    new ApiError(ex.getMessage())
                );
    }
}
```

Never repeat try-catch everywhere.

---

# API Response Standardization

Create consistent responses.

```java
public record ApiResponse<T>(
        boolean success,
        T data,
        String message
) {
}
```

Example:

```json
{
  "success": true,
  "data": {
    "id": 1
  },
  "message": "User fetched successfully"
}
```

---

# Configuration Management

Use:

```text
application.yml
application-dev.yml
application-prod.yml
```

Example:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost/app
```

Never hardcode secrets.

---

# Logging

Use SLF4J.

```java
private static final Logger log =
        LoggerFactory.getLogger(UserService.class);

log.info("Creating user {}", email);
```

Log:

* Important business actions
* Errors
* Security events

Do not log passwords or secrets.

---

# Transaction Management

```java
@Transactional
public UserResponse create(
        CreateUserRequest request) {

}
```

Place transactions at the service layer.

---

# Security

Use:

* Spring Security
* JWT Authentication
* Role-based authorization

Example:

```java
@PreAuthorize("hasRole('ADMIN')")
```

Keep security isolated inside:

```text
common/security
```

---

# Testing Structure

```text
test

├── user
│   ├── controller
│   ├── service
│   └── repository
│
└── auth
```

Types:

### Unit Tests

Mock dependencies.

```java
@ExtendWith(MockitoExtension.class)
```

---

### Integration Tests

Use:

```java
@SpringBootTest
```

Verify complete workflows.

---

# Naming Conventions

## Controllers

```java
UserController
AuthController
ProductController
```

## Services

```java
UserService
AuthService
```

## Repositories

```java
UserRepository
ProductRepository
```

## DTOs

```java
CreateUserRequest
UpdateUserRequest
UserResponse
```

---

# Dependency Injection

Constructor injection only.

✅

```java
@RequiredArgsConstructor
```

❌

```java
@Autowired
private UserService service;
```

---

# Clean Code Checklist

Before writing code ask:

* Does this class have one responsibility?
* Can this method be simplified?
* Is logic duplicated?
* Can naming be improved?
* Does this belong to this domain?
* Is the API response consistent?
* Is validation present?
* Is exception handling centralized?
* Is security considered?
* Is the code testable?

---

# Recommended Stack

### Core

* Spring Boot
* Spring Web
* Spring Validation
* Spring Data JPA

### Security

* Spring Security
* JWT

### Database

* PostgreSQL

### Documentation

* OpenAPI / Swagger

### Utilities

* Lombok
* MapStruct

### Testing

* JUnit 5
* Mockito
* Testcontainers

---

# Golden Rule

A controller should not know how the business works.

A repository should not know business rules.

A service should not know HTTP details.

Each layer should focus only on its responsibility.

When every class has a clear purpose, the project remains maintainable even after years of development.

