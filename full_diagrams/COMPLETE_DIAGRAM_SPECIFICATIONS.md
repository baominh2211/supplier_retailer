# Complete UML Diagram Specifications - All 30 Diagrams

## Overview
This document provides detailed specifications for all 30 UML diagrams in the B2B Marketplace platform. Use this as your complete blueprint for creating remaining diagrams in StarUML.

---

## COMPLETED DIAGRAMS (11 files) ✅

### Use Case Diagrams (4 files) ✅
1. **01_use_case_overview.md** - System landscape
2. **02_use_case_supplier_context.md** - Supplier workflows  
3. **03_use_case_shop_context.md** - Shop workflows
4. **04_use_case_admin_context.md** - Admin operations

### Activity Diagrams (4 files) ✅
5. **05_activity_supplier_onboarding.md** - Verification workflow
6. **06_activity_product_management.md** - Product CRUD operations
7. **07_activity_search_and_discovery.md** - Search workflow
8. **08_activity_negotiation_lifecycle.md** - Negotiation process

### Class Diagrams (1 file) ✅
17. **17_class_domain_model_core.md** - Core entities (User, Supplier, Shop, Product, Category)

### State Machine Diagrams (1 file) ✅
24. **24_state_machine_purchase_intent.md** - Purchase intent lifecycle

### Documentation (1 file) ✅
**CREATE_REMAINING.md** - Tracking document

---

## REMAINING DIAGRAMS TO CREATE (19 files) 📋

### Activity Diagrams (2 remaining)

#### 09_activity_purchase_intent_creation.md
**Purpose**: Show how purchase intents are created from negotiations and processed

**Swimlanes**:
- Shop
- System  
- Supplier
- Admin (for high-value approvals)

**Key Activities**:
1. **Intent Creation from Negotiation**:
   - Negotiation reaches AGREED status
   - System prompts "Create Purchase Intent"
   - Shop reviews agreed terms
   - Shop fills additional details (delivery address, special instructions)
   - Submit for creation

2. **Validation & Approval**:
   - System validates all required fields
   - Check if amount > threshold (e.g., $10,000)
   - If yes → Request manager approval
   - Manager reviews and approves/rejects
   - If no → Proceed directly

3. **Submission to Supplier**:
   - Set status = WAITING_SUPPLIER_RESPONSE
   - Set expiration = NOW() + 7 days
   - Send email notification to supplier
   - Log event

4. **Supplier Review**:
   - Supplier receives notification
   - Reviews intent details
   - Checks inventory/capacity
   - Decision: Accept, Decline, or Request Modifications

5. **Acceptance Path**:
   - Supplier clicks "Accept"
   - Enters confirmation notes
   - Status → AGREED
   - Lock all fields (immutable)
   - Generate PDF summary
   - Send confirmations to both parties

6. **Decline Path**:
   - Supplier clicks "Decline"
   - Enters rejection reason
   - Status → CANCELLED
   - Notify shop

7. **Modification Request Path**:
   - Supplier requests changes (quantity, date, etc.)
   - Shop receives modification request
   - Shop reviews and decides: Accept changes, Counter-propose, or Cancel

8. **Expiration Handling**:
   - Background job checks expiration every 5 minutes
   - If NOW() > expires_at: Status → EXPIRED
   - Notify shop

**Decision Points**:
- All fields valid?
- Requires manager approval? (based on amount threshold)
- Manager approves?
- Can supplier fulfill?
- Supplier accepts/declines/modifies?
- Shop accepts modifications?
- Intent expired?

**Links to**:
- 08_activity_negotiation_lifecycle.md (source: negotiation agreement)
- 24_state_machine_purchase_intent.md (implements state transitions)
- 15_sequence_purchase_intent_flow.md (detailed interaction sequence)

---

#### 10_activity_dispute_resolution.md
**Purpose**: Show how admins investigate and resolve disputes between parties

**Swimlanes**:
- Initiating Party (Shop or Supplier)
- System
- Admin
- Responding Party
- Legal Team (optional, for escalation)

**Key Activities**:
1. **Dispute Filing**:
   - User clicks "Report Dispute"
   - Select dispute type (pricing, quality, delivery, misrepresentation, etc.)
   - Enter description (min 100 characters)
   - Upload evidence (screenshots, documents, email chains)
   - Submit dispute

2. **System Processing**:
   - Generate unique dispute ID
   - Set status = OPEN
   - Notify admin queue
   - Notify responding party
   - Set response deadline (48 hours for responding party)
   - Log submission

3. **Admin Investigation**:
   - Admin receives notification in queue
   - Access admin dashboard
   - Select dispute from list
   - Review dispute details
   - Review full negotiation history
   - Review purchase intent (if exists)
   - Review all messages between parties
   - Review uploaded evidence
   - Check user history (past disputes, violations)

