# Activity Diagram - Dispute Resolution

## Purpose
Complete workflow for handling disputes between suppliers and shops, including filing, investigation, mediation, ruling, enforcement, and appeals.

## Scope
- Dispute filing by either party
- Admin investigation process
- Mediation attempts
- Final ruling and enforcement
- Appeal process

## PlantUML Diagram

```plantuml
@startuml activity_dispute_resolution

|Initiating Party (Shop or Supplier)|
start
:Encounter Issue with:
- Negotiation terms not honored
- Product quality concerns
- Delivery delays
- Payment disputes
- Misrepresentation;

:Navigate to Dispute Center;
:Click "File New Dispute";

|System|
:Display Dispute Form;

|Initiating Party|
:Select Dispute Type:
- Pricing Disagreement
- Quality Issue
- Delivery Delay
- Payment Issue
- Terms Violation
- Fraud/Misrepresentation
- Other;

:Enter Dispute Title (Summary);

:Write Detailed Description (min 100 chars);

:Upload Evidence:
- Screenshots
- Email chains
- Documents
- Photos
- Contracts;

note right
  Max 10 files
  Max 50MB total
end note

:Submit Dispute;

|System|
:Validate Submission;

if (Valid Submission?) then (yes)
  :Generate Unique Dispute ID;
  :Set Status = OPEN;
  :Set Priority Based on Type;
  :Assign to Admin Queue;
  :Set Response Deadline = NOW() + 48 hours;
  
  fork
    :Save to Database;
  fork again
    :Send Email to Admin Team;
  fork again
    :Notify Responding Party;
  fork again
    :Log Dispute Creation;
  end fork
  
  |Initiating Party|
  :Receive Confirmation;
  :View Dispute ID;
  
  |Responding Party|
  :Receive Dispute Notification;
  :Click Link to View Details;
  
  |System|
  :Display Dispute Details;
  :Show Evidence;
  :Request Response;
  
  |Responding Party|
  :Read Dispute Claim;
  :Review Evidence;
  :Prepare Response;
  
  if (Respond to Dispute?) then (yes)
    :Write Counter-Statement;
    :Upload Counter-Evidence;
    :Submit Response;
    
    |System|
    :Save Response;
    :Update dispute_response_received_at;
    :Notify Initiating Party;
    :Notify Admin (both sides heard);
    
  else (no - timeout)
    |System|
    :Wait 48 Hours;
    
    if (Response Received?) then (no)
      :Log "No Response from Respondent";
      :Flag for Admin Attention;
      :Proceed with Available Info;
    endif
  endif
  
  |Admin|
  :Receive Notification in Queue;
  :Access Admin Dashboard;
  :View Dispute List;
  :Sort by Priority/Age;
  :Select Dispute to Review;
  
  partition "Admin Investigation" {
    |System|
    :Load Complete Dispute File:
    - Initial claim
    - Response
    - All evidence
    - User histories
    - Negotiation transcript
    - Purchase intent (if exists)
    - Message history;
    
    |Admin|
    :Review All Materials;
    :Check Negotiation History;
    :Review User Account Status;
    :Check Past Disputes;
    :Verify Evidence Authenticity;
    
    if (Need More Information?) then (yes)
      :Click "Request Additional Info";
      :Specify What's Needed;
      :Select Party to Provide Info;
      :Set Response Deadline;
      
      |System|
      :Send Request to Party;
      
      |Party|
      :Receive Request;
      :Provide Additional Info;
      
      |System|
      :Save Additional Evidence;
      :Notify Admin;
      
      |Admin|
      backward :Review All Materials;
      
    else (no - sufficient info)
      :Information Complete;
    endif
    
    |Admin|
    :Analyze Facts;
    :Review Platform Policies;
    :Check Terms of Service;
    :Consult Similar Cases;
  }
  
  partition "Mediation Attempt" {
    |Admin|
    
    if (Case Suitable for Mediation?) then (yes)
      :Click "Open Mediation";
      :Draft Proposed Solution;
      :Send to Both Parties;
      
      |System|
      :Create Mediation Channel;
      :Notify Both Parties;
      
      |Initiating Party|
      :Receive Mediation Proposal;
      :Review Proposed Solution;
      
      if (Accept Proposal?) then (yes)
        :Click "Accept";
        
        |System|
        :Record Acceptance (Party 1);
        :Wait for Other Party;
        
        |Responding Party|
        :Review Proposal;
        
        if (Accept Proposal?) then (yes)
          :Click "Accept";
          
          |System|
          :Both Parties Accepted ✓;
          :Set Status = RESOLVED_MEDIATION;
          :Execute Mediation Terms;
          
          fork
            :Send Confirmation Emails;
          fork again
            :Log Resolution;
          fork again
            :Close Dispute;
          fork again
            :Update Statistics;
          end fork
          
          stop
          
        else (no)
          :Click "Decline";
          :Enter Reason;
          
          |System|
          :Mediation Failed;
          :Escalate to Ruling;
        endif
        
      else (no)
        |Initiating Party|
        :Click "Decline";
        :Enter Reason;
        
        |System|
        :Mediation Failed;
        :Escalate to Ruling;
      endif
      
    else (no - proceed to ruling)
      :Skip Mediation;
    endif
  }
  
  partition "Admin Ruling" {
    |Admin|
    :Review All Evidence Again;
    :Consider Both Arguments;
    
    if (Complex/High-Value Case?) then (yes)
      :Flag for Legal Team Review;
      
      |Legal Team|
      :Receive Escalation;
      :Legal Analysis;
      :Review Liability;
      :Check Regulations;
      :Provide Recommendation;
      
      |Admin|
      :Receive Legal Recommendation;
      :Incorporate Legal Advice;
      
    endif
    
    |Admin|
    :Make Final Decision;
    :Determine Ruling:
    - In favor of initiating party
    - In favor of responding party
    - Partial favor (compromise)
    - Dismiss (insufficient evidence);
    
    :Write Detailed Ruling;
    :Specify Actions Required;
    :Set Enforcement Deadline;
    
    :Submit Ruling;
    
    |System|
    :Update Status = RESOLVED_RULING;
    :Save Ruling Details;
    :Set ruling_issued_at = NOW();
    
    fork
      :Send Ruling to Initiating Party;
    fork again
      :Send Ruling to Responding Party;
    fork again
      :Log in AdminLog;
    fork again
      :Queue for Enforcement;
    end fork
    
    |Both Parties|
    :Receive Ruling Notification;
    :Read Admin Decision;
    :View Required Actions;
  }
  
  partition "Enforcement" {
    |System|
    :Parse Enforcement Actions;
    
    repeat :For Each Action;
      
      if (Action Type?) then (Refund)
        :Initiate Refund Process;
        :Calculate Amount;
        :Notify Payment Gateway;
        :Process Transaction;
        :Confirm Completion;
        
      else if (Suspension)
        :Suspend User Account;
        :Update user status = SUSPENDED;
        :Close Active Sessions;
        :Send Suspension Notice;
        :Set suspension_duration;
        
      else if (Warning)
        :Add Warning to User Record;
        :Increment warning_count;
        :Send Warning Email;
        
        if (Warning Count >= 3?) then (yes)
          :Auto-escalate to Suspension;
        endif
        
      else if (Ban)
        :Permanently Ban User;
        :Update status = BANNED;
        :Blacklist Email/IP;
        :Close All Sessions;
        :Notify User;
        
      else (No Action Required)
        :Just Log Decision;
      endif
      
      :Record Enforcement Action;
      :Log Timestamp;
      
    repeat while (More Actions?)
    
    :Update Enforcement Status = COMPLETED;
    :Notify Admin;
    :Send Confirmation to Parties;
  }
  
  partition "Appeal Process" {
    |Losing Party|
    
    note right
      Appeals allowed within
      7 days of ruling
    end note
    
    if (Want to Appeal?) then (yes)
      :Click "File Appeal";
      :Enter Appeal Reason;
      :Provide New Evidence;
      :Explain Why Ruling Wrong;
      :Submit Appeal;
      
      |System|
      :Validate Appeal Window (7 days);
      
      if (Within Appeal Window?) then (yes)
        :Create Appeal Record;
        :Set Status = UNDER_APPEAL;
        :Assign to Senior Admin;
        :Notify Original Admin;
        
        |Senior Admin|
        :Receive Appeal;
        :Review Original Ruling;
        :Review Appeal Reason;
        :Review New Evidence;
        :Consult Original Admin;
        
        if (Overturn Ruling?) then (yes)
          :Draft New Ruling;
          :Explain Overturn Reason;
          :Specify New Actions;
          
          |System|
          :Update Ruling;
          :Reverse Previous Enforcement;
          :Execute New Enforcement;
          :Set Status = RESOLVED_APPEAL_GRANTED;
          
          fork
            :Notify Both Parties;
          fork again
            :Log Appeal Outcome;
          fork again
            :Update Statistics;
          end fork
          
        else (no - uphold)
          :Draft Uphold Decision;
          :Explain Why Original Ruling Stands;
          
          |System|
          :Mark Appeal as DENIED;
          :Set Status = RESOLVED_FINAL;
          :No Further Appeals Allowed;
          
          fork
            :Notify Both Parties;
          fork again
            :Log Final Decision;
          end fork
        endif
        
      else (no - too late)
        |System|
        :Reject Appeal;
        :Send "Appeal Window Closed" Notice;
      endif
      
    else (no)
      :Accept Ruling;
      
      |System|
      :Wait 7 Days for Appeal Window;
      
      if (No Appeal Filed?) then (yes)
        :Set Status = RESOLVED_FINAL;
        :Mark as Closed;
      endif
    endif
  }
  
  |System|
  :Update Dispute Statistics;
  :Calculate Resolution Time;
  :Update User Dispute Counts;
  :Archive Dispute Data;
  
  stop
  
else (no - invalid)
  |System|
  :Show Validation Errors;
  
  |Initiating Party|
  :Correct Errors;
  
  backward :Submit Dispute;
endif

@enduml
```

