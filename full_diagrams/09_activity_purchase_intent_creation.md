# Activity Diagram - Purchase Intent Creation

## Purpose
Detailed workflow showing how purchase intents are created from negotiations, validated, approved (if needed), submitted to suppliers, and processed through acceptance or decline.

## Scope
- Intent creation from agreed negotiation
- Validation and manager approval flow
- Submission to supplier
- Supplier review and response
- Acceptance, decline, and modification paths
- Expiration handling

## PlantUML Diagram

```plantuml
@startuml activity_purchase_intent_creation

|Shop|
start
:Negotiation Reaches AGREED Status;

note right
  Triggered from:
  08_activity_negotiation_lifecycle.md
end note

|System|
:Show "Create Purchase Intent" Button;

|Shop|
:Click "Create Purchase Intent";

|System|
:Pre-fill Data from Negotiation:
- Product
- Supplier
- Agreed Quantity
- Agreed Price
- Terms;

:Create Intent with Status = DRAFT;
:Generate Intent Number (e.g., PI-2024-001234);

|Shop|
:Review Pre-filled Information;

partition "Add Additional Details" {
  :Enter Delivery Address;
  :Enter Contact Person;
  :Enter Phone Number;
  :Select Delivery Deadline;
  :Enter Special Instructions (Optional);
  :Add Internal Notes (Optional);
}

:Review Complete Intent Summary;

if (All Required Fields Complete?) then (yes)
  :Click "Submit for Processing";
  
  |System|
  :Validate All Fields;
  
  if (Validation Passed?) then (yes)
    :Calculate Total Amount;
    :Check Amount Threshold;
    
    if (Amount >= $10,000?) then (yes - needs approval)
      :Set Status = PENDING_MANAGER_APPROVAL;
      :Identify Shop Manager;
      
      fork
        :Send Email to Manager;
      fork again
        :Create In-App Notification;
      end fork
      
      |Shop Manager|
      :Receive Approval Request;
      :Review Intent Details;
      :Check Budget Availability;
      :Assess Business Justification;
      
      if (Approve Intent?) then (yes)
        :Click "Approve";
        :Enter Approval Notes;
        
        |System|
        :Log Approval Decision;
        :Notify Original Requester;
        
      else (no - reject)
        :Click "Reject";
        :Enter Rejection Reason;
        
        |System|
        :Set Status = REJECTED;
        :Log Rejection;
        
        |Shop|
        :Receive Rejection Notification;
        :Review Rejection Reason;
        
        if (Modify and Resubmit?) then (yes)
          backward :Review Pre-filled Information;
        else (no)
          :Archive Intent;
          stop
        endif
      endif
      
    else (no - under threshold)
      :(Skip manager approval);
    endif
    
    |System|
    :Set Status = WAITING_SUPPLIER_RESPONSE;
    :Set Expiration = NOW() + 7 days;
    :Lock Shop-Editable Fields;
    
    fork
      :Save to Database;
    fork again
      :Send Email to Supplier;
    fork again
      :Create Supplier Notification;
    fork again
      :Log Event in Audit Trail;
    fork again
      :Update Analytics (Intent Created);
    end fork
    
    |Shop|
    :Show "Intent Submitted Successfully" ✓;
    :Display Intent Tracking Page;
    :Show Status = "Waiting for Supplier Response";
    :Show Countdown Timer (7 days);
    
    |Supplier|
    :Receive Email Notification;
    :Click Link to View Intent;
    
    |System|
    :Load Purchase Intent Details;
    :Load Shop Profile;
    :Load Negotiation History;
    
    |Supplier|
    :Review Intent:
    - Product & Quantity
    - Agreed Price
    - Delivery Requirements
    - Payment Terms
    - Special Instructions;
    
    partition "Supplier Decision Process" {
      :Check Inventory Availability;
      :Verify Production Capacity;
      :Confirm Delivery Timeline;
      :Review Payment Terms;
      
      if (Can Fulfill As-Is?) then (yes)
        :Click "Accept Intent";
        :Enter Confirmation Notes:
        - Estimated Delivery Date
        - Contact Person
        - Additional Instructions;
        
        |System|
        :Update Status = AGREED;
        :Lock ALL Fields (Immutable);
        :Set agreed_at = NOW();
        :Calculate Response Time;
        
        fork
          :Send Confirmation Email to Shop;
        fork again
          :Send Confirmation Email to Supplier;
        fork again
          :Generate PDF Summary;
        fork again
          :Update Supplier Statistics:
          - Response Time
          - Acceptance Rate;
        fork again
          :Update Shop Statistics;
        fork again
          :Log in Audit Trail;
        fork again
          :Trigger Order Creation Workflow;
        end fork
        
        |Shop|
        :Receive Acceptance Notification;
        :View Confirmed Intent;
        :Download PDF Summary;
        :Proceed to Order/Payment;
        
        stop
        
      else if (Need Modifications?) then (yes)
        :Click "Request Modifications";
        :Specify Changes Needed:
        - Adjust Quantity?
        - Change Delivery Date?
        - Modify Specifications?
        - Update Payment Terms?;
        :Enter Modification Reason;
        :Submit Modification Request;
        
        |System|
        :Set Status = MODIFICATION_REQUESTED;
        :Save Modification Details;
        
        fork
          :Notify Shop of Modification Request;
        fork again
          :Log Event;
        end fork
        
        |Shop|
        :Receive Modification Request;
        :Review Requested Changes;
        
        if (Accept Modifications?) then (yes)
          :Click "Accept Changes";
          :Update Intent Details;
          
          |System|
          :Apply Modifications;
          :Set Status = WAITING_SUPPLIER_RESPONSE;
          :Reset Expiration Timer;
          :Notify Supplier;
          
          backward :Review Intent;
          
        else if (Counter-Propose?) then (yes)
          :Enter Counter-Proposal;
          
          |System|
          :Set Status = NEGOTIATING;
          :Notify Supplier;
          
          note right
            Returns to negotiation mode
            if terms cannot be agreed
          end note
          
          backward :Review Intent;
          
        else (cancel)
          :Click "Cancel Intent";
          :Enter Cancellation Reason;
          
          |System|
          :Set Status = CANCELLED;
          :Set cancelled_by = SHOP;
          :Notify Supplier;
          
          stop
        endif
        
      else (no - decline)
        :Click "Decline Intent";
        :Select Decline Reason:
        - Out of Stock
        - Cannot Meet Deadline
        - Price No Longer Valid
        - Capacity Constraints
        - Other (specify);
        :Enter Detailed Explanation;
        
        |System|
        :Set Status = CANCELLED;
        :Set cancelled_by = SUPPLIER;
        :Save Decline Reason;
        :Set cancelled_at = NOW();
        
        fork
          :Send Decline Notification to Shop;
        fork again
          :Update Supplier Statistics:
          - Decline Rate;
        fork again
          :Log in Audit Trail;
        end fork
        
        |Shop|
        :Receive Decline Notification;
        :View Decline Reason;
        
        if (Search for Alternative Supplier?) then (yes)
          :Return to Supplier Search;
          
          note right
            Links to:
            07_activity_search_and_discovery.md
          end note
          
          stop
          
        else (no)
          :Archive Intent;
          stop
        endif
      endif
    }
    
  else (no - validation failed)
    |Shop|
    :View Validation Errors:
    - Missing Required Fields
    - Invalid Date Format
    - Invalid Phone Number
    - etc.;
    
    backward :Review Pre-filled Information;
  endif
  
else (no - incomplete)
  |Shop|
  :Show Required Field Indicators;
  
  backward :Review Pre-filled Information;
endif

|System|
partition "Background Process: Expiration Check" {
  :Cron Job Runs Every 5 Minutes;
  
  :Query Database:
  SELECT * FROM purchase_intents
  WHERE status IN ('DRAFT', 'WAITING_SUPPLIER_RESPONSE', 'MODIFICATION_REQUESTED')
  AND expires_at < NOW();
  
  repeat :For Each Expired Intent;
    if (Status = DRAFT?) then (yes)
      :Update Status = EXPIRED;
      :Send Notification to Shop:
      "Your draft intent expired after 30 days";
      
    else if (Status = WAITING_SUPPLIER_RESPONSE?) then (yes)
      :Update Status = EXPIRED;
      
      fork
        :Send Notification to Shop:
        "Supplier did not respond within 7 days";
      fork again
        :Send Notification to Supplier:
        "Intent expired - you took too long to respond";
      fork again
        :Update Supplier Statistics:
        - Decrease Response Score;
      end fork
      
    else (MODIFICATION_REQUESTED)
      :Update Status = EXPIRED;
      :Send Notification to Shop:
      "Intent expired during modification discussion";
    endif
    
    :Log Expiration Event;
    :Update Analytics:
    - Expiration Rate
    - By Status
    - By Supplier;
    
  repeat while (More Expired Intents?)
}

stop

@enduml
```