4. **Information Gathering** (if needed):
   - Request additional details from initiating party
   - Request response/evidence from responding party
   - Set deadline for response
   - Wait for responses
   - Review additional information

5. **Mediation Attempt**:
   - Admin opens mediation channel
   - Propose solution/compromise
   - Both parties review proposal
   - If both accept → Resolve dispute with mediated solution
   - If either rejects → Proceed to ruling

6. **Admin Ruling**:
   - Admin reviews all evidence
   - Consult platform policies/ToS
   - Check if case is complex → If yes, escalate to legal team
   - Legal team provides recommendation
   - Admin makes final ruling
   - Enter ruling details
   - Specify enforcement actions (refund, warning, suspension, etc.)
   - Submit ruling

7. **Enforcement**:
   - System checks ruling type
   - Execute enforcement actions:
     - Refund: Trigger payment reversal
     - Suspension: Temporarily disable account
     - Warning: Add to user's record
     - Ban: Permanently disable account
   - Update user records
   - Send enforcement confirmation

8. **Closure**:
   - Update dispute status = RESOLVED
   - Notify both parties of outcome
   - Log complete timeline in audit trail
   - Archive dispute data
   - Update platform analytics

9. **Appeal Process** (optional):
   - Losing party can appeal within 7 days
   - Enter appeal reason
   - Upload additional evidence
   - System assigns to senior admin
   - Senior admin reviews
   - Decision: Overturn or Uphold
   - If overturn → Re-execute with new ruling
   - If uphold → Mark as FINAL (no further appeals)

**Decision Points**:
- Is dispute valid? (meets minimum requirements)
- Need more information from parties?
- Do parties agree to mediation?
- Is case complex enough for legal team?
- What enforcement actions needed?
- Should appeal be granted?

**Links to**:
- 04_use_case_admin_context.md (admin dispute handling use cases)
- 18_class_domain_model_negotiation.md (negotiation data for evidence)
- 19_class_domain_model_transaction.md (AdminLog entity)

---

### Sequence Diagrams (6 total)

#### 11_sequence_authentication.md
**Lifelines**: User, Frontend, Backend API, Auth Service, PostgreSQL, Redis, Email Service

**Flows**:
1. **Login Flow**:
   - User enters email/password
   - Frontend → Backend: POST /api/auth/login
   - Backend → DB: SELECT user WHERE email
   - Backend → Backend: bcrypt.compare(password, hash)
   - If valid: Check 2FA enabled
   - If 2FA: Generate code → Email → User enters code → Verify
   - Backend → Backend: Generate JWT (access + refresh tokens)
   - Backend → Redis: Store session (user_id → session_data, TTL 24h)
   - Backend → DB: UPDATE last_login_at, increment login_count
   - Backend → Frontend: Return tokens + user data
   - Frontend stores tokens

2. **Token Refresh Flow**:
   - Frontend detects token expiration
   - Frontend → Backend: POST /api/auth/refresh {refresh_token}
   - Backend → Backend: Verify refresh token signature
   - Backend → Redis: Check session valid
   - Backend → Backend: Generate new access token
   - Backend → Frontend: Return new access token

3. **Logout Flow**:
   - User clicks logout
   - Frontend → Backend: POST /api/auth/logout
   - Backend → Redis: Delete session
   - Backend → Backend: Blacklist token
   - Frontend clears tokens, redirects to login

**Key Points**:
- JWT tokens: Access (15 min TTL), Refresh (7 day TTL)
- 2FA using TOTP (Time-based One-Time Password)
- Failed login lockout: 5 attempts → 15 minute lock
- Session stored in Redis for fast lookup

---

#### 12_sequence_supplier_search.md
**Lifelines**: Shop User, Frontend, Backend API, Redis Cache, Elasticsearch, PostgreSQL

**Flow**:
1. User enters search query
2. Frontend debounces (300ms)
3. Frontend → Backend: GET /api/suppliers/search?q=...
4. Backend → Backend: Generate cache key
5. Backend → Redis: Check cache
6. If cache miss:
   - Backend → Elasticsearch: Execute search
   - Elasticsearch tokenizes, scores, filters (verified only)
   - Elasticsearch → Backend: Return supplier IDs + scores
   - Backend → PostgreSQL: Fetch full records
   - Backend → Backend: Merge scores with data
   - Backend → Redis: Cache results (5 min TTL)
7. Backend → Frontend: Return paginated results
8. Frontend renders supplier cards

**Pagination**:
- User scrolls → Frontend requests page 2
- Backend repeats process with offset
- Frontend appends to existing results

**Filtering**:
- User applies filter → Frontend adds filter param
- Backend rebuilds Elasticsearch query with filter
- Frontend updates display

---

#### 13_sequence_negotiation_initiation.md
**Lifelines**: Shop User, Frontend, Backend API, PostgreSQL, WebSocket Server, Email Service, Supplier