## Key Design Decisions

### 1. Dispute Priority System
```
HIGH Priority:
- Fraud/misrepresentation
- Payment issues (>$5,000)
- Account suspension appeals

MEDIUM Priority:
- Quality issues
- Delivery delays
- Terms violations

LOW Priority:
- Minor disagreements
- Policy questions
```

### 2. Response Deadlines
- **Responding Party**: 48 hours to provide counter-statement
- **Additional Info Request**: 24 hours to respond
- **Enforcement Actions**: Immediate execution
- **Appeal Window**: 7 days from ruling issuance

### 3. Evidence Requirements
- **File Types**: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX
- **Max File Size**: 10MB per file
- **Max Total**: 50MB per dispute
- **Required**: At least one piece of evidence

### 4. Mediation vs. Ruling
```
Mediation Suitable For:
- Both parties acting in good faith
- Factual disputes (not policy violations)
- Amounts < $5,000
- No fraud/safety concerns

Direct to Ruling:
- Fraud suspected
- Clear policy violation
- Safety/legal concerns
- One party unresponsive
```

### 5. Enforcement Actions
```typescript
enum EnforcementAction {
  NO_ACTION = 'no_action',
  WARNING = 'warning',
  PARTIAL_REFUND = 'partial_refund',
  FULL_REFUND = 'full_refund',
  SUSPENSION_7_DAYS = 'suspension_7_days',
  SUSPENSION_30_DAYS = 'suspension_30_days',
  PERMANENT_BAN = 'permanent_ban',
  ACCOUNT_RESTRICTIONS = 'account_restrictions'
}
```

