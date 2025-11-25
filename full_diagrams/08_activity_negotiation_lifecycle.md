# Activity Diagram - Negotiation Lifecycle

## Purpose
Complete end-to-end negotiation process from initiation through message exchange to agreement or cancellation, including real-time communication and timeout handling.

## Scope
- Negotiation initiation by shop
- Real-time message exchange
- Counter-offers and terms adjustment
- Agreement finalization
- Cancellation and expiration handling

## PlantUML Diagram

```plantuml
@startuml activity_negotiation_lifecycle

|Shop|
start
:View Supplier/Product;
:Click "Start Negotiation";

|System|
:Check Shop Negotiation Limit;

if (Can Start New Negotiation?) then (yes)
  |Shop|
  :Fill Negotiation Form:
  - Product
  - Quantity
  - Target Price
  - Delivery Requirements
  - Initial Message;
  
  :Submit Request;
  
  |System|
  :Validate Form Data;
  
  if (Valid?) then (yes)
    :Create Negotiation Session;
    :Generate Session ID;
    :Set Status = INITIATED;
    :Set Expiration (30 days);
    :Save Initial Message;
    
    fork
      :Send Email to Supplier;
    fork again
      :Create WebSocket Channel;
    fork again
      :Log Event;
    end fork
    
    |Shop|
    :Show "Request Sent" Confirmation;
    :Redirect to Negotiation Page;
    
    |Supplier|
    :Receive Email Notification;
    :Click Link to View Request;
    
    |System|
    :Load Negotiation Session;
    :Load Messages;
    :Load Shop Profile;
    
    |Supplier|
    :Review Request;
    
    partition "Supplier Decision" {
      if (Accept Negotiation?) then (yes)
        :Click "Accept & Respond";
        :Type Response Message;
        :Submit;
        
        |System|
        :Update Status = ACTIVE;
        :Save Message;
        :Notify Shop via WebSocket;
        
        |Shop|
        :Receive Real-time Notification;
        :Read Supplier Response;
        
      else (no - decline)
        :Click "Decline";
        :Enter Decline Reason;
        
        |System|
        :Update Status = CLOSED_CANCELLED;
        :Save Reason;
        :Notify Shop;
        
        |Shop|
        :Receive Decline Notification;
        
        stop
      endif
    }
    
    partition "Negotiation Exchange" {
      repeat
        
        |Shop|
        :Type Message;
        
        note right
          Messages can include:
          - Text
          - Price counter-offer
          - Quantity adjustment
          - Delivery terms
          - Attachments
        end note
        
        :Send Message;
        
        |System|
        :Save to Database;
        :Publish via WebSocket;
        :Update Last Activity Timestamp;
        
        |Supplier|
        :Receive Message (Real-time);
        :Read Message;
        :Mark as Read;
        
        |System|
        :Update Read Status;
        :Send Read Receipt to Shop;
        
        |Supplier|
        :Type Response;
        :Send Message;
        
        |System|
        :Save to Database;
        :Publish via WebSocket;
        
        |Shop|
        :Receive Message (Real-time);
        :Read Response;
        
        if (Terms Acceptable?) then (yes)
          :Click "Accept Terms";
          
          |System|
          :Update Status = AGREED;
          :Lock Session (Read-Only);
          :Trigger Purchase Intent Creation;
          
          note right
            Transitions to:
            09_activity_purchase_intent_creation.md
          end note
          
          fork
            :Send Confirmation Email (Shop);
          fork again
            :Send Confirmation Email (Supplier);
          fork again
            :Update Statistics;
          end fork
          
          |Shop|
          :Show "Agreement Reached" ✓;
          :Redirect to Create Purchase Intent;
          
          stop
          
        else if (Counter-Offer?) then (yes)
          |Shop|
          :Adjust Terms;
          
          backward :Send Message;
          
        else (cancel)
          |Shop|
          :Click "Cancel Negotiation";
          :Enter Cancellation Reason;
          
          |System|
          :Update Status = CLOSED_CANCELLED;
          :Notify Supplier;
          :Log Event;
          
          stop
        endif
        
      repeat while (Continue Negotiating?) is (yes)
      ->no;
    }
    
  else (no - invalid)
    |Shop|
    :Show Validation Errors;
    
    backward :Fill Negotiation Form;
  endif
  
else (no - limit reached)
  |Shop|
  :Show Error: "Max 5 Active Negotiations";
  :Prompt to Close Existing Negotiations;
  
  stop
endif

|System|
partition "Background Process: Expiration Check" {
  :Cron Job (Every 5 Minutes);
  :Query Negotiations WHERE status = ACTIVE AND last_activity < NOW() - 30 days;
  
  repeat :For Each Expired Negotiation;
    :Update Status = EXPIRED;
    :Send Expiration Notification to Both Parties;
    :Log Event;
  repeat while (More Expired Sessions?)
}

stop

@enduml
```