## Key Design Decisions

### 1. Manager Approval Workflow
- **Threshold**: Intents >= $10,000 require manager approval
- **Configurable**: Threshold can be adjusted per shop
- **Bypass**: Manager role can be shop owner (auto-approve)
- **Notification**: Email + in-app notification
- **Timeout**: If no response in 3 days, escalate to senior manager

### 2. State Transitions
```
DRAFT → PENDING_MANAGER_APPROVAL (if amount >= threshold)
PENDING_MANAGER_APPROVAL → WAITING_SUPPLIER_RESPONSE (approved)
PENDING_MANAGER_APPROVAL → REJECTED (declined)
WAITING_SUPPLIER_RESPONSE → AGREED (supplier accepts)
WAITING_SUPPLIER_RESPONSE → MODIFICATION_REQUESTED (supplier requests changes)
WAITING_SUPPLIER_RESPONSE → CANCELLED (supplier declines)
MODIFICATION_REQUESTED → WAITING_SUPPLIER_RESPONSE (shop accepts changes)
MODIFICATION_REQUESTED → NEGOTIATING (shop counter-proposes)
MODIFICATION_REQUESTED → CANCELLED (shop cancels)
Any → EXPIRED (timeout)
```

### 3. Expiration Timers
- **Draft Status**: 30 days from creation
- **Waiting for Supplier**: 7 days from submission
- **Modification Requested**: 7 days from modification request
- **Agreed Status**: Never expires (immutable)

