# Activity Diagram - Supplier Onboarding & Verification

## Purpose
Detailed workflow showing the complete supplier registration, document submission, verification, and activation process. This diagram models both automated and manual steps, decision points, parallel processing, and error handling.

## Scope
- Account registration
- Company profile completion
- Document upload and validation
- Admin verification process
- Approval/rejection workflows
- Notification triggers
- Error and retry scenarios

## PlantUML Diagram

```plantuml
@startuml activity_supplier_onboarding
!define SUPPLIER_COLOR #C8E6C9
!define ADMIN_COLOR #FFECB3
!define SYSTEM_COLOR #E3F2FD

|Supplier|
start
:Visit Registration Page;
:Fill Basic Information
(Email, Password, Company Name);

:Submit Registration Form;

|System|
:Validate Form Data;

if (All Fields Valid?) then (yes)
  :Create User Account;
  :Generate Verification Token;
  :Send Verification Email;
  
  |Email Service|
  :Deliver Email with Link;
  
  |Supplier|
  :Receive Email;
  :Click Verification Link;
  
  |System|
  :Validate Token;
  
  if (Token Valid?) then (yes)
    :Mark Email as Verified;
    :Set Account Status = PENDING_PROFILE;
  else (no/expired)
    :Show Error Message;
    :Allow Resend Verification;
    stop
  endif
else (no)
  :Display Validation Errors;
  stop
endif

|Supplier|
:Login to Account;
:Navigate to Profile Setup;

partition "Company Profile Completion" #SUPPLIER_COLOR {
  :Enter Company Details:
  - Legal Name
  - Business Address
  - Phone, Website
  - Tax ID
  - Business Type;
  
  fork
    :Upload Business License
    (PDF, max 10MB);
  fork again
    :Upload Tax Registration
    Certificate;
  fork again
    :Upload Company Logo
    (PNG/JPG, max 2MB);
  end fork
  
  :Enter Bank Details
  (for future payments);
  
  :Select Business Categories
  (primary + secondary);
  
  :Set Company Description;
  
  :Review Profile Summary;
  
  :Submit for Verification;
}

|System|
partition "Automated Validation" #SYSTEM_COLOR {
  fork
    :Check Document Formats;
    if (Valid Formats?) then (yes)
    else (no)
      :Flag Invalid Documents;
      |Supplier|
      :Receive Error Notification;
      :Re-upload Documents;
      |System|
    endif
  fork again
    :Scan Documents for Malware;
  fork again
    :Extract Text via OCR;
    :Validate Tax ID Format;
  fork again
    :Check Business Name
    against Blacklist;
  end fork
  
  :Calculate Risk Score;
  
  if (Risk Score > Threshold?) then (high risk)
    :Flag for Enhanced Review;
    :Add to Priority Queue;
  else (normal)
    :Add to Standard Queue;
  endif
  
  :Update Application Status
  = PENDING_ADMIN_REVIEW;
  
  :Send Confirmation Email
  to Supplier;
}

|Admin|
:Receive New Application
Notification;

:Access Admin Dashboard;

:Select Application from Queue;

partition "Manual Verification" #ADMIN_COLOR {
  :Review Company Profile;
  
  :Verify Business License:
  - Check License Number
  - Verify Issuing Authority
  - Confirm Not Expired;
  
  :Verify Tax Documents:
  - Tax ID matches Company
  - Documents Not Expired;
  
  :Cross-check Business Info:
  - Google Search
  - Company Registry Lookup
  - Check Website Legitimacy;
  
  if (All Documents Valid?) then (yes)
    if (Additional Checks Needed?) then (yes)
      :Request More Documents;
      
      |System|
      :Send Document Request Email;
      
      |Supplier|
      :Receive Request;
      :Upload Additional Docs;
      
      |System|
      :Notify Admin;
      
      |Admin|
      :Review New Documents;
    else (no)
    endif
    
    :Make Approval Decision;
    
    if (Approve Supplier?) then (yes)
      :Click Approve Button;
      :Enter Approval Notes;
      
      |System|
      fork
        :Update Supplier Status
        = VERIFIED;
      fork again
        :Set Account Active;
      fork again
        :Create Admin Log Entry;
      fork again
        :Trigger Approval Email;
      fork again
        :Update Analytics;
      end fork
      
      |Email Service|
      :Send Welcome Email
      with Next Steps;
      
      |Supplier|
      :Receive Approval Email;
      :Login to Active Account;
      :Begin Product Upload;
      
      stop
      
    else (no - reject)
      :Click Reject Button;
      :Enter Rejection Reason;
      
      |System|
      fork
        :Update Application Status
        = REJECTED;
      fork again
        :Create Admin Log Entry;
      fork again
        :Trigger Rejection Email;
      end fork
      
      |Email Service|
      :Send Rejection Email
      with Reason;
      
      |Supplier|
      :Receive Rejection;
      
      note right
        Supplier can:
        1. Fix issues and re-apply
        2. Contact support
        3. Appeal decision
      end note
      
      stop
    endif
    
  else (no - invalid/suspicious)
    :Flag Application;
    :Mark as Fraudulent/Incomplete;
    
    if (Fraud Suspected?) then (yes)
      :Report to Fraud Team;
      :Blacklist Company;
      
      |System|
      :Ban Email and Tax ID;
      
      stop
    else (incomplete)
      :Request Additional Information;
      
      |System|
      :Send Info Request Email;
      
      |Supplier|
      :Provide Additional Info;
      
      backward :Re-enter Review Queue;
      
      |Admin|
    endif
  endif
}

|System|
partition "Post-Approval Activation" {
  :Enable Supplier Dashboard;
  :Activate Product Upload;
  :Enable Negotiation Features;
  :Add to Search Index;
  
  :Schedule Re-verification
  (in 365 days);
}

|Supplier|
:Complete Onboarding;

stop

@enduml
```

