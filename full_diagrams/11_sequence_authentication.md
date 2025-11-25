# Sequence Diagram - Authentication

## Purpose
Complete authentication flow including login with 2FA, token management, refresh, and logout.

## PlantUML Diagram

```plantuml
@startuml sequence_authentication

actor User
participant "Frontend" as FE
participant "Backend API" as API
participant "Auth Service" as Auth
participant "PostgreSQL" as DB
participant "Redis Cache" as Redis
participant "Email Service" as Email

== Login Flow ==

User -> FE: Enter email/password
FE -> FE: Validate input format
FE -> API: POST /api/auth/login\n{email, password}
API -> API: Rate limit check
API -> DB: SELECT * FROM users WHERE email = ?
DB --> API: User record
API -> Auth: bcrypt.compare(password, hash)

alt Invalid Password
    Auth --> API: false
    API --> FE: 401 Unauthorized\n{error: "Invalid credentials"}
    FE --> User: Show error message
    API -> DB: UPDATE failed_login_attempts++
    
    alt Failed Attempts >= 5
        API -> DB: SET account_status = LOCKED
        API --> FE: 403 Forbidden\n{error: "Account locked"}
        FE --> User: "Account locked for 15 minutes"
    end
    
else Valid Password
    Auth --> API: true
    API -> DB: RESET failed_login_attempts = 0
    
    alt 2FA Enabled
        API -> Auth: Generate 2FA code
        Auth --> API: 6-digit code
        API -> Redis: SET 2fa:{user_id} = {code}\nTTL 5 minutes
        API -> Email: Send 2FA code
        Email -> User: Email with code
        API --> FE: 200 OK\n{requires_2fa: true, session_id}
        FE --> User: Display "Enter 2FA code"
        
        User -> FE: Enter 2FA code
        FE -> API: POST /api/auth/verify-2fa\n{session_id, code}
        API -> Redis: GET 2fa:{user_id}
        Redis --> API: Stored code
        
        alt Invalid Code
            API --> FE: 401 Unauthorized
            FE --> User: "Invalid code"
        else Valid Code
            API -> Redis: DELETE 2fa:{user_id}
        end
    end
    
    API -> Auth: Generate JWT tokens
    Auth --> API: {access_token, refresh_token}
    
    note right of Auth
        access_token: 15 min expiry
        refresh_token: 7 day expiry
    end note
    
    API -> Redis: SET session:{user_id} =\n{user_data, login_at}\nTTL 24 hours
    API -> DB: UPDATE users SET\nlast_login_at = NOW(),\nlogin_count++
    
    API --> FE: 200 OK\n{access_token, refresh_token, user}
    FE -> FE: Store tokens in localStorage
    FE --> User: Redirect to dashboard
end

== Token Refresh Flow ==

FE -> FE: Detect access token expired
FE -> API: POST /api/auth/refresh\n{refresh_token}
API -> Auth: Verify refresh token signature
Auth --> API: Token valid + user_id

alt Invalid/Expired Refresh Token
    API --> FE: 401 Unauthorized
    FE -> FE: Clear all tokens
    FE --> User: Redirect to login
else Valid Refresh Token
    API -> Redis: GET session:{user_id}
    Redis --> API: Session data
    
    alt Session Not Found
        API --> FE: 401 Session Expired
        FE --> User: Redirect to login
    else Session Valid
        API -> Auth: Generate new access token
        Auth --> API: New access_token
        API --> FE: 200 OK\n{access_token}
        FE -> FE: Update stored token
    end
end

== Logout Flow ==

User -> FE: Click "Logout"
FE -> API: POST /api/auth/logout\n{access_token}
API -> Auth: Extract user_id from token
Auth --> API: user_id
API -> Redis: DELETE session:{user_id}
API -> Redis: ADD token_blacklist:{token}\nTTL remaining token time
API --> FE: 200 OK
FE -> FE: Clear tokens from storage
FE --> User: Redirect to login page

@enduml
```

## Implementation: 17_class_domain_model_core.md (User entity with auth fields)
## Links to: 02_use_case_supplier_context.md, 03_use_case_shop_context.md (login use cases)
