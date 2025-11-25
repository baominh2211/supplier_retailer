# Activity Diagram - Search and Discovery

## Purpose
Complete workflow showing how shops search for suppliers, apply filters, compare options, and view detailed profiles to make informed sourcing decisions.

## Scope
- Keyword search with autocomplete
- Multi-criteria filtering
- Search result ranking and sorting
- Supplier comparison
- Profile viewing with analytics tracking

## PlantUML Diagram

```plantuml
@startuml activity_search_and_discovery

|Shop User|
start
:Land on Platform Homepage;

partition "Search Initiation" {
  :Enter Search Query in Search Bar;
  
  |Frontend|
  :Debounce Input (300ms);
  
  if (Query Length >= 3?) then (yes)
    :Show Autocomplete Suggestions;
    
    |Backend|
    :Query Elasticsearch for Suggestions;
    :Return Top 10 Matches;
    
    |Frontend|
    :Display Suggestions Dropdown;
    
    |Shop User|
    
    if (Select Suggestion?) then (yes)
      :Click on Suggestion;
      :Auto-fill Search Box;
    else (no)
      :Continue Typing;
    endif
    
  endif
  
  |Shop User|
  :Press Enter / Click Search Button;
}

partition "Search Execution" {
  |Frontend|
  :Build Search Request:
  - Query text
  - Page number
  - Filters (if any);
  
  :Send GET /api/suppliers/search;
  
  |Backend API|
  :Receive Search Request;
  :Validate Parameters;
  :Generate Cache Key;
  
  |Redis Cache|
  :Check Cache;
  
  if (Cache Hit?) then (yes)
    :Return Cached Results;
    
    note right
      Cache TTL: 5 minutes
      Reduces load on
      search engine
    end note
    
    |Backend API|
    :(Skip search execution);
    
  else (no - cache miss)
    |Backend API|
    :Forward to Search Engine;
    
    |Elasticsearch|
    fork
      :Tokenize Query;
      :Apply Fuzzy Matching;
      :Search company_name field;
    fork again
      :Search description field;
    fork again
      :Search product names;
    end fork
    
    :Combine Scores (weighted);
    :Apply Business Rules:
    - Only verified suppliers
    - Only active suppliers;
    
    :Sort by Relevance Score;
    :Paginate Results (20 per page);
    
    |Backend API|
    :Receive Supplier IDs + Scores;
    
    |PostgreSQL|
    :Fetch Full Supplier Records;
    :Include: rating, product_count, 
    location, certifications;
    
    |Backend API|
    :Merge Search Scores with Data;
    :Format Response;
    :Store in Cache (5 min TTL);
  endif
  
  |Frontend|
  :Receive Search Results;
  :Render Results Grid;
}

partition "Filter Application" {
  |Shop User|
  :View Search Results;
  :Click "Filters" Panel;
  
  |Frontend|
  :Display Available Filters:
  - Location/Country
  - Product Category
  - MOQ Range
  - Price Range
  - Certifications
  - Rating (1-5 stars);
  
  |Shop User|
  :Select Filter: "Country = USA";
  
  |Frontend|
  :Update URL Parameters;
  :Add Filter to Search Request;
  
  |Backend API|
  :Rebuild Query with Filter;
  
  note right
    Filters applied as
    Elasticsearch bool queries:
    - must (AND)
    - should (OR)
    - must_not (NOT)
  end note
  
  |Elasticsearch|
  :Apply Country Filter;
  :Re-score Results;
  :Return Filtered Set;
  
  |Frontend|
  :Update Results Display;
  :Show Active Filters as Tags;
  
  |Shop User|
  
  repeat
    :Add Another Filter?;
    
    |Frontend|
    :Apply Additional Filter;
    :Re-execute Search;
    :Update Results;
    
  repeat while (More filters?) is (yes)
  ->no;
}

partition "Sorting & Pagination" {
  |Shop User|
  :Select Sort Option:
  - Relevance (default)
  - Rating (high to low)
  - Newest First
  - A-Z;
  
  |Frontend|
  :Update Sort Parameter;
  :Re-execute Search;
  
  |Backend API|
  :Apply Sort Order;
  
  |Frontend|
  :Refresh Results with New Order;
  
  |Shop User|
  :Scroll to Bottom of Page;
  
  if (More Results Available?) then (yes)
    :Click "Load More" / Auto-load;
    
    |Frontend|
    :Increment Page Number;
    :Request Next Page;
    
    |Backend API|
    :Fetch Next 20 Results;
    
    |Frontend|
    :Append to Existing Results;
    :Update "Showing X of Y" counter;
    
  endif
}

partition "Supplier Profile View" {
  |Shop User|
  :Click on Supplier Card;
  
  |Frontend|
  :Navigate to /suppliers/:id;
  
  |Backend API|
  :Fetch Supplier Details;
  
  fork
    |PostgreSQL|
    :Get Supplier Profile;
  fork again
    |PostgreSQL|
    :Get Product List (first 20);
  fork again
    |PostgreSQL|
    :Get Reviews & Ratings;
  fork again
    |PostgreSQL|
    :Get Response Time Stats;
  fork again
    |PostgreSQL|
    :Get Certifications;
  end fork
  
  |Backend API|
  :Aggregate All Data;
  :Format Profile Response;
  
  fork
    :Log View Event (Analytics);
  fork again
    :Increment Supplier View Count;
  end fork
  
  |Frontend|
  :Render Supplier Profile Page:
  - Company Info
  - Product Catalog
  - Reviews
  - Certifications
  - Contact Options;
  
  |Shop User|
  :Browse Profile;
  
  partition "Profile Actions" {
    
    if (Interested in Supplier?) then (yes)
      
      :Select Action;
      
      if (Add to Favorites?) then (yes)
        |Backend API|
        :Save to Favorites;
        
        |Frontend|
        :Show "Added to Favorites" ✓;
        
      else if (Start Negotiation?) then (yes)
        :Redirect to Negotiation Flow;
        
        note right
          Links to:
          08_activity_negotiation_lifecycle.md
        end note
        
        stop
        
      else if (View Products?) then (yes)
        :Scroll to Product Section;
        :Browse Product Catalog;
        
      else (Download Catalog)
        |Backend API|
        :Generate PDF Catalog;
        
        |Frontend|
        :Trigger Download;
      endif
      
    else (no)
      :Go Back to Search Results;
      
      backward :View Search Results;
    endif
  }
}

partition "Supplier Comparison" {
  |Shop User|
  :Select Multiple Suppliers (up to 5);
  
  |Frontend|
  :Show "Compare" Button;
  :Display Selected Count (X/5);
  
  |Shop User|
  :Click "Compare Selected";
  
  if (Selected Count <= 5?) then (yes)
    |Frontend|
    :Navigate to Comparison View;
    
    |Backend API|
    fork
      :Fetch Supplier 1 Data;
    fork again
      :Fetch Supplier 2 Data;
    fork again
      :Fetch Supplier 3 Data;
    fork again
      :Fetch Supplier N Data;
    end fork
    
    :Aggregate Comparison Metrics;
    
    |Frontend|
    :Render Side-by-Side Table:
    - Company Name
    - Rating
    - MOQ Range
    - Lead Time
    - Certifications
    - Product Count
    - Response Time;
    
    :Highlight Differences;
    :Mark Best Values (green);
    
    |Shop User|
    :Review Comparison;
    
    if (Select Winner?) then (yes)
      :Click on Preferred Supplier;
      :Navigate to Their Profile;
    else (no)
      :Refine Selection;
      :Return to Search;
    endif
    
  else (no - too many)
    |Frontend|
    :Show Error: "Max 5 suppliers";
    
    |Shop User|
    :Deselect Some Suppliers;
    
    backward :Select Multiple Suppliers;
  endif
}

partition "Save Search" {
  |Shop User|
  
  if (Want to Save Search?) then (yes)
    :Click "Save This Search";
    
    |Frontend|
    :Show Modal: "Name this search";
    
    |Shop User|
    :Enter Search Name;
    :Enable/Disable Alert Notifications;
    
    |Backend API|
    :Save Search Criteria:
    - Query
    - Filters
    - Alert Preference;
    
    |Frontend|
    :Confirm "Search Saved";
    
    note right
      Saved searches appear
      in "My Searches"
      Quick access for
      repeat procurement
    end note
    
  endif
}

stop

@enduml
```

