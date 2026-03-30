---
name: keys
description: Provisioning and assigning Make keys (keychains) to modules — SSH keys, certificates, and other cryptographic material via credential requests.
---

# Keys

## What It Is

Keys (also called keychains) are Make's way of managing cryptographic material — SSH keys, certificates, PEM/PFX files, and similar credentials that modules need for secure operations like JWT signing, SSH connections, or certificate-based authentication. Like connections, key IDs are stored in the module's **parameters** domain.

## When It's Needed

- Modules that perform cryptographic operations (signing, encryption, decryption, SSH)
- Modules that require certificate-based authentication
- The module interface (from `app-module_get` with instructions format) specifies when a key is required and what type

## Provisioning Workflow

Keys follow the **same credential request flow as connections**:

1. **Extract Blueprint Components** — returns required keys alongside connections. The output specifies the key type (keychain type) needed for each module.

2. **Check existing keys** — use `keys_list` to see if a compatible key already exists in the user's team.

3. **Ask the user** — present the existing compatible keys (if any) and ask whether to reuse one or create a new key.

4. **Create via credential request** if needed — use `credential_requests_create` for the key type. The user uploads or enters the cryptographic material through the secure credential request flow. The agent never handles raw key data directly.

5. **Retrieve the key ID** — after user completion, call `credential_requests_get` to obtain the key ID.

6. **Assign to modules** — place the key ID in the module's parameters under the field name from the module interface (commonly `__IMTKEY__`, but check the schema).

## Key Types

Make supports multiple keychain types. The specific types available depend on the modules in the scenario. The Extract Blueprint Components tool output tells exactly which keychain type is needed — do not guess or hardcode types.

**Common use cases:**
- **Encryptor app** — AES Encrypt/Decrypt advanced, Create digital signature, PGP Encrypt/Decrypt
- **SSH app** — private keys for connections
- **HTTP app** — keychains for API key and Basic Auth

**Key insertion methods:** Direct Insert (copy-paste) or Extract from File (P12, PFX, PEM formats). OpenSSH format private keys must be converted to PEM format first (`ssh-keygen -p -m PEM -f <path>`).

## Gotchas

- **Never handle raw key data.** The credential request flow handles all key material securely. The agent should never ask the user to paste private keys, certificates, or other sensitive cryptographic material into the conversation.
- **Key field names vary.** Don't assume the parameter name is always `__IMTKEY__`. Check the module interface for the exact field name.
- **Keys are team-level resources.** Like connections, they're shared across scenarios in a team.

## Official Documentation

- [Keys and Certificates](https://help.make.com/keys-and-certificates)

See also: [Connections](./connections.md) for the full credential request flow (same pattern), [General Principles](./general-principles.md) for the overall module configuration workflow.