**Flow**:
1. Shop clicks "Start Negotiation"
2. Frontend shows modal form
3. Shop fills form (product, quantity, price, message)
4. Frontend → Backend: POST /api/negotiations/create
5. Backend validates shop can negotiate (check limit)
6. Backend → DB: BEGIN TRANSACTION
7. Backend → DB: INSERT negotiation_sessions
8. Backend → DB: INSERT first message
9. Backend → DB: COMMIT
10. Backend → WebSocket Server: Register session
11. Backend → Email Service: Notify supplier
12. Backend → Frontend: Return session_id
13. Frontend redirects to negotiation page
14. Frontend → WebSocket: Connect ws://server/negotiations/{id}
15. Supplier receives email → Opens negotiation
16. Supplier Frontend → WebSocket: Connect to same session
17. Both parties now in real-time channel

---

#### 14_sequence_real_time_messaging.md
**Lifelines**: Sender, Sender Frontend, WebSocket Server, Redis Pub/Sub, Backend API, PostgreSQL, Receiver Frontend, Receiver

**Flow**: 
1. Sender types message
2. Sender Frontend → WebSocket: {type: 'message', content, session_id}
3. WebSocket → Backend API: Persist message
4. Backend API → DB: INSERT negotiation_messages
5. DB → Backend: Return message_id
6. Backend → Redis Pub/Sub: PUBLISH message event
7. Redis → WebSocket: Broadcast to session subscribers
8. WebSocket → Sender Frontend: {type: 'ack', message_id} (checkmark ✓)
9. WebSocket → Receiver Frontend: {type: 'new_message', message_data}
10. Receiver Frontend plays notification sound, displays message
11. Receiver Frontend → WebSocket: {type: 'message_read', message_id}
12. WebSocket → Backend: Mark as read
13. Backend → DB: UPDATE is_read = true
14. Backend → Redis: Publish read event
15. WebSocket → Sender Frontend: {type: 'message_read'} (double checkmark ✓✓)

**Reconnection Handling**:
- Frontend detects disconnect
- Auto-reconnect with exponential backoff
- On reconnect: GET /api/negotiations/{id}/messages?since={last_id}
- Sync missed messages

---

#### 15_sequence_purchase_intent_flow.md
**Lifelines**: Shop, Frontend, Backend API, State Machine Service, PostgreSQL, Email Service, Supplier

**Flow**:
1. **Draft → Waiting for Supplier**:
   - Shop → Frontend: Click "Create Intent"
   - Frontend → Backend: POST /api/purchase-intents
   - Backend → State Machine: createIntent()
   - State Machine → State Machine: Set status = DRAFT
   - State Machine → DB: INSERT purchase_intents
   - Shop reviews → Clicks "Submit"
   - Frontend → Backend: POST /api/purchase-intents/{id}/submit
   - Backend → State Machine: transitionTo('WAITING_SUPPLIER_RESPONSE')
   - State Machine validates transition (Draft → Waiting is valid)
   - State Machine → DB: UPDATE status, set expires_at = NOW() + 7 days
   - State Machine → Email Service: Notify supplier
   - Email → Supplier: "New purchase intent requires review"

2. **Waiting → Agreed** (supplier accepts):
   - Supplier opens email → Reviews intent
   - Supplier → Frontend: Click "Accept"
   - Frontend → Backend: POST /api/purchase-intents/{id}/accept
   - Backend → State Machine: transitionTo('AGREED')
   - State Machine validates transition
   - State Machine → DB: UPDATE status = AGREED, agreed_at = NOW()
   - State Machine → State Machine: Lock all fields (immutable)
   - State Machine → Email Service: Notify shop
   - State Machine → Email Service: Notify supplier (confirmation)

3. **Waiting → Cancelled** (supplier declines):
   - Supplier → Frontend: Click "Decline", enter reason
   - Frontend → Backend: POST /api/purchase-intents/{id}/decline
   - Backend → State Machine: transitionTo('CANCELLED', {reason})
   - State Machine → DB: UPDATE status = CANCELLED, reason, cancelled_at
   - State Machine → Email Service: Notify shop with reason

4. **Background Expiration**:
   - Cron Job (every 5 min) → Backend: Check expirations
   - Backend → DB: SELECT * WHERE status IN ('DRAFT', 'WAITING') AND expires_at < NOW()
   - For each expired: State Machine → transitionTo('EXPIRED')
   - Email Service → Notify affected parties

---

#### 16_sequence_payment_verification.md
**Lifelines**: Supplier, Frontend, Backend API, Stripe (External), PostgreSQL, Webhook Receiver, Admin

