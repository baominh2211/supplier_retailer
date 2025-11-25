# Sequence Diagram - Payment & Document Verification

## Purpose
Show integration with external payment (Stripe) and verification (Trulioo) services.

## PlantUML Diagram

```plantuml
@startuml sequence_payment_verification

actor "Supplier" as Supplier
participant "Frontend" as FE
participant "Backend API" as API
participant "Stripe" as Stripe
participant "PostgreSQL" as DB
participant "Webhook\nReceiver" as Webhook
actor "Admin" as Admin

== Verification Payment ==

Supplier -> FE: Complete profile
FE --> Supplier: Show "Pay $50 verification fee"
Supplier -> FE: Click "Pay Now"
FE -> API: POST /api/verification/initiate\n{supplier_id}
API -> API: Check if already paid
API -> Stripe: POST /v1/payment_intents\n{amount: 5000, currency: 'usd',\nmetadata: {supplier_id}}
Stripe --> API: {client_secret, intent_id}
API -> DB: INSERT INTO verification_payments\n(supplier_id, intent_id, status='pending')
API --> FE: 200 OK {client_secret, intent_id}

FE -> FE: Load Stripe Elements (card form)
FE --> Supplier: Display payment form
Supplier -> FE: Enter card details, click "Pay"
FE -> Stripe: Submit payment (via Stripe.js)
Stripe -> Stripe: Process payment

alt Payment Failed
    Stripe --> FE: Error
    FE --> Supplier: "Payment failed: {error}"
else Payment Succeeded
    Stripe -> Webhook: POST /api/webhooks/stripe\n{type: 'payment_intent.succeeded', data}
    Webhook -> Webhook: Verify signature
    Webhook -> API: Process webhook
    API -> DB: UPDATE verification_payments\nSET status='completed', paid_at=NOW()
    API -> DB: UPDATE suppliers\nSET verification_payment_received=true
    API -> API: Notify admin queue
    Webhook --> Stripe: 200 OK (acknowledge)
    
    FE -> API: GET /api/verification/status/{supplier_id}\n(polling)
    API -> DB: SELECT status FROM verification_payments
    DB --> API: status='completed'
    API --> FE: 200 OK {payment_status: 'completed'}
    FE --> Supplier: Redirect to "Under Review" page
end

== Document Verification via Trulioo ==

Admin -> FE: Review application, click "Verify Documents"
FE -> API: POST /api/verification/documents\n{supplier_id}
API -> DB: SELECT business_license_url, tax_document_url\nFROM suppliers WHERE id=?
DB --> API: Document URLs
API -> Stripe: POST /v1/identity/verification_sessions\n{document_urls, business_name, tax_id}
note right: Using Stripe Identity
Stripe -> Stripe: OCR extraction\nDatabase checks\nFraud analysis
Stripe --> API: {verification_score: 85,\nconfidence: 'high', flags: []}
API -> DB: INSERT INTO verification_results\n(supplier_id, score, confidence, raw_response)
API --> FE: 200 OK {score: 85, confidence: 'high'}
FE --> Admin: Display "Score: 85/100\nRecommend approval"

Admin -> FE: Make decision (approve/reject)

@enduml
```

## Links to: 05_activity_supplier_onboarding.md, 17_class_domain_model_core.md