## Business Rules

1. **Filing Requirements**: Min 100 characters description + 1 evidence file
2. **Response Time**: 48 hours for responding party
3. **Admin SLA**: Target 72 hours for ruling (from all info received)
4. **Mediation Attempts**: Required for eligible cases
5. **Appeal Window**: 7 days from ruling date
6. **Appeal Limit**: Only one appeal per dispute
7. **Evidence Authenticity**: Admin can request original documents
8. **Legal Escalation**: Required for disputes >$10,000 or legal implications
9. **Enforcement**: Immediate upon ruling (unless appealed)
10. **Final Status**: No further action after appeal denial or 7-day window

## Related Diagrams
- **04_use_case_admin_context.md**: Admin dispute handling use cases
- **08_activity_negotiation_lifecycle.md**: Source of negotiation disputes
- **09_activity_purchase_intent_creation.md**: Source of intent disputes
- **19_class_domain_model_transaction.md**: AdminLog for audit trail
- **15_sequence_purchase_intent_flow.md**: Purchase intent conflicts

## Implementation Notes

### Dispute State Machine
```typescript
enum DisputeStatus {
  OPEN = 'open',
  AWAITING_RESPONSE = 'awaiting_response',
  UNDER_INVESTIGATION = 'under_investigation',
  IN_MEDIATION = 'in_mediation',
  MEDIATION_FAILED = 'mediation_failed',
  PENDING_RULING = 'pending_ruling',
  RESOLVED_MEDIATION = 'resolved_mediation',
  RESOLVED_RULING = 'resolved_ruling',
  UNDER_APPEAL = 'under_appeal',
  RESOLVED_APPEAL_GRANTED = 'resolved_appeal_granted',
  RESOLVED_APPEAL_DENIED = 'resolved_appeal_denied',
  RESOLVED_FINAL = 'resolved_final',
  DISMISSED = 'dismissed'
}
```