**Flow**:
1. **Verification Payment**:
   - Supplier → Frontend: Complete profile
   - Frontend shows "Pay $50 verification fee"
   - Supplier → Frontend: Click "Pay Now"
   - Frontend → Backend: POST /api/verification/initiate
   - Backend → Stripe: Create payment intent {amount: 5000, currency: 'usd'}
   - Stripe → Backend: Return {client_secret, intent_id}
   - Backend → DB: INSERT verification_payments (status = 'pending')
   - Backend → Frontend: Return client_secret
   - Frontend → Frontend: Load Stripe Elements (card form)
   - Supplier enters card details → Frontend → Stripe: Submit payment
   - Stripe processes → Stripe → Webhook: payment_intent.succeeded
   - Webhook → Backend: Verify signature → Update DB
   - Backend → DB: UPDATE status = 'completed', paid_at = NOW()
   - Backend → DB: UPDATE suppliers SET verification_payment_received = true
   - Backend → Admin Queue: Notify new application ready
   - Frontend polls → Backend: GET /api/verification/status
   - Backend → Frontend: {status: 'completed'}
   - Frontend → Supplier: Redirect to "Under Review"

2. **Document Verification via API**:
   - Admin → Frontend: Review application → Click "Verify Documents"
   - Frontend → Backend: POST /api/verification/documents {supplier_id}
   - Backend → DB: Get document URLs
   - Backend → Trulioo API: POST /verify {documents, business_name, tax_id}
   - Trulioo → Trulioo: OCR extraction, database checks, scoring
   - Trulioo → Backend: Return {score: 85, confidence: 'high', flags: []}
   - Backend → DB: INSERT verification_results
   - Backend → Frontend: {score, recommendations}
   - Frontend → Admin: Display "Score: 85/100 - Recommend Approval"
   - Admin makes final decision

---

### Class Diagrams (4 remaining)

#### 18_class_domain_model_negotiation.md
**Classes**:

1. **NegotiationSession**
   - id: UUID <<PK>>
   - shop_id: UUID <<FK→Shop>>
   - supplier_id: UUID <<FK→Supplier>>
   - product_id: UUID <<FK→Product, NULLABLE>>
   - status: NegotiationStatus {INITIATED, ACTIVE, AWAITING_RESPONSE, CLOSED_AGREED, CLOSED_CANCELLED, EXPIRED}
   - requested_quantity: INTEGER
   - requested_price: NUMERIC(10,2)
   - final_agreed_price: NUMERIC(10,2)
   - final_agreed_quantity: INTEGER
   - shipping_terms: TEXT
   - payment_terms: TEXT
   - initiated_by: VARCHAR(20)
   - expires_at: TIMESTAMPTZ
   - created_at, updated_at, closed_at: TIMESTAMPTZ
   - Methods: sendMessage(), updateStatus(), close(), checkExpiration(), createPurchaseIntent()

2. **NegotiationMessage**
   - id: UUID <<PK>>
   - session_id: UUID <<FK→NegotiationSession>>
   - sender_user_id: UUID <<FK→User>>
   - content: TEXT
   - message_type: MessageType {TEXT, PRICE_OFFER, COUNTER_OFFER, MOQ_INQUIRY, SHIPPING_TERMS, etc.}
   - metadata: JSONB (structured data: price, quantity, etc.)
   - attachments: JSONB [{filename, url, size, type}]
   - is_read: BOOLEAN
   - read_at, created_at: TIMESTAMPTZ
   - Methods: markAsRead(), getMetadata(), hasAttachments()

**Relationships**:
- Shop 1 ──── * NegotiationSession
- Supplier 1 ──── * NegotiationSession
- Product 1 ──── * NegotiationSession (optional)
- NegotiationSession 1 ──── * NegotiationMessage (composition)
- User 1 ──── * NegotiationMessage (sender)

**Indexes**:
- idx_negotiation_shop, idx_negotiation_supplier, idx_negotiation_status
- idx_message_session (session_id, created_at), idx_message_unread

---

#### 19_class_domain_model_transaction.md
**Classes**:

1. **PurchaseIntent** (already detailed in file 24)

2. **AdminLog**
   - id: UUID <<PK>>
   - admin_user_id: UUID <<FK→User>>
   - action_type: VARCHAR(100) {APPROVE_SUPPLIER, SUSPEND_USER, RESOLVE_DISPUTE, etc.}
   - target_entity_type: VARCHAR(100) {USER, SUPPLIER, PRODUCT, NEGOTIATION}
   - target_entity_id: UUID
   - previous_state: JSONB
   - new_state: JSONB
   - reason: TEXT
   - ip_address: VARCHAR(45)
   - user_agent: TEXT
   - created_at: TIMESTAMPTZ
   - Methods: createEntry(), getAuditTrail()

3. **SupplierReview**
   - id: UUID <<PK>>
   - supplier_id: UUID <<FK→Supplier>>
   - shop_id: UUID <<FK→Shop>>
   - negotiation_session_id: UUID <<FK, NULLABLE>>
   - rating: INTEGER (1-5)
   - communication_rating, quality_rating, delivery_rating: INTEGER (1-5)
   - review_text: TEXT
   - is_verified_purchase: BOOLEAN
   - is_published: BOOLEAN
   - admin_notes: TEXT
   - created_at, updated_at: TIMESTAMPTZ
   - Methods: calculateOverallRating(), publish(), unpublish()

