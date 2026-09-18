# Firestore Security Specification - Controle de Gastos

## Data Invariants
1. A Company document must be owned by the creator (`ownerId`).
2. A Company document can have multiple members (`memberEmails`).
3. Sub-resources (expenses, accounts, etc.) MUST belong to a valid Company.
4. Access to sub-resources is strictly derived from the parent Company's membership.
5. Critical fields like `amount` must be non-negative.
6. Timestamps `createdAt` must match server time on creation.

## The "Dirty Dozen" Payloads (Denial Tests)

### Company Collection
1. **Identity Spoofing**: Attempt to create a company with an `ownerId` that doesn't match the authenticated user.
2. **Ghost Member**: Attempt to add a member with an unverified email (if `email_verified` is enforced).
3. **Privilege Escalation**: A non-owner member attempting to change the `ownerId` of the company.
4. **Invalid Type**: Attempting to set `type` to "government" (not in enum).

### Expenses Subcollection
5. **Orphaned Write**: Attempting to write an expense to a non-existent company ID.
6. **Cross-Tenant Attack**: Attempting to write an expense to a company the user is not a member of.
7. **Negative Amount**: Attempting to save an expense with `amount: -100`.
8. **Future Post**: Attempting to set `createdAt` to a future date instead of `request.time`.
9. **Field Injection**: Attempting to add an `isVerified: true` field to an expense.

### Accounts Subcollection
10. **Resource Poisoning**: Setting a bank name string longer than 100 characters.
11. **Balance Manipulation**: A 'viewer' attempting to update an account balance.
12. **Id Poisoning**: Using a document ID like `../../secrets` (Regex check).

## Validation Logic
- `isValidId(id)`: Regex `^[a-zA-Z0-9_\\-]+$` and size <= 128.
- `isValidCompany(data)`: Check all required fields and types.
- `isValidExpense(data)`: Check `amount > 0`, valid categories, etc.