## Key Design Decisions

### 1. Real-Time Communication
- **WebSocket**: Bi-directional communication for instant updates
- **Fallback**: Polling every 5 seconds if WebSocket unavailable
- **Read Receipts**: Single checkmark (delivered), double checkmark (read)
- **Typing Indicators**: Show when other party is typing

### 2. Negotiation Limits
- **Concurrent Limit**: Maximum 5 active negotiations per shop
- **Expiration**: Auto-expire after 30 days of inactivity
- **Message Limit**: No hard limit, but warn after 50 messages
- **File Attachments**: Support PDFs, images (max 10MB total)

### 3. State Transitions
```
INITIATED → ACTIVE (supplier accepts)
INITIATED → CLOSED_CANCELLED (supplier declines)
ACTIVE → AGREED (both parties accept)
ACTIVE → CLOSED_CANCELLED (either party cancels)
ACTIVE → EXPIRED (30 days no activity)
```

### 4. Message Types
- **TEXT**: Regular text message
- **PRICE_OFFER**: Structured price proposal
- **COUNTER_OFFER**: Response to price offer
- **TERMS_PROPOSAL**: Delivery/payment terms
- **QUESTION**: Request for clarification
- **ATTACHMENT**: Document sharing

### 5. Notification Strategy
- **Email**: Sent for new negotiation, first response, agreement
- **WebSocket**: Real-time for all messages during active session
- **In-App**: Badge count of unread messages
- **Push**: Optional mobile push notifications

## Business Rules

1. **Concurrent Limit**: Max 5 active negotiations per shop
2. **Expiration**: 30 days from last message
3. **Supplier Response SLA**: Expected within 48 hours (tracked, not enforced)
4. **Message Length**: Max 5,000 characters
5. **Attachment Size**: Max 10MB total per session
6. **Read-Only After Agreement**: No new messages after AGREED status
7. **Cancellation**: Either party can cancel anytime before agreement

## Related Diagrams
- **03_use_case_shop_context.md**: Shop negotiation use cases
- **02_use_case_supplier_context.md**: Supplier negotiation use cases
- **13_sequence_negotiation_initiation.md**: Negotiation start sequence
- **14_sequence_real_time_messaging.md**: WebSocket message flow
- **18_class_domain_model_negotiation.md**: Negotiation entities
- **23_state_machine_negotiation_session.md**: Session state machine

## Implementation Notes

### WebSocket Connection
```javascript
// Client-side
const ws = new WebSocket(`wss://api.platform.com/negotiations/${sessionId}`);
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  displayMessage(message);
};

// Server-side (Node.js)
wss.on('connection', (ws, req) => {
  const sessionId = req.params.sessionId;
  subscribeToSession(sessionId, ws);
});
```

### Message Persistence
```sql
-- Save message
INSERT INTO negotiation_messages (
  session_id, sender_user_id, content, message_type, metadata, created_at
) VALUES ($1, $2, $3, $4, $5, NOW())
RETURNING id;

-- Update read status
UPDATE negotiation_messages 
SET is_read = true, read_at = NOW() 
WHERE id = $1;
```

### Expiration Checker
```javascript
// Cron job every 5 minutes
async function checkExpirations() {
  const expiredSessions = await db.query(`
    SELECT id FROM negotiation_sessions 
    WHERE status = 'ACTIVE' 
    AND updated_at < NOW() - INTERVAL '30 days'
  `);
  
  for (const session of expiredSessions) {
    await expireSession(session.id);
  }
}
```

## Performance Targets
- **Message Delivery**: <1 second (real-time)
- **Message History Load**: <300ms (50 messages)
- **Session List Load**: <200ms
- **WebSocket Reconnection**: <2 seconds

## Error Scenarios

1. **WebSocket Disconnection**: Auto-reconnect with exponential backoff
2. **Message Send Failure**: Retry 3 times, then show error
3. **Duplicate Messages**: Deduplicate by message ID client-side
4. **Large File Upload**: Show progress bar, allow cancellation
5. **Concurrent Editing**: Last-write-wins, show warning if detected
