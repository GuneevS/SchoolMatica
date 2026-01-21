# Secrets Management Best Practices

## Overview

SchoolMatica requires careful management of sensitive credentials and secrets for secure production deployment. This guide covers best practices for handling secrets throughout the development, staging, and production lifecycle.

## Critical Secrets in SchoolMatica

### 1. NEXTAUTH_SECRET (CRITICAL)

**Purpose**: Signs and encrypts JWT session tokens

**Generation**:
```bash
# Generate a secure random secret
openssl rand -base64 32
```

**Requirements**:
- Minimum 32 characters
- Cryptographically random
- Unique per environment
- NEVER reuse between dev/staging/production

**Validation**: SchoolMatica validates this at runtime in `lib/auth-config.ts:9-15`. The application will refuse to start if not set.

### 2. Database Credentials

**PostgreSQL Connection**:
```env
DATABASE_URL="postgresql://username:password@host:5432/dbname"
```

**Best Practices**:
- Use strong passwords (16+ characters, mixed case, numbers, symbols)
- Different credentials per environment
- Limit database user permissions (no SUPERUSER in production)
- Enable SSL/TLS for database connections in production
- Never commit DATABASE_URL to git

### 3. Email Service API Keys

**Required for production password resets**:
```env
# Choose ONE provider:
RESEND_API_KEY=re_xxxxx          # Recommended
SENDGRID_API_KEY=SG.xxxxx        # Alternative
AWS_ACCESS_KEY_ID=AKIA...        # For SES
AWS_SECRET_ACCESS_KEY=xxxxx      # For SES
```

**Security**:
- Obtain keys from provider dashboards
- Store securely (see Docker Secrets below)
- Rotate quarterly or after suspected compromise
- Monitor usage for anomalies

### 4. Session Store (Redis - Optional but Recommended)

**For production with multiple app instances**:
```env
REDIS_URL="redis://:password@host:6379"
```

**Notes**:
- Not required for single-instance deployments
- Essential for horizontal scaling
- Use Redis ACLs for fine-grained access control

## Development vs Production

### Development (.env.development)

```env
# Development - can use weaker secrets for convenience
NEXTAUTH_SECRET="dev-secret-minimum-32-chars-long"
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/schoolmatica_dev"
NEXTAUTH_URL="http://localhost:13807"

# Email not required in development (logs to console)
```

**Key Points**:
- Separate .env.development file (gitignored)
- Weaker secrets acceptable for local development
- Email service can be skipped (uses console logging)
- Never use production secrets in development

### Production (.env.production)

```env
# Production - MUST use strong, unique secrets
NEXTAUTH_SECRET="<32+ character cryptographically random string>"
DATABASE_URL="postgresql://<user>:<strong-password>@<host>:5432/<dbname>?sslmode=require"
NEXTAUTH_URL="https://schoolmatica.example.com"

# Email service (choose one provider)
RESEND_API_KEY="<your-resend-api-key>"
```

**Key Points**:
- NEVER commit to git
- Use Docker secrets or external secret management
- Enable SSL/TLS for all connections
- Strong, unique secrets for each environment

## Docker Secrets (Recommended for Production)

Docker secrets provide secure secret distribution in production environments.

### Setup with Docker Swarm

**1. Create secrets**:
```bash
# Create NEXTAUTH_SECRET
openssl rand -base64 32 | docker secret create nextauth_secret -

# Create database password
echo -n "your-strong-db-password" | docker secret create db_password -

# Create email API key
echo -n "your-resend-api-key" | docker secret create resend_api_key -
```

**2. Update docker-compose.prod.yml**:
```yaml
services:
  app:
    secrets:
      - nextauth_secret
      - db_password
      - resend_api_key
    environment:
      NEXTAUTH_SECRET_FILE: /run/secrets/nextauth_secret
      DATABASE_PASSWORD_FILE: /run/secrets/db_password
      RESEND_API_KEY_FILE: /run/secrets/resend_api_key

secrets:
  nextauth_secret:
    external: true
  db_password:
    external: true
  resend_api_key:
    external: true
```

**3. Update application to read secret files**:
```typescript
// lib/secrets.ts (create this file)
import fs from 'fs';

export function getSecret(envVar: string, fileVar?: string): string {
  // Try file-based secret first (Docker secrets)
  if (fileVar && process.env[fileVar]) {
    try {
      return fs.readFileSync(process.env[fileVar], 'utf8').trim();
    } catch (err) {
      console.warn(`Failed to read secret from ${process.env[fileVar]}`);
    }
  }

  // Fallback to environment variable
  return process.env[envVar] || '';
}
```

### Alternative: External Secret Management

For enterprise deployments, consider:

**AWS Secrets Manager**:
```bash
aws secretsmanager get-secret-value --secret-id schoolmatica/nextauth-secret
```

**HashiCorp Vault**:
```bash
vault kv get secret/schoolmatica/nextauth-secret
```

**Google Cloud Secret Manager**:
```bash
gcloud secrets versions access latest --secret="nextauth-secret"
```

## Environment File Security

### .gitignore Configuration