## Key Design Decisions

### 1. Two-Phase Verification
- **Phase 1**: Automated checks (format, malware, OCR, blacklist)
- **Phase 2**: Manual admin review (document authenticity, business legitimacy)

This hybrid approach balances speed (automated) with accuracy (human review).

### 2. Email Verification First
Confirms supplier can receive critical communications before investing time in profile completion. Prevents spam registrations.

### 3. Parallel Document Processing
Multiple documents uploaded and processed simultaneously to reduce onboarding time from hours to minutes.

### 4. Risk-Based Prioritization
- **High Risk**: Enhanced checks, priority admin review
- **Normal Risk**: Standard review queue
Risk scoring based on: country, industry, document quality, email domain

### 5. Comprehensive Error Handling
- Invalid formats → Clear error messages + re-upload
- Incomplete docs → Request specific missing items
- Fraud detection → Permanent ban with blacklisting
- System errors → Retry logic + admin notification

### 6. Audit Trail at Every Step
All state changes logged:
- Who approved/rejected
- When decision made
- Why (admin notes)
- IP address and user agent

## Business Rules Implemented

### Validation Rules
1. **Email**: Must be unique, valid format, not disposable domain
2. **Business License**: PDF only, <10MB, must contain license number
3. **Tax ID**: Format varies by country, validated via regex
4. **Company Name**: No profanity, not on blacklist, >3 characters
5. **Phone**: Valid international format (E.164)

### Document Requirements
- **Mandatory**: Business License, Tax Registration
- **Optional**: Certifications (ISO, trade licenses)
- **Formats**: PDF for documents, PNG/JPG for images
- **Sizes**: Documents <10MB, images <2MB

### Timing Rules
- **Email Verification**: Token expires in 24 hours
- **Admin Review SLA**: 48 hours from submission
- **Document Request**: Supplier has 7 days to respond
- **Re-verification**: Annual for all suppliers

### Approval Criteria
Suppliers must meet ALL criteria:
- ✅ Valid business license from recognized authority
- ✅ Tax registration matches company name
- ✅ Website exists and appears legitimate
- ✅ No match on fraud/blacklist databases
- ✅ Business type allowed on platform (no banned industries)

## Enterprise Considerations

### Scalability
- **Async Processing**: Document OCR and virus scanning run in background jobs
- **Queue Management**: Separate queues for high/normal risk applications
- **Auto-scaling**: Document processing workers scale based on queue depth
- **Caching**: Common data (country codes, blacklists) cached in Redis

### Security
- **Document Storage**: S3/GCS with encryption at rest
- **Virus Scanning**: ClamAV or cloud service (AWS S3 Glacier)
- **PII Protection**: Tax IDs and bank details encrypted
- **Admin Access**: Two-factor authentication required for approval actions
- **Audit Logging**: Immutable logs stored in separate database