## Key Design Decisions

### 1. Search Performance Optimization
- **Debouncing**: 300ms delay prevents excessive API calls
- **Caching**: 5-minute TTL for identical searches
- **Pagination**: Load 20 results initially, infinite scroll for more
- **Index Optimization**: Elasticsearch with proper field mappings

### 2. Autocomplete Strategy
- **Minimum Characters**: 3 characters before showing suggestions
- **Suggestion Types**: 
  - Supplier names (weighted 3x)
  - Product names (weighted 2x)
  - Categories (weighted 1x)
- **Limit**: Top 10 suggestions only
- **Performance**: <100ms response time target

### 3. Filtering Architecture
- **Client-side State**: Filters maintained in URL parameters
- **Multiple Filters**: AND logic between different filter types
- **Dynamic Facets**: Show filter counts (e.g., "USA (127)")
- **Progressive Disclosure**: Common filters shown first

### 4. Search Ranking Algorithm
```
Score = (
  name_match * 3.0 +
  description_match * 1.5 +
  product_match * 2.0 +
  category_match * 1.0
) * boost_factors

Boost factors:
- Verified suppliers: 1.5x
- High rating (>4.5): 1.3x
- Fast response time (<2hrs): 1.2x
- Recently active: 1.1x
```

### 5. Analytics Tracking
Every action logged for:
- **Search Queries**: Track popular searches
- **Filter Usage**: Understand buyer preferences
- **Profile Views**: Supplier visibility metrics
- **Comparison**: Which suppliers compared together
- **Conversion**: Search → View → Negotiate path

