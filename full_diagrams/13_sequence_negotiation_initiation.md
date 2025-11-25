# Sequence Diagram - Negotiation Initiation

## Purpose
Show how negotiation sessions are created and WebSocket connections established.

## PlantUML Diagram

```plantuml
@startuml sequence_negotiation_initiation

actor "Shop User" as Shop
participant "Frontend" as FE
participant "Backend API" as API
participant "PostgreSQL" as DB
participant "WebSocket Server" as WS
participant "Email Service" as Email
actor "Supplier" as Supplier

Shop -> FE: Click "Start Negotiation" on product
FE -> FE: Open negotiation modal
Shop -> FE: Fill form\n(quantity, target_price, message)
FE -> FE: Validate form
FE -> API: POST /api/negotiations/create\n{product_id, supplier_id, quantity, target_price, message}
API -> DB: SELECT COUNT(*) FROM negotiation_sessions\nWHERE shop_id=? AND status='ACTIVE'
DB --> API: active_count = 3

alt Active Negotiations >= 5
    API --> FE: 403 Forbidden\n{error: "Max 5 active negotiations"}
    FE --> Shop: Show error "Limit reached"
else Can Create
    API -> DB: BEGIN TRANSACTION
    API -> DB: INSERT INTO negotiation_sessions\n(shop_id, supplier_id, product_id, status='INITIATED',\nrequested_quantity, requested_price, expires_at)
    DB --> API: session_id
    API -> DB: INSERT INTO negotiation_messages\n(session_id, sender_user_id, content, message_type='TEXT')
    DB --> API: message_id
    API -> DB: COMMIT
    
    API -> WS: Register session\n{session_id, participants: [shop_id, supplier_id]}
    WS --> API: Channel created
    
    API -> Email: Send notification\n{to: supplier_email, template: 'new_negotiation'}
    Email --> API: Email queued
    
    API --> FE: 201 Created\n{session_id, message_id, status: 'INITIATED'}
    FE -> FE: Close modal
    FE --> Shop: Redirect to /negotiations/{session_id}
    
    FE -> WS: Connect WebSocket\nws://server/negotiations/{session_id}
    WS --> FE: Connection established
    FE -> FE: Display "Waiting for supplier response..."
    
    Email -> Supplier: Email "New negotiation request from {shop_name}"
    Supplier -> FE: Click link in email
    FE -> API: GET /api/negotiations/{session_id}
    API -> DB: SELECT * FROM negotiation_sessions WHERE id=?
    DB --> API: Session data
    API -> DB: SELECT * FROM negotiation_messages WHERE session_id=?
    DB --> API: Messages
    API --> FE: 200 OK {session, messages}
    FE --> Supplier: Display negotiation details
    
    FE -> WS: Connect to session
    WS --> FE: Connected
    WS -> FE: Notify shop "Supplier is online"
    FE --> Shop: Show "Supplier joined" indicator
end

@enduml
```

## Links to: 08_activity_negotiation_lifecycle.md, 18_class_domain_model_negotiation.md
