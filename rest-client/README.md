# REST Client Files

This folder contains HTTP request files for testing the JazaCV API endpoints.

## Usage

### VS Code REST Client Extension

1. Install the [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) extension in VS Code
2. Open any `.http` file in this folder
3. Click "Send Request" above each request to test it

### Insomnia / Postman

You can import these files or manually add the endpoints to your API client.

## Files

- `auth.http` - Authentication endpoints (register, login, refresh, password reset)
- `resumes.http` - Resume CRUD operations
- `templates.http` - Template management
- `ai.http` - AI-powered features (rewrite, improve, generate summary, suggest skills)
- `payments.http` - Stripe payment and subscription endpoints
- `admin.http` - Admin-only endpoints for managing users, resumes, templates, and subscriptions

## Setup

1. **Update Variables**: Edit the variables at the top of each file:
   ```http
   @baseUrl = http://localhost:3000
   @token = your-jwt-token-here
   ```

2. **Get Authentication Token**:
   - First, register or login using `auth.http`
   - Copy the `accessToken` from the response
   - Replace `{{token}}` in other files

3. **For Admin Endpoints**:
   - You need a user with `isAdmin: true`
   - Login with an admin account
   - Use the token in `admin.http` requests

## Example Workflow

1. **Register a new user** (`auth.http`):
   ```http
   POST {{baseUrl}}/auth/register
   ```

2. **Login** (`auth.http`):
   ```http
   POST {{baseUrl}}/auth/login
   ```
   Copy the `accessToken` from response

3. **Update token variable** in all files:
   ```http
   @token = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

4. **Get templates** (`templates.http`):
   ```http
   GET {{baseUrl}}/templates
   Authorization: Bearer {{token}}
   ```

5. **Create a resume** (`resumes.http`):
   ```http
   POST {{baseUrl}}/resumes
   Authorization: Bearer {{token}}
   ```

6. **Use AI features** (`ai.http`):
   ```http
   POST {{baseUrl}}/ai/rewrite
   Authorization: Bearer {{token}}
   ```

## Environment Variables

For production/testing, update the base URL:
```http
@baseUrl = https://api.jazacv.com/api
```

## Rate Limiting

- AI endpoints are rate limited to **10 requests per minute**
- Other endpoints follow global rate limiting (100 requests per minute)

## Notes

- All endpoints except `/auth/register` and `/auth/login` require authentication
- Admin endpoints require a user with `isAdmin: true`
- PDF download returns a binary file (not JSON)
- Stripe webhooks require proper signature verification