4. **FavoriteSupplier**
   - id: UUID <<PK>>
   - shop_id: UUID <<FK→Shop>>
   - supplier_id: UUID <<FK→Supplier>>
   - notes: TEXT
   - created_at: TIMESTAMPTZ
   - Constraint: UNIQUE(shop_id, supplier_id)

**Relationships**:
- Shop/Supplier ──── * PurchaseIntent
- User (Admin) 1 ──── * AdminLog
- Supplier 1 ──── * SupplierReview
- Shop * ──── * Supplier (via FavoriteSupplier, many-to-many)

---

#### 20_class_service_layer.md
**Service Classes** (Business Logic Layer):

1. **AuthenticationService**
   - Methods: register(), login(), verify2FA(), refreshToken(), logout(), resetPassword(), changePassword()

2. **SupplierService**
   - Dependencies: SupplierRepository, EmailService, DocumentVerificationService
   - Methods: createSupplier(), updateSupplier(), submitForVerification(), getSupplierById(), searchSuppliers(), calculateAverageRating()

3. **ProductService**
   - Dependencies: ProductRepository, CategoryRepository, SearchService
   - Methods: createProduct(), updateProduct(), bulkUploadProducts(), deactivateProduct(), getProductsBySupplier(), updateStock()

4. **NegotiationService**
   - Dependencies: NegotiationRepository, NotificationService, WebSocketService
   - Methods: initiateNegotiation(), sendMessage(), getSession(), closeNegotiation(), checkExpirations(), getActiveNegotiations()

5. **PurchaseIntentService**
   - Dependencies: PurchaseIntentRepository, StateMachineService, EmailService
   - Methods: createIntent(), submitIntent(), supplierAccept(), supplierDecline(), cancelIntent(), checkExpirations(), transitionState()

6. **SearchService**
   - Dependencies: ElasticsearchClient, CacheService
   - Methods: searchSuppliers(), searchProducts(), indexSupplier(), indexProduct(), removeFromIndex()

7. **NotificationService**
   - Dependencies: EmailService, WebSocketService
   - Methods: notifySupplierVerificationApproved(), notifyNewNegotiation(), notifyPurchaseIntentCreated(), notifyIntentAccepted(), sendPlatformAnnouncement()

8. **AdminService**
   - Dependencies: AdminLogRepository, UserRepository, SupplierRepository
   - Methods: approveSupplier(), rejectSupplier(), suspendUser(), resolveDispute(), viewAuditLogs()

**Pattern**: Service layer orchestrates business logic, calls repositories for data access, handles transactions, emits events

---

#### 21_class_repository_layer.md
**Repository Interfaces** (Data Access Layer):

1. **IRepository<T>** (Generic Interface)
   - Methods: findById(), findAll(), create(), update(), delete(), exists()

2. **UserRepository** extends IRepository<User>
   - Methods: findByEmail(), findByRole(), updateLastLogin(), incrementLoginCount(), recordFailedLogin()

3. **SupplierRepository** extends IRepository<Supplier>
   - Methods: findByUserId(), findByStatus(), findVerifiedSuppliers(), searchSuppliers(), updateRating(), incrementProductCount()

4. **ProductRepository** extends IRepository<Product>
   - Methods: findBySupplierId(), findByCategory(), findBySKU(), updateStock(), incrementViewCount(), bulkInsert()

5. **NegotiationRepository** extends IRepository<NegotiationSession>
   - Methods: findByShopId(), findBySupplierId(), findActiveByUser(), findExpiredSessions(), countActiveSessions(), getMessagesForSession()

6. **MessageRepository** extends IRepository<NegotiationMessage>
   - Methods: findBySessionId(), markAsRead(), countUnreadForUser(), getLatestMessage()

7. **PurchaseIntentRepository** extends IRepository<PurchaseIntent>
   - Methods: findByShopId(), findBySupplierId(), findByStatus(), findExpiredIntents(), updateStatus(), generateIntentNumber()

8. **AdminLogRepository** extends IRepository<AdminLog>
   - Methods: findByAdminId(), findByTargetEntity(), findByActionType(), findByDateRange(), searchLogs()

**Supporting Classes**:
- **DatabaseConnection**: connect(), disconnect(), beginTransaction(), commit(), rollback()
- **QueryBuilder**: select(), where(), join(), orderBy(), limit(), build()
- **CacheRepository**: get(), set(), delete(), exists(), invalidatePattern()

**Pattern**: Repository pattern abstracts data access, each repository handles one entity type, uses QueryBuilder for complex queries

---

### State Machine Diagrams (3 remaining)

