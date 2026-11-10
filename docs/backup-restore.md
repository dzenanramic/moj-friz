# Backup and restore — proposed pilot procedure

**Status: not implemented and not configured.** Milestone A has no server-side data. This document
is a draft for the pilot, not evidence that backups exist. A restore drill must be completed before
inviting salons.

## Proposed pilot backup schedule

- Encrypted PostgreSQL `pg_dump` (custom format) once per day.
- Retain 14 daily backups and 4 weekly backups off-host.
- Encrypt before transfer with a key held outside the database host; do not store the key next to the
  backup.
- Alert the founder if the scheduled backup fails, but do not add monitoring infrastructure until the
  pilot needs it.
- Document the backup location, retention and access owner. Never store database credentials or
  dumps in the repository.

## Sketch commands for a future implementation

These are placeholders for the pilot; they have not been run:

```bash
# Proposed, not configured:
pg_dump --format=custom --no-owner --file=/secure/path/mojfriz-$(date +%F).dump "$DATABASE_URL"
age -r "$BACKUP_RECIPIENT" -o /secure/path/mojfriz-$(date +%F).dump.age /secure/path/mojfriz-$(date +%F).dump
# Transfer the encrypted file off-host, then remove the plaintext dump.
```

## Restore drill (required before pilot)

1. Create a clean, isolated PostgreSQL database.
2. Retrieve the chosen encrypted backup and decrypt it in a temporary location.
3. Run the restore with documentation from the chosen provider or standard `pg_restore`.
4. Run Alembic `upgrade head` only if the restored backup predates the current migration.
5. Verify row counts for salons, services, hairdressers, appointments and clients; verify a known
   appointment and its salon scope.
6. Start the application against the restored database and complete a read-only smoke test.
7. Record the date, backup ID, restore duration, operator and any issues.
8. Destroy the temporary copy and confirm the drill did not alter production.

## Deletion and backup implications

Client deletion/export is a manual, documented procedure in the pilot. Deleting a record from the
live database does not remove it from older backups until those backups expire. This limitation must
be stated in the privacy notice and the deletion procedure. Do not promise immediate erasure from
backups unless a verified procedure exists.

## Current claim

No backup has been configured, no restore has been attempted, and Milestone A contains no real
salon data. Do not claim otherwise.
