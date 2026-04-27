# Security Specification - Nomad Tribe App

## Data Invariants
1. A user can only access their own notifications.
2. A user can only create/edit/delete their own collab asks.
3. A user can only create their own endorsements.
4. Users can read all public profiles, spots, and collab asks.
5. Critical user fields like `role` can only be modified by SuperAdmins.

## The Dirty Dozen Payloads

1. **Identity Spoofing (Create Ask)**: Create a `collabAsks` document with a `userId` different from the authenticated user.
2. **Identity Spoofing (Create Notification)**: Create a `notifications` document for another user.
3. **Privilege Escalation**: Update own `users` profile to set `role: 'SuperAdmin'`.
4. **Unauthorized Read**: Attempt to read all `notifications` without a `userId` filter matching own UID.
5. **Unauthorized Delete**: Attempt to delete another user's `collabAsks`.
6. **State Hijacking (Marketplace)**: Update status to 'Sold' on an item not owned by the user.
7. **Bypass Verification**: Write to `spots` without being `isVerified`.
8. **Shadow Update**: Update a notification and attempt to change the `userId`.
9. **Spam Attacks**: Create a `notifications` or `collabAsks` document with a 1MB string in the `message` field.
10. **Orphaned Record**: Create a `trips` document for a `familyId` that does not exist (or isn't owned by user).
11. **Metadata Poisoning**: Set `isVetted: true` on a `spots` document as a regular user.
12. **PII Scraping**: Attempt to fetch all `users` with PII-revealing fields if we had any.

## Test Runner (Logic Check)

All "Dirty Dozen" payloads should return `PERMISSION_DENIED`.
For example, a list query on `notifications` without the `where('userId', '==', uid)` clause must be rejected.