#### 22_state_machine_supplier_verification.md
**States**: Unregistered → Profile Incomplete → Documents Submitted → Under Admin Review → Verification Approved (final) | Verification Rejected (final) | Suspended (can return to Approved) | Banned (final)

**Transitions**:
- Unregistered → Profile Incomplete [register()]
- Profile Incomplete → Documents Submitted [submit_documents() / all_required_docs_uploaded]
- Documents Submitted → Under Admin Review [auto_validation_passed]
- Under Admin Review → Verification Approved [admin_approve()]
- Under Admin Review → Verification Rejected [admin_reject()]
- Under Admin Review → Documents Submitted [request_more_docs()]
- Verification Approved → Suspended [admin_suspend() / policy_violation]
- Suspended → Verification Approved [admin_reactivate() / issue_resolved]
- Any state → Banned [severe_violation / fraud_detected]

**Entry/Exit Actions**:
- **Profile Incomplete**: Entry: Send welcome email, create checklist | Exit: Mark complete
- **Documents Submitted**: Entry: Run OCR, virus scan, risk scoring | Exit: Queue for admin
- **Under Admin Review**: Entry: Notify admin queue, set SLA (48h) | Exit: Log decision
- **Verification Approved**: Entry: Send approval email, activate features, schedule re-verification (365 days) | Exit: Log reason
- **Suspended**: Entry: Disable features, notify active negotiations | Exit: Log reactivation

---

#### 23_state_machine_negotiation_session.md
**States**: Initiated → Pending Supplier Response → Active → Awaiting Shop Response | Awaiting Supplier Response → Agreed (final) | Closed - Cancelled (final) | Closed - Expired (final)

**Transitions**:
- Initiated → Pending Supplier Response [shop_sends_initial_message]
- Pending → Active [supplier_responds]
- Pending → Closed - Expired [7_days_no_response]
- Active → Awaiting Shop Response [supplier_sends_message]
- Active → Awaiting Supplier Response [shop_sends_message]
- Awaiting Shop → Active [shop_responds]
- Awaiting Supplier → Active [supplier_responds]
- Any active → Agreed [both_parties_accept_terms]
- Any active → Closed - Cancelled [either_party_cancels]
- Any active → Closed - Expired [30_days_no_activity]

**Entry/Exit Actions**:
- **Initiated**: Entry: Create session ID, set expiration | Exit: Log first message timestamp
- **Pending Supplier Response**: Entry: Send email to supplier, start timer | Exit: Calculate response time
- **Active**: Entry: Open WebSocket channel | Do: Exchange messages | Exit: Close WebSocket if closing
- **Agreed**: Entry: Lock session (read-only), trigger purchase intent creation, send confirmations | Exit: Archive

---

#### 25_state_machine_user_account.md
**States**: Unverified → Active → Locked | Suspended | Deactivated → Banned (final)

**Transitions**:
- Unverified → Active [verify_email()]
- Unverified → Deactivated [30_days_no_verification]
- Active → Locked [5_failed_login_attempts]
- Locked → Active [15_minutes_elapsed OR password_reset]
- Active → Suspended [admin_suspend() / policy_violation]
- Suspended → Active [admin_reactivate()]
- Active → Deactivated [user_requests_deactivation]
- Deactivated → Active [user_reactivates() / within_30_days]
- Any state → Banned [admin_ban() / severe_violation]

**Entry/Exit Actions**:
- **Unverified**: Entry: Send verification email | Do: Allow re-send | Exit: Mark email_verified_at
- **Active**: Entry: Reset failed_login_attempts | Exit: Log reason
- **Locked**: Entry: Log IP, start 15-min timer | Do: Reject logins | Exit: Clear counter
- **Suspended**: Entry: Disable API access, close sessions, notify | Exit: Log reactivation
- **Banned**: Entry: Blacklist email/IP, close all sessions, anonymize PII | Do: Permanent denial
- **Deactivated**: Entry: Hide profile, pause notifications | Do: Maintain data 30 days | Exit: Restore visibility

---

### Component & Deployment Diagrams (3 total)

#### 26_component_system_architecture.md
**Components**:

1. **Presentation Layer**
   - Web Frontend (React/Vue SPA)
   - Mobile App (Optional, React Native)
   - Admin Dashboard (Separate React app)

2. **API Gateway Layer**
   - API Gateway (Kong/AWS API Gateway)
   - Load Balancer (Nginx/AWS ALB)
   - Rate Limiter
   - Authentication Middleware

3. **Application Services Layer**
   - User Service (Authentication, profiles)
   - Supplier Service (Verification, catalog)
   - Shop Service (Search, negotiation)
   - Product Service (CRUD, search)
   - Negotiation Service (Real-time messaging)
   - Purchase Intent Service (State machine)
   - Notification Service (Email, push, WebSocket)
   - Admin Service (Moderation, analytics)

