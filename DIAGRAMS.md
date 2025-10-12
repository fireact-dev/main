# Fireact.dev Architecture Diagrams

This document contains detailed architecture diagrams for Fireact.dev. These diagrams complement the [ARCHITECTURE.md](ARCHITECTURE.md) documentation.

## Table of Contents

- [Complete Data Flow](#complete-data-flow)
- [User Authentication Flow](#user-authentication-flow)
- [Subscription Creation Flow](#subscription-creation-flow)
- [Payment Processing Flow](#payment-processing-flow)
- [Team Invitation Flow](#team-invitation-flow)
- [Component Interaction](#component-interaction)

## Complete Data Flow

```mermaid
graph TB
    subgraph "Client Browser"
        A[React App]
        B[Auth Context]
        C[Subscription Context]
        D[Config Context]
    end

    subgraph "Firebase Services"
        E[Firebase Auth]
        F[Cloud Functions]
        G[Firestore]
        H[Hosting]
    end

    subgraph "External Services"
        I[Stripe API]
    end

    A --> B
    A --> C
    A --> D

    B --> E
    C --> F
    C --> G

    F --> G
    F --> I

    H --> A

    E -.Token.-> F
    I -.Webhooks.-> F

    style A fill:#61dafb
    style E fill:#ffa611
    style F fill:#ffa611
    style G fill:#ffa611
    style H fill:#ffa611
    style I fill:#635bff
```

## User Authentication Flow

### Sign-Up Process

```mermaid
sequenceDiagram
    participant U as User
    participant R as React App
    participant FA as Firebase Auth
    participant FS as Firestore
    participant CF as Cloud Functions

    U->>R: Enter email & password
    R->>FA: createUserWithEmailAndPassword()
    FA-->>R: User object + ID token

    R->>FA: sendEmailVerification()
    FA-->>U: Verification email

    R->>FS: Create user profile document
    FS-->>R: Success

    R->>R: Update Auth Context
    R-->>U: Redirect to dashboard

    Note over U,CF: User clicks verification link
    U->>FA: Verify email
    FA-->>FA: Mark email as verified
    FA-->>R: Trigger auth state change
    R-->>U: Update UI
```

### Sign-In Process

```mermaid
sequenceDiagram
    participant U as User
    participant R as React App
    participant FA as Firebase Auth
    participant FS as Firestore

    U->>R: Enter credentials
    R->>FA: signInWithEmailAndPassword()
    FA-->>R: User object + ID token

    R->>FS: Fetch user profile
    FS-->>R: User data

    R->>FS: Fetch user subscriptions
    FS-->>R: Subscriptions list

    R->>R: Update Auth Context
    R->>R: Update Subscription Context

    alt Email not verified
        R-->>U: Show verification prompt
    else Email verified
        R-->>U: Redirect to subscriptions
    end
```

### Social Login Flow

```mermaid
sequenceDiagram
    participant U as User
    participant R as React App
    participant FA as Firebase Auth
    participant GP as Google Provider
    participant FS as Firestore

    U->>R: Click "Sign in with Google"
    R->>FA: signInWithPopup(GoogleAuthProvider)
    FA->>GP: Redirect to Google OAuth
    GP-->>U: Google login page

    U->>GP: Authorize
    GP-->>FA: OAuth token
    FA-->>R: User object + ID token

    alt New user
        R->>FS: Create user profile
        FS-->>R: Success
    else Existing user
        R->>FS: Fetch user profile
        FS-->>R: User data
    end

    R->>FS: Fetch subscriptions
    FS-->>R: Subscriptions list

    R-->>U: Redirect to dashboard
```

## Subscription Creation Flow

```mermaid
sequenceDiagram
    participant U as User
    participant R as React App
    participant CF as Cloud Functions
    participant ST as Stripe
    participant FS as Firestore

    U->>R: Select subscription plan
    R->>R: Show payment form

    U->>R: Enter payment details
    R->>ST: Create payment method
    ST-->>R: Payment method ID

    R->>CF: createSubscription(planId, paymentMethodId)

    CF->>CF: Verify user authentication
    CF->>ST: Create customer
    ST-->>CF: Customer ID

    CF->>ST: Attach payment method
    ST-->>CF: Success

    CF->>ST: Create subscription
    ST-->>CF: Subscription object

    CF->>FS: Save subscription document
    FS-->>CF: Success

    CF->>FS: Add user to subscription members
    FS-->>CF: Success

    CF-->>R: Success response
    R-->>U: Redirect to dashboard

    Note over ST,CF: Async webhook
    ST->>CF: subscription.created webhook
    CF->>FS: Update subscription status
    FS-->>CF: Success
```

## Payment Processing Flow

### Successful Payment

```mermaid
sequenceDiagram
    participant ST as Stripe
    participant CF as Cloud Functions
    participant FS as Firestore
    participant R as React App
    participant U as User

    ST->>CF: invoice.payment_succeeded webhook
    CF->>CF: Verify webhook signature

    CF->>FS: Get subscription by stripeSubscriptionId
    FS-->>CF: Subscription data

    CF->>FS: Update subscription.status = 'active'
    FS-->>CF: Success

    CF->>FS: Create invoice record
    FS-->>CF: Success

    Note over FS,R: Real-time listener
    FS->>R: Subscription updated
    R-->>U: Show active status
```

### Failed Payment

```mermaid
sequenceDiagram
    participant ST as Stripe
    participant CF as Cloud Functions
    participant FS as Firestore
    participant R as React App
    participant U as User

    ST->>CF: invoice.payment_failed webhook
    CF->>CF: Verify webhook signature

    CF->>FS: Get subscription
    FS-->>CF: Subscription data

    CF->>FS: Update subscription.status = 'past_due'
    FS-->>CF: Success

    FS->>R: Subscription updated
    R-->>U: Show payment failed warning

    U->>R: Update payment method
    R->>CF: updatePaymentMethod()
    CF->>ST: Update customer payment method
    ST-->>CF: Success
    CF-->>R: Success

    ST->>ST: Retry payment
    ST->>CF: invoice.payment_succeeded
    CF->>FS: Update status = 'active'
    R-->>U: Show active status
```

## Team Invitation Flow

```mermaid
sequenceDiagram
    participant O as Owner
    participant R as React App
    participant CF as Cloud Functions
    participant FS as Firestore
    participant E as Email Service
    participant M as New Member

    O->>R: Enter member email
    R->>CF: createInvite(email, subscriptionId, role)

    CF->>CF: Verify owner permissions
    CF->>FS: Check if user already member
    FS-->>CF: Not a member

    CF->>FS: Create invite document
    FS-->>CF: Invite ID

    CF->>E: Send invitation email
    E-->>M: Invitation email with link

    CF-->>R: Success
    R-->>O: Show pending invitation

    Note over M,R: Member clicks link
    M->>R: Open invitation link
    R->>R: Redirect to sign-in/sign-up

    M->>R: Authenticate
    R->>CF: acceptInvite(inviteId)

    CF->>FS: Get invite document
    FS-->>CF: Invite data

    CF->>FS: Add user to subscription members
    FS-->>CF: Success

    CF->>FS: Update invite status = 'accepted'
    FS-->>CF: Success

    CF-->>R: Success
    R-->>M: Redirect to subscription dashboard
```

## Component Interaction

### React Component Hierarchy

```mermaid
graph TD
    A[App.tsx] --> B[ConfigContext]
    A --> C[AuthContext]
    A --> D[LoadingContext]

    C --> E[SubscriptionContext]

    A --> F[Router]
    F --> G[PublicLayout]
    F --> H[AuthenticatedLayout]

    G --> I[SignIn]
    G --> J[SignUp]
    G --> K[ResetPassword]

    H --> L[PrivateRoute]
    L --> M[Profile]
    L --> N[SubscriptionLayout]

    N --> O[ProtectedSubscriptionRoute]
    O --> P[SubscriptionDashboard]
    O --> Q[SubscriptionSettings]
    O --> R[Billing]
    O --> S[UserManagement]

    E -.provides data.-> O
    C -.provides user.-> L
    B -.provides config.-> A
    D -.provides loading state.-> A

    style A fill:#61dafb
    style B fill:#ffd93d
    style C fill:#ffd93d
    style D fill:#ffd93d
    style E fill:#ffd93d
```

### Data Flow in Components

```mermaid
graph LR
    A[User Action] --> B[Component]
    B --> C{Need Auth?}

    C -->|Yes| D[useAuth Hook]
    D --> E[AuthContext]

    C -->|No| F[Local State]

    B --> G{Need Subscription?}
    G -->|Yes| H[useSubscription Hook]
    H --> I[SubscriptionContext]

    B --> J{Need Config?}
    J -->|Yes| K[useConfig Hook]
    K --> L[ConfigContext]

    B --> M[Cloud Function Call]
    M --> N[Firebase Functions]

    N --> O[Firestore]
    O -.Real-time Update.-> I

    E --> P[UI Update]
    I --> P
    L --> P
    F --> P

    style A fill:#ff6b6b
    style P fill:#51cf66
```

## Cloud Functions Architecture

```mermaid
graph TB
    subgraph "Client Calls"
        A[React App]
    end

    subgraph "Cloud Functions"
        B[createSubscription]
        C[cancelSubscription]
        D[changeSubscriptionPlan]
        E[createInvite]
        F[acceptInvite]
        G[updateUserPermissions]
        H[stripeWebhook]
    end

    subgraph "Stripe"
        I[Stripe API]
        J[Stripe Webhooks]
    end

    subgraph "Database"
        K[Firestore]
    end

    A -->|HTTPS Callable| B
    A -->|HTTPS Callable| C
    A -->|HTTPS Callable| D
    A -->|HTTPS Callable| E
    A -->|HTTPS Callable| F
    A -->|HTTPS Callable| G

    B --> I
    C --> I
    D --> I

    B --> K
    C --> K
    D --> K
    E --> K
    F --> K
    G --> K

    J -->|HTTP POST| H
    H --> K

    K -.Real-time.-> A

    style B fill:#ffa611
    style C fill:#ffa611
    style D fill:#ffa611
    style E fill:#ffa611
    style F fill:#ffa611
    style G fill:#ffa611
    style H fill:#ffa611
```

## Security Architecture

```mermaid
graph TB
    subgraph "Client"
        A[React App]
        B[ID Token]
    end

    subgraph "Firebase Auth"
        C[Authentication]
        D[Token Verification]
    end

    subgraph "Cloud Functions"
        E[Context.auth]
        F[Permission Check]
    end

    subgraph "Firestore"
        G[Security Rules]
        H[Data]
    end

    A -->|Login| C
    C -->|Generate| B

    A -->|Request + Token| E
    E --> D
    D -->|Verified| F

    F -->|Check Permissions| G
    G -->|Authorized| H

    A -->|Direct Access + Token| G
    G -->|Evaluate Rules| H

    style C fill:#ffa611
    style D fill:#ffa611
    style G fill:#ff6b6b
```

## Deployment Pipeline

```mermaid
graph LR
    A[Git Push] --> B[CI/CD Trigger]
    B --> C[Install Dependencies]
    C --> D[Build React App]
    C --> E[Build Functions]

    D --> F[Run Tests]
    E --> F

    F --> G{Tests Pass?}

    G -->|No| H[Fail Build]
    G -->|Yes| I[Deploy to Firebase]

    I --> J[Deploy Hosting]
    I --> K[Deploy Functions]
    I --> L[Deploy Rules]

    J --> M[Production]
    K --> M
    L --> M

    M --> N[Verify Deployment]
    N --> O{Success?}

    O -->|Yes| P[Complete]
    O -->|No| Q[Rollback]

    style G fill:#ffd93d
    style O fill:#ffd93d
    style P fill:#51cf66
    style H fill:#ff6b6b
    style Q fill:#ff6b6b
```

## Real-time Sync Architecture

```mermaid
sequenceDiagram
    participant U1 as User 1 Browser
    participant FS as Firestore
    participant CF as Cloud Functions
    participant U2 as User 2 Browser

    U1->>CF: Update subscription
    CF->>FS: Write data
    FS-->>CF: Success
    CF-->>U1: Success response

    Note over FS: Change detected

    FS->>U1: Real-time update
    U1->>U1: Update UI

    FS->>U2: Real-time update
    U2->>U2: Update UI

    Note over U1,U2: Both users see changes instantly
```

## Error Handling Flow

```mermaid
graph TB
    A[User Action] --> B[Component]
    B --> C[Try Cloud Function Call]

    C --> D{Success?}

    D -->|Yes| E[Update State]
    E --> F[Show Success Message]

    D -->|No| G{Error Type?}

    G -->|Auth Error| H[Redirect to Login]
    G -->|Permission Error| I[Show Permission Denied]
    G -->|Network Error| J[Show Retry Option]
    G -->|Validation Error| K[Show Field Errors]
    G -->|Unknown Error| L[Show Generic Error]

    H --> M[Log Error]
    I --> M
    J --> M
    K --> M
    L --> M

    M --> N[Send to Error Tracking]

    style D fill:#ffd93d
    style E fill:#51cf66
    style F fill:#51cf66
    style G fill:#ffd93d
    style H fill:#ff6b6b
    style I fill:#ff6b6b
    style J fill:#ff6b6b
    style K fill:#ff6b6b
    style L fill:#ff6b6b
```

---

## Diagram Legend

- **Blue**: Client-side (React)
- **Orange**: Firebase services
- **Purple**: Stripe services
- **Yellow**: Decision points
- **Green**: Success states
- **Red**: Error states
- **Solid lines**: Synchronous flow
- **Dashed lines**: Asynchronous flow

## Generating Diagrams

These diagrams are written in Mermaid syntax and can be:

1. **Viewed on GitHub**: GitHub automatically renders Mermaid diagrams
2. **Rendered in VS Code**: Use the Mermaid Preview extension
3. **Exported as images**: Use the Mermaid CLI or online editor
4. **Embedded in documentation**: Most markdown renderers support Mermaid

## Related Documentation

- [Architecture Overview](ARCHITECTURE.md)
- [Security Model](ARCHITECTURE.md#security-model)
- [Data Model](ARCHITECTURE.md#data-model)
- [Contributing Guidelines](CONTRIBUTING.md)
