# Sequence Diagram - Purchase Intent State Transitions

## Purpose
Show state machine transitions with notifications for purchase intent lifecycle.

## PlantUML Diagram

```plantuml
@startuml sequence_purchase_intent_flow

actor "Shop" as Shop
participant "Frontend" as FE
participant "Backend API" as API
participant "State Machine" as SM
participant "PostgreSQL" as DB
participant "Email Service" as Email
actor "Supplier" as Supplier

== Draft → Waiting for Supplier ==

Shop -> FE: Click "Create Purchase Intent"
FE -> API: POST /api/purchase-intents\n{negotiation_id, quantity, agreed_price, delivery_address}
API -> SM: createIntent(data)
SM -> SM: Validate data
SM -> SM: Set initial_state = DRAFT
SM -> DB: INSERT INTO purchase_intents\n(status='DRAFT', shop_id, supplier_id, ...)
DB --> SM: intent_id
SM --> API: {intent_id, status: 'DRAFT'}
API --> FE: 201 Created {intent}
FE --> Shop: Show intent in DRAFT status

Shop -> FE: Review, click "Submit to Supplier"
FE -> API: POST /api/purchase-intents/{id}/submit
API -> SM: transitionTo('WAITING_SUPPLIER_RESPONSE')
SM -> SM: Validate transition\n(DRAFT → WAITING is valid)
SM -> SM: Execute exit actions for DRAFT
SM -> DB: UPDATE purchase_intents\nSET status='WAITING_SUPPLIER_RESPONSE',\nexpires_at=NOW()+INTERVAL '7 days'
SM -> SM: Execute entry actions for WAITING
SM -> Email: Send notification to supplier
Email -> Supplier: Email "New purchase intent #{intent_number}"
SM --> API: Transition successful
API --> FE: 200 OK {updated_intent}
FE --> Shop: Show "Waiting for supplier response"

== Waiting → Agreed (Supplier Accepts) ==

Supplier -> FE: Open email, click link
FE -> API: GET /api/purchase-intents/{id}
API -> DB: SELECT * FROM purchase_intents WHERE id=?
DB --> API: Intent data
API --> FE: 200 OK {intent}
FE --> Supplier: Display intent details

Supplier -> FE: Review, click "Accept Intent"
FE -> API: POST /api/purchase-intents/{id}/accept
API -> SM: transitionTo('AGREED')
SM -> SM: Validate transition\n(WAITING → AGREED is valid)
SM -> SM: Execute exit actions\n(log response_time)
SM -> DB: UPDATE purchase_intents\nSET status='AGREED',\nagreed_at=NOW()
SM -> SM: Execute entry actions\n(lock fields, mark immutable)
SM -> Email: Send confirmation to shop
Email -> Shop: Email "Purchase intent accepted!"
SM -> Email: Send confirmation to supplier
Email -> Supplier: Email "You accepted intent #{number}"
SM --> API: Transition successful
API --> FE: 200 OK {updated_intent}
FE --> Supplier: Show "Intent Agreed" success

== Waiting → Cancelled (Supplier Declines) ==

Supplier -> FE: Click "Decline Intent"
FE -> FE: Show modal "Enter reason"
Supplier -> FE: Enter reason, confirm
FE -> API: POST /api/purchase-intents/{id}/decline\n{reason: "Insufficient inventory"}
API -> SM: transitionTo('CANCELLED', {reason})
SM -> DB: UPDATE purchase_intents\nSET status='CANCELLED',\ncancellation_reason=?,\ncancelled_at=NOW()
SM -> Email: Notify shop
Email -> Shop: Email "Intent declined: {reason}"
SM --> API: Transition successful
API --> FE: 200 OK
FE --> Supplier: Show "Intent declined"

== Background Expiration ==

note over API, DB
  Cron job runs every 5 minutes
end note

API -> DB: SELECT * FROM purchase_intents\nWHERE status IN ('DRAFT','WAITING_SUPPLIER_RESPONSE')\nAND expires_at < NOW()
DB --> API: [expired_intent_1, expired_intent_2, ...]

loop For each expired intent
    API -> SM: transitionTo('EXPIRED')
    SM -> DB: UPDATE status='EXPIRED'
    SM -> Email: Notify shop
    Email -> Shop: Email "Intent #{number} expired"
    API -> API: Log for analytics
end

@enduml
```

## Links to: 09_activity_purchase_intent_creation.md, 24_state_machine_purchase_intent.md
