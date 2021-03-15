import os, sys, json, copy, random

try:
    import lorem
except:
    print("\npip install lorem\n")
    sys.exit(1)

here = os.path.dirname(os.path.abspath(__file__))
data = os.path.join(os.path.dirname(here), "api", "data")
print(f"Data folder: {data}")

NUM_ISSUES = 100
NUM_ACTIVITY = 500
ISSUES_FILE = os.path.join(data, "issues.json")
ACTIVITY_FILE = os.path.join(data, "activity.json")

issue_template = {
    # "activity": [],
    # "created_at": 1615704659235,
    # "id": 4,
    # "issue_name": "DWB-0004",
    # "updated_at": None,
    "created_by": "user@example.com",
    "issue_affected_version": None,
    "issue_assigned_to": None,
    "issue_description": "Right now edits can only happen via API, we should design an interface for this",
    "issue_fixed_version": None,
    "issue_priority": 1,
    "issue_project": "DWB",
    "issue_resolution": "unresolved",
    "issue_status": "open",
    "issue_story_points": 2,
    "issue_summary": "Allow users to edit tickets",
    "issue_type": "feature",
}
issue_project = lambda: "ABC"
issue_affected_version = lambda: None
issue_fixed_version = lambda: None
issue_priority = lambda: random.choice([1, 2, 3, 4, 5])
issue_story_points = lambda: random.choice([1, 2, 3, 5, 6, 7, 8])
created_by = (
    lambda: random.choice(["adam", "bill", "cary", "diane", "evan", "fred", "greg"])
    + "@example.com"
)
issue_assigned_to = lambda: None if random.random() > 0.75 else created_by()
issue_resolution = (
    lambda: "unresolved"
    if random.random() > 0.75
    else random.choice(
        [
            "invalid",
            "wont_fix",
            "overcome_by_events",
            "unable_to_replicate",
            "duplicate",
            "complete",
        ]
    )
)
issue_type = lambda: random.choice(
    ["bug", "task", "feature", "requirement", "support", "epic"]
)
issue_status = lambda: random.choice(
    ["open", "assigned", "in_progress", "on_hold", "under_review", "done", "released"]
)

issue_summary = lambda: lorem.sentence()
issue_description = lambda: lorem.paragraph()

issues = []
for _ in range(NUM_ISSUES):
    i = dict(
        created_by=created_by(),
        issue_affected_version=issue_affected_version(),
        issue_assigned_to=issue_assigned_to(),
        issue_description=issue_description(),
        issue_fixed_version=issue_fixed_version(),
        issue_priority=issue_priority(),
        issue_project=issue_project(),
        issue_resolution=issue_resolution(),
        issue_status=issue_status(),
        issue_story_points=issue_story_points(),
        issue_summary=issue_summary(),
        issue_type=issue_type(),
    )
    issues.append(i)

print(f"Writing {NUM_ISSUES} items to {ISSUES_FILE}")
with open(ISSUES_FILE, "w") as file:
    json.dump(issues, file, indent=4)

# -----------------------------------------------------------------------------
activity_template = {
    "issue_id": 1,
    "created_by": "user@example.com",
    "activity_type": "comment",
    "activity_text": "hello world! I am leaving this comment here for someone to read later on.",
}

issue_id = lambda: random.randint(1, NUM_ISSUES)
# created_by same as before
activity_type = lambda: "comment"
activity_text = lambda: lorem.sentence()

activity = []
for _ in range(NUM_ACTIVITY):
    a = dict(
        issue_id=issue_id(),
        created_by=created_by(),
        activity_type=activity_type(),
        activity_text=activity_text(),
    )
    activity.append(a)

print(f"Writing {NUM_ACTIVITY} items to {ACTIVITY_FILE}")
with open(ACTIVITY_FILE, "w") as file:
    json.dump(activity, file, indent=4)