### Performance
- **Target Metrics**:
  - Registration form submission: <2 seconds
  - Document upload: <10 seconds per document
  - Automated validation: <30 seconds
  - Admin review (manual): <48 hours
- **Optimization**:
  - Parallel document processing
  - Pre-signed upload URLs (direct to S3)
  - Background job processing
  - Admin dashboard pagination (50 applications per page)

### Compliance
- **GDPR**: Supplier can download all submitted data
- **Data Retention**: Rejected applications deleted after 90 days
- **Right to Erasure**: Supplier can request account deletion
- **Consent**: Clear opt-ins for email communications
- **Audit Trail**: 7-year retention for approved suppliers (regulatory)

### User Experience
- **Progress Indicator**: Show completion percentage
- **Auto-save**: Profile data saved as supplier types
- **Helpful Errors**: "Tax ID must be 9 digits" vs. "Invalid input"
- **Estimated Timeline**: "Review typically completes in 2 business days"
- **Support Contact**: Prominent help button throughout flow

## Error Scenarios & Recovery

### 1. Email Delivery Failure
- **Detection**: Bounce notification from email service
- **Action**: Show in-app message, allow manual verification
- **Prevention**: Validate MX records before accepting registration

### 2. Document Upload Failure
- **Detection**: Timeout or network error
- **Action**: Auto-retry 3 times, show progress, allow resume
- **Prevention**: Chunked upload for large files

### 3. OCR Extraction Failure
- **Detection**: No text extracted from PDF
- **Action**: Flag for manual review, don't auto-reject
- **Prevention**: Validate PDFs are text-based, not scanned images

### 4. Admin Unavailable (Sick Day, Vacation)
- **Detection**: SLA breach alert after 48 hours
- **Action**: Escalate to senior admin, notify admin manager
- **Prevention**: Multiple admins trained, workload distribution

### 5. Duplicate Application
- **Detection**: Same email or Tax ID already in system
- **Action**: Show error, offer password reset, link to existing account
- **Prevention**: Check database before allowing registration

## Metrics & Monitoring

### KPIs
- **Registration Completion Rate**: % who complete profile after starting
- **Verification Approval Rate**: % applications approved
- **Time to Approval**: Median time from submission to decision
- **Document Quality Score**: % requiring additional documents
- **Fraud Detection Rate**: % flagged applications confirmed fraudulent

### Alerts
- **SLA Breach**: Admin hasn't reviewed application >48 hours
- **Fraud Spike**: >10% of applications flagged in 24 hours
- **System Errors**: >5% document upload failures
- **Queue Backlog**: >100 applications in pending state

## Related Diagrams
- **02_use_case_supplier_context.md**: Supplier use cases
- **04_use_case_admin_context.md**: Admin verification use cases
- **22_state_machine_supplier_verification.md**: Supplier status lifecycle
- **17_class_domain_model_core.md**: Supplier entity definition

## Implementation Notes

### Technology Stack
- **Backend**: Node.js/Python for async job processing
- **Storage**: S3/GCS for documents, PostgreSQL for metadata
- **OCR**: Tesseract, Google Vision API, AWS Textract
- **Email**: SendGrid, AWS SES with delivery tracking
- **Queue**: Redis Queue (RQ), Celery, or AWS SQS
- **Virus Scanning**: ClamAV, AWS S3 antivirus

### Database Schema Impact
Tables involved:
- `users` (account creation)
- `suppliers` (profile data)
- `supplier_documents` (uploaded files)
- `verification_requests` (admin queue)
- `admin_logs` (audit trail)
- `email_verifications` (token storage)

### API Endpoints
- `POST /api/auth/register` - Create account
- `POST /api/auth/verify-email` - Verify token
- `POST /api/supplier/profile` - Save profile data
- `POST /api/supplier/documents` - Upload documents
- `GET /api/admin/verification-queue` - List pending applications
- `POST /api/admin/verify-supplier/:id/approve` - Approve supplier
- `POST /api/admin/verify-supplier/:id/reject` - Reject supplier

## Future Enhancements
1. **AI Document Verification**: ML model to detect fake documents
2. **Video KYB**: Video call verification for high-value suppliers
3. **Instant Verification**: For suppliers with verified business accounts (Google My Business, etc.)
4. **Referral Fast-Track**: Existing suppliers can vouch for new suppliers
5. **Tiered Verification**: Basic → Standard → Premium based on verification depth