### Evidence Storage
```typescript
interface DisputeEvidence {
  id: string;
  dispute_id: string;
  uploaded_by: string; // user_id
  file_name: string;
  file_url: string; // S3 URL
  file_type: string;
  file_size: number;
  uploaded_at: Date;
  verified: boolean; // admin verified authenticity
}
```

### Enforcement Execution
```typescript
async executeEnforcement(ruling: DisputeRuling): Promise<void> {
  for (const action of ruling.enforcement_actions) {
    switch (action.type) {
      case EnforcementAction.FULL_REFUND:
        await this.paymentService.processRefund({
          amount: action.amount,
          user_id: action.target_user_id,
          reason: `Dispute ${ruling.dispute_id} ruling`
        });
        break;
        
      case EnforcementAction.SUSPENSION_30_DAYS:
        await this.userService.suspendUser({
          user_id: action.target_user_id,
          duration_days: 30,
          reason: ruling.ruling_text,
          suspended_by: ruling.admin_id
        });
        break;
        
      case EnforcementAction.PERMANENT_BAN:
        await this.userService.banUser({
          user_id: action.target_user_id,
          reason: ruling.ruling_text,
          banned_by: ruling.admin_id
        });
        break;
        
      case EnforcementAction.WARNING:
        await this.userService.addWarning({
          user_id: action.target_user_id,
          reason: ruling.ruling_text,
          issued_by: ruling.admin_id
        });
        break;
    }
    
    // Log each enforcement action
    await this.adminLogRepository.create({
      admin_user_id: ruling.admin_id,
      action_type: 'ENFORCE_DISPUTE_RULING',
      target_entity_type: 'USER',
      target_entity_id: action.target_user_id,
      details: action
    });
  }
}
```

## Performance Targets
- **Dispute Submission**: <2 seconds
- **Evidence Upload**: <5 seconds per file
- **Admin Dashboard Load**: <500ms (with 100+ open disputes)
- **Ruling Execution**: <10 seconds
- **Enforcement Actions**: <30 seconds
- **Email Notifications**: <5 seconds

## Error Scenarios

1. **Evidence Upload Fails**: Retry 3 times, allow continue without that file
2. **Email Notification Fails**: Retry via background job, log failure
3. **Enforcement Fails**: Rollback, flag for manual intervention
4. **Legal Team Unavailable**: Proceed with senior admin review only
5. **Payment Refund Fails**: Flag for finance team, manual processing
6. **Concurrent Updates**: Use database locks, prevent data conflicts

## Metrics & Analytics

Track the following:
- **Total Disputes**: Count by type, status, month
- **Resolution Time**: Average days from filing to resolution
- **Mediation Success Rate**: Resolved via mediation ÷ mediation attempts
- **Appeal Rate**: Appeals filed ÷ total rulings
- **Appeal Overturn Rate**: Appeals granted ÷ total appeals
- **Enforcement Compliance**: Actions completed ÷ actions ordered
- **Repeat Offenders**: Users with 2+ disputes (initiating or responding)
- **Dispute Categories**: Distribution of dispute types
- **Admin Performance**: Cases resolved per admin, average resolution time
