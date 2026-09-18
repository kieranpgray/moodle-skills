#!/usr/bin/env bash
# check-setup.sh — is this machine ready to run the moodle-prototype skill?
#
# Plain-language readiness check. Run it yourself, or ask Claude
# "/moodle-prototype check". It changes nothing; it only reports.
#
#   bash scripts/check-setup.sh            from the skill folder
#   bash ~/.claude/skills/moodle-prototype/scripts/check-setup.sh
#
# Three answers matter: is the skill folder complete, is Node installed (the
# lint needs it), and are we inside a Moodle checkout (the skill reads real
# code before designing). Everything else is optional and says so.

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ok=0; warn=0; fail=0
pass() { printf '  \033[32mOK\033[0m    %s\n' "$1"; ok=$((ok+1)); }
soft() { printf '  \033[33mLIMIT\033[0m %s\n' "$1"; warn=$((warn+1)); }
bad()  { printf '  \033[31mSTOP\033[0m  %s\n' "$1"; fail=$((fail+1)); }
note() { printf '        %s\n' "$1"; }

echo "moodle-prototype setup check"
echo "skill folder: $SKILL_DIR"
echo

# --- 1. Is the skill folder complete? -------------------------------------
echo "1. Skill folder"
missing=""
for f in SKILL.md design-pass.md templates/course-page/TEMPLATE-shell.html scripts/proto-lint.js scripts/proto-export.js scripts/ui-audit.js; do
  [ -f "$SKILL_DIR/$f" ] || missing="$missing $f"
done
if [ -z "$missing" ]; then
  pass "all six files are here (instructions, design pass, template, lint, export, census)"
else
  bad "missing:$missing"
  note "Copy the WHOLE moodle-prototype folder, not just SKILL.md. Re-download it from"
  note "github.com/kieranpgray/moodle-skills and copy the folder again."
fi
case "$SKILL_DIR" in
  */.claude/skills/moodle-prototype|*/skills/moodle-prototype) pass "folder is in a place Claude looks for skills" ;;
  *) soft "folder is not under a skills/ directory — Claude may not see it"
     note "Claude Code / desktop Code tab: ~/.claude/skills/moodle-prototype/"
     note "A single project only:        <project>/.claude/skills/moodle-prototype/" ;;
esac
echo

# --- 2. Node (the lint runs on it) ----------------------------------------
echo "2. Node.js (runs the quality check on every prototype)"
if command -v node >/dev/null 2>&1; then
  v="$(node -v 2>/dev/null)"; major="${v#v}"; major="${major%%.*}"
  if [ "${major:-0}" -ge 18 ]; then
    pass "node $v"
    if [ -f "$SKILL_DIR/scripts/proto-lint.js" ] && [ -f "$SKILL_DIR/templates/course-page/TEMPLATE-shell.html" ]; then
      out="$(node "$SKILL_DIR/scripts/proto-lint.js" "$SKILL_DIR/templates/course-page/TEMPLATE-shell.html" 2>&1 | head -1)"
      case "$out" in
        *"FAIL 0 "*) pass "lint self-test: the bundled template passes ($out)" ;;
        *) bad "lint self-test failed: $out"; note "The template or lint in this folder has been edited. Re-copy the folder." ;;
      esac
    fi
  else
    bad "node $v is too old — need 18 or newer"
    note "Install the current LTS from https://nodejs.org (default installer, no options to change)."
  fi
else
  bad "node is not installed"
  note "Install it from https://nodejs.org — pick the LTS version, run the installer, then"
  note "close and reopen Claude so it sees the new command. Nothing else to configure."
fi
echo

# --- 3. Moodle checkout (the skill reads real code first) -----------------
echo "3. Moodle checkout (the code the skill reads before it designs anything)"
root=""; d="$PWD"
for _ in 1 2 3 4 5 6 7 8; do
  # Moodle 4.x: version.php at the root. Moodle 5+: public/version.php with lib/ beside public/.
  if [ -f "$d/version.php" ] && [ -d "$d/lib" ]; then root="$d"; vfile="$d/version.php"; break; fi
  if [ -f "$d/public/version.php" ] && [ -d "$d/lib" ]; then root="$d"; vfile="$d/public/version.php"; break; fi
  up="$(dirname "$d")"; [ "$up" = "$d" ] && break; d="$up"
done
if [ -n "$root" ]; then
  rel="$(grep -m1 '^\$release' "$vfile" 2>/dev/null | sed -E "s/.*'([^']+)'.*/\1/")"
  pass "inside a Moodle checkout: $root${rel:+ (Moodle $rel)}"
  if [ -d "$root/public" ]; then docroot="$root/public"; else docroot="$root"; fi
  if [ -d "$root/lib/bundles/design-system/scss/tokens" ]; then
    pass "Moodle Design System tokens found — prototypes will be checked against the live values"
  else
    soft "no lib/bundles/design-system/ in this checkout (older Moodle) — the lint uses its built-in copy of the MDS values instead"
  fi
  if mkdir -p "$docroot/prototypes" 2>/dev/null && [ -w "$docroot/prototypes" ]; then
    pass "prototypes go in $docroot/prototypes/"
  else
    bad "cannot create or write $docroot/prototypes/"
    note "Check the folder isn't read-only. Prototype files are written there."
  fi
  if command -v git >/dev/null 2>&1 && git -C "$root" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    br="$(git -C "$root" branch --show-current 2>/dev/null)"
    pass "git is available (branch: ${br:-detached}); the skill can keep its work on a separate copy"
  else
    soft "git not available or this isn't a git checkout — fine for prototyping, but nothing is version-controlled"
  fi
else
  bad "not inside a Moodle checkout (no version.php found walking up from $PWD)"
  note "Open Claude with a Moodle folder as the project (a 'git clone https://github.com/moodle/moodle'"
  note "is enough, it does not need to run). In Cowork, choose that folder as the workspace."
fi
echo

# --- 4. Optional: something to compare against / view with ----------------
echo "4. Optional (the skill works without these and says so when it skips them)"
if command -v docker >/dev/null 2>&1 && docker ps --format '{{.Names}}' 2>/dev/null | grep -qi moodle; then
  pass "a Moodle Docker container is running — Step 5 can compare against a real Moodle (the skill checks it serves THIS checkout before trusting it)"
else
  soft "no running Moodle (Docker) found — Step 5's 'correct against the real thing' will be skipped with a note. Prototypes still open fine as files."
fi
if command -v python3 >/dev/null 2>&1; then
  pass "python3 present — a one-line static server is available if a stable URL is wanted"
else
  soft "no python3 — Claude will open prototypes straight from the file instead of a local URL"
fi
note "Figma: can't be checked from here. If the Figma connector is on, Step 4 uses real frames;"
note "if not, the prototype is built 'Boost-loose' and the file says so."
echo

# --- verdict ---------------------------------------------------------------
if [ "$fail" -eq 0 ] && [ "$warn" -eq 0 ]; then
  echo "READY. Ask Claude: \"let's prototype <a Moodle screen>\"."
elif [ "$fail" -eq 0 ]; then
  echo "READY, with $warn limit(s) above. Nothing blocks a first prototype."
  echo "Ask Claude: \"let's prototype <a Moodle screen>\"."
else
  echo "NOT READY: $fail thing(s) marked STOP above need fixing first. Each has its fix under it."
fi
exit 0
