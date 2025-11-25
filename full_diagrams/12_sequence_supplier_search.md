# Sequence Diagram - Supplier Search

## Purpose
Show search execution with caching, filtering, and pagination.

## PlantUML Diagram

```plantuml
@startuml sequence_supplier_search

actor "Shop User" as User
participant "Frontend" as FE
participant "Backend API" as API
participant "Redis Cache" as Redis
participant "Elasticsearch" as ES
participant "PostgreSQL" as DB

== Search Request ==

User -> FE: Enter query "LED bulbs"
FE -> FE: Debounce 300ms
FE -> API: GET /api/suppliers/search\n?q=led+bulbs&page=1&country=USA
API -> API: Validate parameters
API -> API: Generate cache key\nhash(query+filters+page)

API -> Redis: GET search:cache_key
alt Cache Hit
    Redis --> API: Cached results
    API --> FE: 200 OK {results, cached: true}
    FE --> User: Display results
else Cache Miss
    API -> ES: POST /_search\n{query, filters, from: 0, size: 20}
    ES -> ES: Tokenize "LED bulbs"
    ES -> ES: Apply scoring algorithm
    ES -> ES: Filter: is_verified=true
    ES -> ES: Filter: country=USA
    ES --> API: {hits: [id1, id2, ...], scores}
    
    API -> DB: SELECT * FROM suppliers\nWHERE id IN (ids)\nORDER BY score DESC
    DB --> API: Full supplier records
    
    API -> API: Merge scores with data
    API -> API: Format response
    API -> Redis: SETEX cache_key 300\n(5 min TTL)
    API --> FE: 200 OK {results, total, page_info}
end

FE -> FE: Render supplier cards
FE --> User: Display search results

== Apply Additional Filter ==

User -> FE: Select "Rating > 4 stars"
FE -> API: GET /api/suppliers/search\n?q=led+bulbs&country=USA&min_rating=4
API -> API: New cache key (different filters)
API -> Redis: GET new_cache_key (miss)
API -> ES: Search with additional filter
ES --> API: Filtered results
API -> DB: Fetch records
DB --> API: Suppliers
API -> Redis: Cache new results
API --> FE: Updated results
FE --> User: Display filtered results

== Pagination ==

User -> FE: Scroll to bottom / Click "Load More"
FE -> API: GET /api/suppliers/search\n?q=led+bulbs&page=2
API -> Redis: Check cache (miss for page 2)
API -> ES: Search with from: 20, size: 20
ES --> API: Next page results
API -> DB: Fetch records
DB --> API: Suppliers
API --> FE: Page 2 results
FE -> FE: Append to existing results
FE --> User: Show more suppliers

@enduml
```

## Links to: 07_activity_search_and_discovery.md, 03_use_case_shop_context.md