### 4. Immutability Rules
Once intent status = AGREED:
- All fields locked (cannot be modified)
- Cannot be cancelled by either party
- Acts as binding commitment
- Only admin can cancel (with reason logged)

### 5. Field Locking Strategy
- **Draft**: Shop can edit all fields
- **Pending Approval**: Shop cannot edit (waiting for manager)
- **Waiting for Supplier**: Shop cannot edit core terms, can update contact info
- **Agreed**: Nobody can edit (immutable)

## Business Rules

1. **Intent Number Format**: PI-{YEAR}-{6-digit-sequence}
2. **Manager Approval**: Required for intents >= $10,000 (configurable)
3. **Expiration Periods**: Draft (30d), Waiting (7d), Modification (7d)
4. **Response Time SLA**: Suppliers expected to respond within 48 hours
5. **Maximum Modifications**: Limit to 3 modification cycles to prevent endless loop
6. **Decline Reason Required**: Suppliers must provide reason for declining
7. **PDF Generation**: Auto-generate when intent reaches AGREED status
8. **Order Conversion**: AGREED intents automatically trigger order creation

## Related Diagrams
- **08_activity_negotiation_lifecycle.md**: Source of purchase intent (negotiation agreement)
- **24_state_machine_purchase_intent.md**: Implements state machine logic
- **15_sequence_purchase_intent_flow.md**: Detailed interaction sequences
- **03_use_case_shop_context.md**: Shop purchase intent use cases
- **02_use_case_supplier_context.md**: Supplier intent processing use cases

