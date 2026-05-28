# Moodle Won't-Fix Patterns

**Purpose:** Agent-readable reference for Step 3 (bug validation) and the orchestrator.
When a reported issue matches a pattern in this file, the agent flags it as a likely won't-fix
candidate and surfaces it to a human for confirmation before closing or labelling.

The agent does not apply `triage/wontfix` autonomously — this file accelerates Step 3 by
making known patterns explicit, but human confirmation is always required.

**Location:** `skills/bug-triage/bug-triage-shared/wontfix-patterns.md` — shared across the triage pipeline. Referenced by the orchestrator (which passes content to Step 3) and directly by Step 3 when run standalone.
**Maintained by:** Alpha team. Add patterns as they are identified during triage runs.
**Last updated:** 2026-05-28

---

## Pattern categories

### 1. Third-party plugin compatibility

**Pattern:** Issue is caused by a third-party plugin conflicting with Moodle core, or a
plugin not implementing a Moodle API correctly.

**Signals:**
- Description mentions a specific third-party plugin name
- Error traces originate in `/local/`, `/blocks/`, or `/mod/` directories not owned by Moodle HQ
- Reporter acknowledges the issue does not reproduce on a clean Moodle install

**Routing:** Not a Moodle core bug. Belongs with the plugin maintainer.
**Response note:** Direct reporter to the plugin's own issue tracker or support channel.

---

### 2. Behaviour is intentional but confusing

**Pattern:** The reported behaviour is working as designed, but the UX is confusing enough
that the reporter interpreted it as a bug.

**Signals:**
- Behaviour described matches documented functionality
- Issue has been raised before (check for duplicates or related tracker history)
- Moodle docs explicitly describe this behaviour

**Routing:** Consider creating an enhancement request if the UX confusion is widespread.
This specific ticket is not a bug.
**Response note:** Explain the intended behaviour and link to relevant documentation.

---

### 3. Version outside the supported matrix

**Pattern:** Issue affects a Moodle version that is no longer in the supported release window.

**Signals:**
- `Affects Version/s` field references a version older than the current supported LTS or standard releases
- Check [moodledev.io/general/releases](https://moodledev.io/general/releases) to confirm support status

**Routing:** Won't fix in that version. If the issue reproduces on a supported version, re-raise.
**Response note:** Note which versions are currently supported and encourage testing on a current release.

---

### 4. "Not a Moodle core bug — belongs with the platform / server config"

**Pattern:** Issue is caused by server configuration, hosting environment, or PHP/database
version outside Moodle's control.

**Signals:**
- Error traces point to PHP, Apache/nginx, MySQL, or PostgreSQL
- Issue does not reproduce on moodledemo.net or a reference installation
- Description mentions non-standard server configuration (e.g. unusual PHP settings, custom nginx rewrites)

**Routing:** Out of scope for Moodle HQ. Advise reporter to check server config.
**Response note:** Suggest steps to isolate whether the issue is environment-specific.

---

### 5. Duplicate of a known open issue

**Pattern:** The reported behaviour is already tracked in an open Jira ticket.

**Signals:**
- Searching Jira for the summary keywords returns an existing open bug with the same symptom
- Reporter may not have searched before filing

**Routing:** Mark as duplicate. Link to the canonical ticket.
**Response note:** Thank the reporter, link to the existing ticket, ask them to add their reproduction details there if new information.

---

## Adding new patterns

When the team identifies a new recurring won't-fix category during triage runs, add it here following the same format:
1. Pattern name (short, descriptive)
2. Description of what it covers
3. Signals (observable in the ticket)
4. Routing decision
5. Response note (what to tell the reporter)

Commit the update and push to your shared skills repository so the change is available to the team.