4. **Infrastructure Services Layer**
   - Search Engine (Elasticsearch)
   - Cache Layer (Redis)
   - Message Queue (Redis/RabbitMQ)
   - WebSocket Server (Socket.io)
   - Background Job Processor (Bull/Sidekiq)
   - File Storage (AWS S3/GCS)
   - CDN (CloudFlare/CloudFront)

5. **Data Layer**
   - Primary Database (PostgreSQL)
   - Replica Database (Read replicas)
   - Analytics Database (Separate for reporting)

6. **External Services**
   - Email Service (SendGrid/AWS SES)
   - SMS Service (Twilio)
   - Payment Gateway (Stripe)
   - Document Verification (Trulioo/Onfido)

**Interfaces**:
- REST APIs between layers
- WebSocket for real-time
- Pub/Sub for event-driven
- GraphQL (optional, for frontend)

**Dependencies**:
- Services → PostgreSQL (read/write)
- Services → Redis (caching, sessions)
- Services → Elasticsearch (search)
- Services → Message Queue (async tasks)
- Notification Service → External Email/SMS
- All traffic → API Gateway first

---

#### 27_component_microservices_view.md
**Microservices Decomposition** (Optional, for scaling):

1. **User Management Service**
   - Owns: users, authentication, sessions
   - Database: users table
   - Exposes: /auth/*, /users/*

2. **Supplier Management Service**
   - Owns: suppliers, verification, products
   - Database: suppliers, products, categories
   - Exposes: /suppliers/*, /products/*

3. **Shop Management Service**
   - Owns: shops, favorites
   - Database: shops, favorite_suppliers
   - Exposes: /shops/*

4. **Negotiation Service**
   - Owns: negotiation sessions, messages
   - Database: negotiation_sessions, negotiation_messages
   - Exposes: /negotiations/*, WebSocket: /ws/negotiations

5. **Transaction Service**
   - Owns: purchase intents, orders
   - Database: purchase_intents
   - Exposes: /purchase-intents/*, /orders/*

6. **Search Service**
   - Owns: search index
   - Database: Elasticsearch
   - Exposes: /search/*

7. **Notification Service**
   - Owns: notifications, templates
   - Database: notification_preferences, notification_logs
   - Exposes: /notifications/*, WebSocket: /ws/notifications

8. **Admin Service**
   - Owns: admin operations, audit logs
   - Database: admin_logs, disputes
   - Exposes: /admin/*

**Communication**:
- Synchronous: REST APIs via API Gateway
- Asynchronous: Event bus (RabbitMQ/Kafka)
- Events: UserCreated, SupplierVerified, NegotiationAgreed, IntentCreated, etc.

**Data Management**:
- Each service has its own database schema
- No direct database access between services
- Use API calls or events for cross-service data

---

#### 28_deployment_production.md
**Deployment Architecture**:

1. **Load Balancing Tier**
   - AWS ALB / Nginx
   - SSL termination
   - Geographic routing (multi-region)
   - DDoS protection (AWS Shield)

2. **Application Tier**
   - Kubernetes Cluster (EKS/GKE)
   - Auto-scaling groups (2-20 pods per service)
   - Health checks
   - Rolling deployments
   - Separate namespaces: production, staging

3. **Database Tier**
   - PostgreSQL Primary (AWS RDS Multi-AZ)
   - 2 Read Replicas (for analytics, search indexing)
   - Automated backups (daily, 30-day retention)
   - Point-in-time recovery enabled

4. **Caching Tier**
   - Redis Cluster (AWS ElastiCache)
   - 3 nodes, replication enabled
   - Used for: sessions, search cache, rate limiting

5. **Search Tier**
   - Elasticsearch Cluster (AWS OpenSearch)
   - 3 nodes (master, data, data)
   - Automated snapshots

6. **Storage Tier**
   - S3 for documents, images
   - CloudFront CDN for static assets
   - Versioning enabled
   - Lifecycle policies (archive to Glacier after 90 days)

7. **Monitoring & Logging**
   - CloudWatch / DataDog for metrics
   - ELK Stack for centralized logging
   - Sentry for error tracking
   - PagerDuty for alerts

8. **CI/CD Pipeline**
   - GitHub Actions / GitLab CI
   - Automated testing
   - Staging deployment → Manual approval → Production
   - Blue-green deployments

**Network Architecture**:
- VPC with public and private subnets
- NAT Gateway for outbound traffic
- Security groups: Frontend, Backend, Database
- Bastion host for SSH access to private resources

**Disaster Recovery**:
- RTO: 4 hours
- RPO: 1 hour
- Cross-region backup replication
- Runbook for failover procedures

---

### Package Diagrams (2 total)

#### 29_package_application_structure.md
**Package Organization** (Monorepo Structure):

```
/b2b-marketplace/
├── /frontend/                  # Web application
│   ├── /src/
│   │   ├── /components/       # Reusable UI components
│   │   ├── /pages/            # Page components
│   │   ├── /services/         # API client services
│   │   ├── /store/            # State management (Redux/Vuex)
│   │   ├── /utils/            # Helper functions
│   │   └── /hooks/            # Custom React hooks
│   ├── package.json
│   └── tsconfig.json
│
├── /backend/                   # Node.js/Python backend
│   ├── /src/
│   │   ├── /api/              # REST API routes
│   │   │   ├── /auth/
│   │   │   ├── /suppliers/
│   │   │   ├── /shops/
│   │   │   ├── /products/
│   │   │   ├── /negotiations/
│   │   │   └── /admin/
│   │   ├── /services/         # Business logic layer
│   │   ├── /repositories/     # Data access layer
│   │   ├── /models/           # Domain entities
│   │   ├── /middleware/       # Express middleware
│   │   ├── /websocket/        # WebSocket handlers
│   │   ├── /jobs/             # Background jobs
│   │   ├── /utils/            # Helper functions
│   │   └── /config/           # Configuration
│   ├── package.json
│   └── tsconfig.json
│
├── /database/                  # Database migrations & seeds
│   ├── /migrations/
│   ├── /seeds/
│   └── schema.sql
│
├── /shared/                    # Shared code (types, constants)
│   ├── /types/
│   ├── /constants/
│   └── /validators/
│
├── /infrastructure/            # IaC (Terraform, K8s manifests)
│   ├── /terraform/
│   ├── /kubernetes/
│   └── /docker/
│
├── /docs/                      # Documentation
│   ├── /api/                  # API docs (OpenAPI)
│   ├── /uml/                  # UML diagrams
│   └── /runbooks/             # Operational guides
│
└── /tests/                     # End-to-end tests
    ├── /e2e/
    └── /integration/
```

**Package Dependencies**:
- Frontend depends on: Shared
- Backend depends on: Shared, Database
- Tests depend on: Frontend, Backend
- Infrastructure is independent

---

#### 30_package_domain_modules.md
**Domain-Driven Design Modules**:

1. **Identity & Access Module**
   - Entities: User, Session
   - Value Objects: Email, Password, Role
   - Services: AuthenticationService
   - Repositories: UserRepository
   - Bounded Context: User management, authentication

2. **Supplier Module**
   - Entities: Supplier
   - Aggregates: Supplier (root), Certifications, Documents
   - Value Objects: BusinessLicense, TaxID, Rating
   - Services: SupplierService, VerificationService
   - Repositories: SupplierRepository
   - Bounded Context: Supplier lifecycle, verification

3. **Product Catalog Module**
   - Entities: Product, Category
   - Aggregates: Product (root), Variants, Images
   - Value Objects: SKU, Price, MOQ
   - Services: ProductService, CategoryService
   - Repositories: ProductRepository, CategoryRepository
   - Bounded Context: Product management, inventory

4. **Negotiation Module**
   - Entities: NegotiationSession, NegotiationMessage
   - Aggregates: NegotiationSession (root), Messages
   - Value Objects: MessageContent, Terms
   - Services: NegotiationService, MessagingService
   - Repositories: NegotiationRepository, MessageRepository
   - Bounded Context: Buyer-seller negotiation

5. **Transaction Module**
   - Entities: PurchaseIntent
   - Aggregates: PurchaseIntent (root), LineItems
   - Value Objects: IntentNumber, Amount
   - Services: PurchaseIntentService, StateMachineService
   - Repositories: PurchaseIntentRepository
   - Bounded Context: Purchase commitment

6. **Administration Module**
   - Entities: AdminLog, Dispute
   - Value Objects: AuditEntry
   - Services: AdminService, DisputeService
   - Repositories: AdminLogRepository, DisputeRepository
   - Bounded Context: Platform governance

**Module Communication**:
- Via Domain Events (e.g., SupplierVerified, NegotiationAgreed)
- Anti-Corruption Layer between modules
- Shared Kernel: Common types, value objects
- No direct database access between modules

---

## Summary

This specification provides complete details for all 30 UML diagrams. Each diagram is:
- **Logically Consistent**: References to other diagrams are accurate
- **Tightly Linked**: State machines implement activity flows, sequences detail use cases
- **Production-Ready**: Includes implementation details, error handling, performance targets
- **StarUML Compatible**: All elements specified with proper UML notation

**Implementation Priority**:
1. Complete remaining Activity Diagrams (09-10) - Core workflows
2. Create all Sequence Diagrams (11-16) - Interaction details
3. Complete Class Diagrams (18-21) - Data & logic structure
4. Finish State Machines (22-23, 25) - Lifecycle management
5. Add Component/Deployment Diagrams (26-28) - System architecture
6. Create Package Diagrams (29-30) - Code organization

**Total Diagrams**: 30
**Completed**: 11 (37%)
**Remaining**: 19 (63%)

All diagrams follow the same high-quality standards as the completed examples.