## Implementation Notes

### Database Operations
```sql
-- Create intent
BEGIN;
  INSERT INTO purchase_intents (
    intent_number, shop_id, supplier_id, product_id,
    quantity, agreed_unit_price, total_amount,
    status, expires_at, created_at
  ) VALUES (
    generate_intent_number(), $1, $2, $3, $4, $5, $6,
    'DRAFT', NOW() + INTERVAL '30 days', NOW()
  ) RETURNING id;
  
  -- Log event
  INSERT INTO intent_events (intent_id, event_type, user_id, timestamp)
  VALUES (intent_id, 'CREATED', $shop_user_id, NOW());
COMMIT;

-- Supplier accepts
BEGIN;
  UPDATE purchase_intents 
  SET status = 'AGREED', 
      agreed_at = NOW(),
      supplier_notes = $notes
  WHERE id = $intent_id AND status = 'WAITING_SUPPLIER_RESPONSE';
  
  -- Calculate response time
  UPDATE suppliers
  SET total_response_time = total_response_time + 
      EXTRACT(EPOCH FROM (NOW() - intent.created_at)),
      total_accepted_intents = total_accepted_intents + 1
  WHERE id = $supplier_id;
COMMIT;
```

### Manager Approval Logic
```typescript
async function requiresManagerApproval(intent: PurchaseIntent): Promise<boolean> {
  const shop = await getShop(intent.shop_id);
  const threshold = shop.approval_threshold || 10000; // Default $10k
  
  return intent.total_amount >= threshold;
}

async function getApprover(intent: PurchaseIntent): Promise<User> {
  const shop = await getShop(intent.shop_id);
  
  // Get manager assigned to intent creator
  const creator = await getUser(intent.created_by);
  if (creator.manager_id) {
    return await getUser(creator.manager_id);
  }
  
  // Fallback to shop owner
  return await getUser(shop.owner_user_id);
}
```

### Expiration Checker
```typescript
// Cron job: every 5 minutes
async function checkExpirations() {
  const expiredIntents = await db.query(`
    SELECT id, status, shop_id, supplier_id 
    FROM purchase_intents
    WHERE status IN ('DRAFT', 'WAITING_SUPPLIER_RESPONSE', 'MODIFICATION_REQUESTED')
    AND expires_at < NOW()
  `);
  
  for (const intent of expiredIntents) {
    await expireIntent(intent);
  }
}

async function expireIntent(intent: PurchaseIntent) {
  await db.query(`
    UPDATE purchase_intents 
    SET status = 'EXPIRED', expired_at = NOW()
    WHERE id = $1
  `, [intent.id]);
  
  // Send notifications based on status
  if (intent.status === 'WAITING_SUPPLIER_RESPONSE') {
    await notifyShop(intent.shop_id, 'Intent expired - supplier did not respond');
    await notifySupplier(intent.supplier_id, 'You took too long to respond');
    await penalizeSupplierScore(intent.supplier_id);
  }
  
  await logEvent(intent.id, 'EXPIRED');
}
```

## Performance Targets
- **Intent Creation**: <1 second
- **Validation**: <500ms
- **Supplier Notification**: <2 seconds (email queued)
- **Status Update**: <300ms
- **Expiration Check**: <10 seconds for 10,000 intents

## Error Scenarios

1. **Manager Unavailable**: Escalate to next level after 3 days
2. **Supplier Email Bounce**: Mark as failed, notify admin
3. **Concurrent Modification**: Last-write-wins with conflict warning
4. **Database Timeout**: Retry transaction 3 times
5. **PDF Generation Failure**: Allow viewing, retry generation in background
