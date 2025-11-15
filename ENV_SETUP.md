# Environment Variables Setup

## Chat V2 Feature Flag

To enable Chat V2 (nueva arquitectura):

```bash
# Add to .env file:
PUBLIC_USE_CHAT_V2=true
```

To use current Chat V1:

```bash
# In .env file:
PUBLIC_USE_CHAT_V2=false
# Or simply don't set the variable (defaults to false)
```

## Other Required Variables

See main documentation for complete .env setup.

---

**Note:** Chat V2 is currently in development. Default is V1 (stable).

