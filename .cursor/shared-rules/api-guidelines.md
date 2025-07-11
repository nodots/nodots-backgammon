# API Design Guidelines

## Branch Standards for APIs

- **DEPLOY FROM**: Always deploy API services from `main` branch only
- **STAGING**: Use feature branches for staging deployments, merge to `main` for production
- **ROLLBACK**: Maintain ability to rollback `main` branch deployments

## RESTful API Design

### HTTP Methods

- **GET**: Retrieve resources (idempotent)
- **POST**: Create new resources
- **PUT**: Update/replace entire resources (idempotent)
- **PATCH**: Partial updates
- **DELETE**: Remove resources (idempotent)

### Resource Naming

- Use nouns for resource names
- Use plural forms for collections
- Use hierarchical structure for relationships
- Keep URLs readable and intuitive

```
Good Examples:
GET /api/v1/games
GET /api/v1/games/123
POST /api/v1/games
PUT /api/v1/games/123
DELETE /api/v1/games/123
GET /api/v1/games/123/moves

Bad Examples:
GET /api/v1/getGames
POST /api/v1/createGame
GET /api/v1/game/123
```

### HTTP Status Codes

- **200 OK**: Successful GET, PUT, PATCH
- **201 Created**: Successful POST
- **204 No Content**: Successful DELETE
- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource conflict
- **500 Internal Server Error**: Server error

### API Versioning

- Use URL versioning: `/api/v1/`
- Maintain backward compatibility
- Document version changes
- Provide migration guides

## Request/Response Format

### JSON Structure

```json
{
  "data": {
    "id": "123",
    "type": "game",
    "attributes": {
      "status": "active",
      "currentPlayer": "player1"
    },
    "relationships": {
      "players": {
        "data": [
          { "id": "player1", "type": "player" },
          { "id": "player2", "type": "player" }
        ]
      }
    }
  },
  "meta": {
    "timestamp": "2025-07-05T21:15:00Z",
    "version": "v1"
  }
}
```

### Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid move: Cannot move to occupied point",
    "details": {
      "field": "move",
      "value": "invalid_move_data"
    }
  },
  "meta": {
    "timestamp": "2025-07-05T21:15:00Z",
    "request_id": "req-123"
  }
}
```

### Pagination

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 150,
    "total_pages": 8
  },
  "links": {
    "first": "/api/v1/games?page=1",
    "last": "/api/v1/games?page=8",
    "next": "/api/v1/games?page=2",
    "prev": null
  }
}
```

## Authentication and Authorization

### JWT Tokens

- Use Bearer token authentication
- Include necessary claims
- Implement proper token expiration
- Support token refresh

### API Keys

- Use for service-to-service communication
- Implement proper key rotation
- Monitor API key usage
- Implement rate limiting

### Permissions

- Implement role-based access control
- Use principle of least privilege
- Document permission requirements
- Implement proper authorization checks

## Data Validation

### Input Validation

- Validate all request data
- Use schema validation
- Provide clear error messages
- Sanitize input data

### Business Logic Validation

- Validate game rules
- Check resource ownership
- Verify state transitions
- Implement proper error handling

## Performance Optimization

### Caching

- Implement appropriate caching strategies
- Use ETags for conditional requests
- Cache frequently accessed data
- Implement cache invalidation

### Database Optimization

- Use appropriate indexes
- Optimize query performance
- Implement connection pooling
- Monitor database metrics

### Response Optimization

- Minimize response size
- Use compression when appropriate
- Implement field filtering
- Support partial responses

## API Documentation

### OpenAPI Specification

- Document all endpoints
- Include request/response examples
- Document authentication requirements
- Explain error responses

### Interactive Documentation

- Provide API playground
- Include code examples
- Document rate limits
- Provide SDKs when possible

## Rate Limiting

### Implementation

- Implement per-user rate limits
- Use sliding window algorithm
- Provide rate limit headers
- Implement proper error responses

### Rate Limit Headers

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1641024000
```

## Monitoring and Logging

### API Metrics

- Track request/response times
- Monitor error rates
- Track API usage patterns
- Implement health checks

### Logging

- Log all API requests
- Include request/response data
- Log errors with context
- Implement log aggregation

### Alerting

- Set up alerts for high error rates
- Monitor API availability
- Track performance degradation
- Implement automated responses

## Server Management

### API Server Lifecycle

- **CRITICAL**: Never manually restart the API server in nodots-backgammon-api
- The server runs with nodemon and automatically restarts when code changes are detected
- Do not use `kill-all-ports`, `start:dev:ssl`, or any manual restart commands
- The server will restart itself and show in the logs when it's ready
- Any attempt to manually restart causes port conflicts and crashes
- Let the automated restart process handle server lifecycle management

### Development Workflow

- Make code changes and save files
- Wait for nodemon to detect changes and restart automatically
- Check logs for confirmation that server is ready
- Only intervene if server fails to start (check logs for actual errors)

## Security Considerations

### Input Security

- Validate all inputs
- Prevent injection attacks
- Use parameterized queries
- Implement input sanitization

### Output Security

- Sanitize response data
- Prevent information leakage
- Implement proper CORS
- Use secure headers

### Communication Security

- Use HTTPS only
- Implement proper SSL/TLS
- Use secure cipher suites
- Implement HSTS headers
