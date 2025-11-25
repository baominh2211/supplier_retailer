# Activity Diagram - Product Management

## Purpose
Detailed workflow for suppliers to create, update, bulk upload, and manage products throughout their lifecycle.

## Scope
- Single product creation
- Bulk product upload via CSV
- Product updates and modifications
- Stock management
- Product deactivation

## PlantUML Diagram

```plantuml
@startuml activity_product_management

|Supplier|
start
:Navigate to Product Management;

note right
  Entry point for all
  product operations
end note

partition "Product Creation Flow" {
  :Click "Add New Product";
  :Select Product Category;
  
  |System|
  :Load Category Attributes Schema;
  :Generate Form with Dynamic Fields;
  
  |Supplier|
  :Enter Product Details:
  - Name
  - Description
  - Brand, Model
  - SKU;
  
  fork
    :Upload Main Image;
    |System|
    :Validate Image Format;
    :Resize & Optimize;
    :Upload to S3;
  fork again
    |Supplier|
    :Upload Additional Images (up to 10);
    |System|
    :Process Images in Parallel;
  end fork
  
  |Supplier|
  :Set Pricing Information:
  - Unit Price
  - Currency
  - MOQ;
  
  :Define Bulk Pricing Tiers (Optional);
  
  :Enter Specifications (JSONB):
  - Dimensions
  - Weight
  - Material
  - Color variants;
  
  :Set Inventory:
  - Stock Quantity
  - Lead Time;
  
  :Review Product Preview;
  
  :Submit Product;
  
  |System|
  :Validate All Fields;
  
  if (All Required Fields Valid?) then (yes)
    :Generate Unique SKU (if not provided);
    :Calculate Quality Score;
    
    fork
      :Save to PostgreSQL;
    fork again
      :Index in Elasticsearch;
    fork again
      :Generate Thumbnail Images;
    fork again
      :Update Supplier Product Count;
    end fork
    
    :Set Status = Active;
    
    |Supplier|
    :Show Success Message;
    :Display Product in Catalog;
    
  else (no)
    |System|
    :Collect Validation Errors;
    
    |Supplier|
    :Display Error Messages;
    
    backward :Correct Errors;
  endif
}

partition "Bulk Upload Flow" {
  |Supplier|
  :Click "Bulk Upload";
  
  |System|
  :Generate Download Link for Template;
  
  |Supplier|
  :Download CSV/Excel Template;
  :Fill Product Data Offline;
  :Upload Completed File;
  
  |System|
  :Validate File Format;
  
  if (Valid Format?) then (yes)
    :Parse File;
    :Extract Rows;
    
    fork
      :Validate Row 1;
    fork again
      :Validate Row 2;
    fork again
      :Validate Row 3;
    fork again
      :Validate Row N;
    end fork
    
    :Collect Validation Results;
    
    :Check for Duplicate SKUs;
    
    :Generate Validation Report:
    - Total Rows
    - Valid Rows
    - Invalid Rows
    - Errors per Row;
    
    |Supplier|
    :Review Validation Report;
    
    if (Accept Results?) then (yes)
      |System|
      
      fork
        :Insert Valid Products (Batch);
      fork again
        :Index in Elasticsearch (Batch);
      fork again
        :Update Statistics;
      end fork
      
      :Generate Import Summary;
      
      |Supplier|
      :View Import Summary:
      - X products imported
      - Y products skipped
      - Download error log;
      
    else (no)
      :Cancel Import;
      :Delete Temp Data;
    endif
    
  else (no)
    |System|
    :Show Format Error;
    
    |Supplier|
    :Re-upload Correct File;
    
    backward :Upload Completed File;
  endif
}

partition "Product Update Flow" {
  |Supplier|
  :Search/Browse Products;
  :Select Product to Edit;
  
  |System|
  :Load Product Data;
  
  |Supplier|
  :View Product Details;
  
  :Click "Edit Product";
  
  :Modify Fields:
  - Price
  - Stock
  - Description
  - Images;
  
  |System|
  :Detect Changed Fields;
  
  if (Price Changed by >20%?) then (yes)
    :Flag for Admin Review;
    
    note right
      Prevent price manipulation
      for products with active
      negotiations
    end note
    
    :Check Active Negotiations;
    
    if (Active Negotiations Exist?) then (yes)
      |Supplier|
      :Show Warning Message;
      
      if (Confirm Price Change?) then (yes)
        |System|
        :Notify Shops with Active Negotiations;
        :Update Price;
      else (no)
        :Cancel Update;
        stop
      endif
      
    else (no)
      :Update Price Immediately;
    endif
    
  else (no)
    :Update Immediately;
  endif
  
  |System|
  :Save Changes;
  :Update Search Index;
  :Log Change in Audit Trail;
  
  fork
    :Notify Shops with Product in Favorites;
  fork again
    :Update Product Version;
  end fork
  
  |Supplier|
  :Show Success Message;
  :Display Updated Product;
}

partition "Stock Management Flow" {
  |Supplier|
  :Navigate to Inventory;
  :Select Product;
  :Enter New Stock Quantity;
  
  |System|
  :Validate Quantity (>= 0);
  
  if (Quantity = 0?) then (yes)
    :Set Availability = Out of Stock;
    :Update Search Index (hide from results);
  else (no)
    :Set Availability = In Stock;
  endif
  
  :Update Stock Quantity;
  :Set Last Updated Timestamp;
  
  if (Quantity < Low Stock Threshold?) then (yes)
    :Send Low Stock Alert to Supplier;
  endif
  
  |Supplier|
  :Confirm Stock Updated;
}

partition "Product Deactivation Flow" {
  |Supplier|
  :Select Product;
  :Click "Deactivate";
  
  |System|
  :Check for Active Negotiations;
  
  if (Active Negotiations Exist?) then (yes)
    :Show Warning:
    "X active negotiations
    will be affected";
    
    |Supplier|
    :Select Deactivation Reason;
    
    if (Confirm Deactivation?) then (yes)
      |System|
      :Set Status = Inactive;
      :Remove from Search Index;
      
      fork
        :Notify Shops with Active Negotiations;
      fork again
        :Notify Shops with Product in Favorites;
      fork again
        :Log Deactivation Event;
      end fork
      
      |Supplier|
      :Show Confirmation;
      
    else (no)
      :Cancel Deactivation;
      stop
    endif
    
  else (no)
    :Set Status = Inactive;
    :Remove from Search Index;
    :Log Event;
    
    |Supplier|
    :Show Confirmation;
  endif
}

stop

@enduml
```

