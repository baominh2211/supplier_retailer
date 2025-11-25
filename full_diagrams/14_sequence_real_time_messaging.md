# Sequence Diagram - Real-Time Messaging

## Purpose
Show WebSocket message exchange with read receipts and reconnection.

## PlantUML Diagram

```plantuml
@startuml sequence_real_time_messaging

actor "Sender" as Sender
participant "Sender\nFrontend" as SFE
participant "WebSocket\nServer" as WS
participant "Redis\nPub/Sub" as Redis
participant "Backend API" as API
participant "PostgreSQL" as DB
participant "Receiver\nFrontend" as RFE
actor "Receiver" as Receiver

== Send Message ==

Sender -> SFE: Type message, press Enter
SFE -> SFE: Validate (not empty, <5000 chars)
SFE -> SFE: Show "Sending..." indicator
SFE -> WS: {type: 'message', session_id, content, timestamp}
WS -> API: Forward for persistence
API -> DB: INSERT INTO negotiation_messages\n(session_id, sender_user_id, content, created_at)
DB --> API: message_id
API -> API: Build message object\n{id, content, sender, timestamp, status: 'delivered'}
API -> Redis: PUBLISH negotiation:{session_id}\n{message_data}
Redis --> WS: Message published

WS -> WS: Get all connected clients for session
WS -> SFE: {type: 'message_ack', message_id, status: 'delivered'}
SFE -> SFE: Update UI, show checkmark ✓
SFE --> Sender: Message sent confirmation

WS -> RFE: {type: 'new_message', message_data}
RFE -> RFE: Play notification sound
RFE -> RFE: Append message to chat
RFE --> Receiver: Display new message

Receiver -> RFE: View message
RFE -> WS: {type: 'message_read', message_id}
WS -> API: Mark as read
API -> DB: UPDATE negotiation_messages\nSET is_read=true, read_at=NOW()\nWHERE id=?
API -> Redis: PUBLISH message_read_event
Redis --> WS: Read event
WS -> SFE: {type: 'message_read', message_id}
SFE -> SFE: Show double checkmark ✓✓
SFE --> Sender: Read receipt displayed

== Reconnection Handling ==

RFE -> RFE: Detect WebSocket disconnect
RFE -> RFE: Show "Reconnecting..." banner
RFE -> WS: Attempt reconnect (retry 1)
WS --> RFE: Connection failed
RFE -> RFE: Wait 2 seconds (exponential backoff)
RFE -> WS: Attempt reconnect (retry 2)
WS --> RFE: Connection established ✓
RFE -> RFE: Hide banner

RFE -> API: GET /api/negotiations/{session_id}/messages\n?since={last_message_id}
API -> DB: SELECT * FROM negotiation_messages\nWHERE session_id=? AND id > ?
DB --> API: Missed messages
API --> RFE: {messages: [...]}
RFE -> RFE: Sync local state
RFE --> Receiver: Display missed messages

== Typing Indicator ==

Sender -> SFE: Start typing
SFE -> SFE: Debounce 1 second
SFE -> WS: {type: 'typing', session_id, user_id}
WS -> RFE: {type: 'user_typing', user_name}
RFE --> Receiver: Show "{user_name} is typing..."

SFE -> SFE: No typing for 3 seconds
SFE -> WS: {type: 'typing_stopped', session_id}
WS -> RFE: {type: 'user_stopped_typing'}
RFE -> RFE: Hide typing indicator

@enduml
```

## Links to: 08_activity_negotiation_lifecycle.md, 18_class_domain_model_negotiation.md