## Business Rules

1. **Only Verified Suppliers**: Unverified suppliers hidden from search
2. **Active Products Only**: Suppliers with no active products ranked lower
3. **Comparison Limit**: Maximum 5 suppliers for usability
4. **Favorite Limit**: Maximum 100 favorites per shop
5. **Search History**: Keep last 50 searches per user
6. **Cache Invalidation**: Clear cache when supplier updates profile
7. **Rate Limiting**: Max 100 searches per hour per user

## Related Diagrams
- **03_use_case_shop_context.md**: Shop search use cases
- **12_sequence_supplier_search.md**: Search sequence details
- **17_class_domain_model_core.md**: Supplier and Product entities

## Implementation Notes

### Elasticsearch Mapping
```json
{
  "supplier": {
    "properties": {
      "company_name": {
        "type": "text",
        "analyzer": "standard",
        "fields": {
          "keyword": {"type": "keyword"},
          "ngram": {"type": "text", "analyzer": "ngram_analyzer"}
        }
      },
      "description": {"type": "text"},
      "country": {"type": "keyword"},
      "rating_average": {"type": "float"},
      "is_verified": {"type": "boolean"},
      "product_count": {"type": "integer"}
    }
  }
}
```

### Cache Strategy
```javascript
// Cache key generation
const cacheKey = `search:${hash({
  query,
  filters,
  sort,
  page
})}`;

// Check cache first
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

// Execute search
const results = await elasticsearch.search(...);

// Store in cache
await redis.setex(cacheKey, 300, JSON.stringify(results));
```

### Filter Query Building
```javascript
const mustClauses = [];
const filterClauses = [];

// Text search
if (query) {
  mustClauses.push({
    multi_match: {
      query,
      fields: ['company_name^3', 'description^1.5', 'products.name^2']
    }
  });
}

// Filters
if (country) filterClauses.push({term: {country}});
if (minRating) filterClauses.push({range: {rating_average: {gte: minRating}}});

// Always filter verified suppliers
filterClauses.push({term: {is_verified: true}});

const esQuery = {
  bool: {
    must: mustClauses,
    filter: filterClauses
  }
};
```

## Performance Targets
- **Search Response**: <200ms (cached), <500ms (uncached)
- **Autocomplete**: <100ms
- **Profile Load**: <300ms
- **Comparison Load**: <500ms (5 suppliers)
- **Filter Application**: <200ms

## Error Scenarios

1. **Elasticsearch Down**: Fallback to PostgreSQL full-text search
2. **No Results**: Show "Try broader search" suggestions
3. **Timeout**: Show partial results with "Load more" option
4. **Cache Miss**: Transparent fallback to fresh search
5. **Invalid Filters**: Ignore invalid filters, log for debugging