## Key Design Decisions

### 1. Image Processing
- **Parallel Upload**: Multiple images processed simultaneously
- **Auto-Optimization**: Images resized and compressed
- **S3 Storage**: CDN-friendly storage for fast delivery
- **Thumbnail Generation**: Background job creates multiple sizes

### 2. Bulk Upload Validation
- **Pre-Import Validation**: Check all rows before inserting any
- **Batch Processing**: Insert valid products in single transaction
- **Error Reporting**: Detailed error log with row numbers
- **Duplicate Detection**: Check SKU uniqueness across all rows

### 3. Price Change Protection
- **Threshold Alert**: >20% price change requires confirmation
- **Negotiation Check**: Prevent changes during active negotiations
- **Shop Notification**: Alert affected shops of price changes
- **Admin Flag**: Large price increases reviewed for fraud

### 4. Stock Management
- **Low Stock Alerts**: Automatic notifications below threshold
- **Availability Auto-Update**: Out of stock products hidden from search
- **Real-time Updates**: Search index updated immediately
- **Audit Trail**: All stock changes logged with timestamp

### 5. Deactivation Safety
- **Impact Warning**: Show count of affected negotiations and favorites
- **Reason Required**: Track why products are deactivated
- **Graceful Handling**: Notify affected shops, don't break negotiations
- **Reversible**: Products can be reactivated later

## Business Rules

1. **SKU Uniqueness**: System-wide unique constraint
2. **MOQ Minimum**: Must be at least 1
3. **Price Positive**: Unit price must be > 0
4. **Image Limit**: Maximum 10 images per product
5. **Bulk Upload Limit**: Maximum 1,000 products per batch
6. **Category Required**: Every product must belong to a category
7. **Price Change Notification**: >20% change notifies favorite shops
8. **Deactivation**: Removes from search but preserves data

## Related Diagrams
- **02_use_case_supplier_context.md**: Product management use cases
- **17_class_domain_model_core.md**: Product entity definition
- **12_sequence_supplier_search.md**: How products appear in search

## Implementation Notes

### Database Transactions
```sql
BEGIN;
  INSERT INTO products (...) VALUES (...);
  UPDATE suppliers SET total_products = total_products + 1 WHERE id = ?;
  -- Index in Elasticsearch (async)
COMMIT;
```

### Bulk Upload Performance
- Use COPY command for PostgreSQL (10x faster than INSERT)
- Batch Elasticsearch indexing (bulk API)
- Process images asynchronously in background jobs
- Limit concurrent uploads to 3 per supplier

### Search Index Updates
```javascript
// Immediate update for critical fields
if (priceChanged || stockChanged || activeChanged) {
  await elasticsearch.update(productId, changes);
}

// Batch update for non-critical fields (every 5 minutes)
if (descriptionChanged || imageChanged) {
  queueForBatchIndex(productId);
}
```

## Error Scenarios

1. **Image Upload Failure**: Retry 3 times, then allow save without image
2. **Elasticsearch Down**: Save to DB, queue for index when service recovers
3. **Duplicate SKU**: Show error, suggest auto-generated SKU
4. **Invalid Category**: Show error, provide category selector
5. **Bulk Upload Timeout**: Process in chunks of 100, show progress

## Performance Targets
- **Single Product Create**: <2 seconds
- **Bulk Upload (1000 products)**: <30 seconds validation, <5 minutes import
- **Product Update**: <1 second
- **Stock Update**: <500ms
- **Image Upload**: <3 seconds per image