Already configured in SchoolMatica:
```gitignore
# Environment files
.env
.env.*
!.env.example
!.env.*.example
```

### Template Files

**Always maintain example files** (`.env.example`, `.env.development.example`):
```env
# .env.production.example
NEXTAUTH_SECRET="<generate-with-openssl-rand-base64-32>"
DATABASE_URL="postgresql://<user>:<password>@<host>:5432/<dbname>?sslmode=require"
NEXTAUTH_URL="https://your-domain.com"
RESEND_API_KEY="<your-api-key>"
```

**Benefits**:
- Documents required variables
- Guides new developers/deployments
- Never contains actual secrets

## Rotation Procedures

### When to Rotate

**Immediate rotation required**:
- Suspected compromise or exposure
- Employee/contractor departure with access
- Public git commit (even if reverted)
- Security audit findings

**Scheduled rotation** (recommended quarterly):
- NEXTAUTH_SECRET
- Database passwords
- API keys

### Rotation Process

**1. NEXTAUTH_SECRET rotation**:
```bash
# Generate new secret
NEW_SECRET=$(openssl rand -base64 32)

# Deploy with both old and new (graceful transition)
# Update NEXTAUTH_SECRET to new value
# Wait for all sessions to expire (8 hours max in SchoolMatica)
# Remove old secret
```

**2. Database password rotation**:
```bash
# PostgreSQL
ALTER USER schoolmatica_user WITH PASSWORD 'new-strong-password';

# Update all application instances
# Restart application pods/containers
```

**3. Email API key rotation**:
```bash
# Generate new key in provider dashboard
# Update environment/secret
# Revoke old key after verification
# Test password reset flow
```

## Common Pitfalls

### ❌ DON'T

1. **Commit secrets to git** - Even in private repositories
   ```bash
   # If accidentally committed:
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch .env" HEAD
   ```

2. **Reuse secrets across environments**
   ```env
   # BAD - same secret in dev and prod
   NEXTAUTH_SECRET="same-secret-everywhere"
   ```

3. **Use weak secrets in production**
   ```env
   # BAD - predictable, short
   NEXTAUTH_SECRET="secret123"
   ```

4. **Log secrets**
   ```typescript
   // BAD
   console.log(`Using secret: ${process.env.NEXTAUTH_SECRET}`);
   ```

5. **Store secrets in Docker images**
   ```dockerfile
   # BAD - baked into image
   ENV NEXTAUTH_SECRET="hardcoded-secret"
   ```

### ✅ DO

1. **Use secret management tools**
   - Docker secrets for Swarm
   - Kubernetes secrets for K8s
   - Cloud provider secret managers

2. **Separate secrets per environment**
   ```bash
   dev/NEXTAUTH_SECRET
   staging/NEXTAUTH_SECRET
   production/NEXTAUTH_SECRET
   ```

3. **Generate cryptographically secure secrets**
   ```bash
   openssl rand -base64 32
   ```

4. **Audit secret access**
   - Log secret retrieval (not values)
   - Monitor for unauthorized access
   - Regular access reviews

5. **Use principle of least privilege**
   - Database users with minimal permissions
   - API keys with scoped access
   - Role-based access control

## Deployment Checklist

Before production deployment, verify:

- [ ] NEXTAUTH_SECRET is 32+ characters and cryptographically random
- [ ] DATABASE_URL uses strong password and SSL mode
- [ ] Email service API key is configured and tested
- [ ] No secrets in git repository or Docker images
- [ ] .env files are in .gitignore
- [ ] Docker secrets or external secret manager configured
- [ ] Backup access to all secrets (encrypted vault)
- [ ] Secret rotation schedule established
- [ ] Monitoring configured for secret access
- [ ] Team trained on secret handling procedures

## Emergency Procedures

### Exposed Secret Response

**If a secret is exposed publicly**:

1. **Immediate**: Rotate the exposed secret
2. **Investigate**: Review access logs for unauthorized use
3. **Notify**: Inform security team and stakeholders
4. **Document**: Record incident and remediation steps
5. **Review**: Update procedures to prevent recurrence

**Example - Exposed NEXTAUTH_SECRET**:
```bash
# 1. Generate new secret
NEW_SECRET=$(openssl rand -base64 32)

# 2. Update all instances
kubectl set env deployment/schoolmatica NEXTAUTH_SECRET="$NEW_SECRET"

# 3. Invalidate all sessions
# Users will need to re-login

# 4. Review session activity logs
# Check for suspicious activity

# 5. Update secret in vault
vault kv put secret/schoolmatica/nextauth-secret value="$NEW_SECRET"
```

## References

- [NextAuth.js Security](https://next-auth.js.org/configuration/options#secret)
- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [Docker Secrets Documentation](https://docs.docker.com/engine/swarm/secrets/)
- [PostgreSQL Password Security](https://www.postgresql.org/docs/current/auth-password.html)

## Support

For questions about secrets management in SchoolMatica:
- Review this guide first
- Check deployment documentation: `docs/DEPLOYMENT_GUIDE.md`
- Review Docker documentation: `docs/DOCKER.md`
- Contact DevOps team for enterprise deployments
