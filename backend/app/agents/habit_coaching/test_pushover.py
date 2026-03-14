import httpx

PUSHOVER_APP_TOKEN = "aguy4ytiu9vccfgg191qp8gts71ev8"
PUSHOVER_USER_KEY  = "ukue2to8rybfbpicw7gdvouahcnv2d"

resp = httpx.post(
    "https://api.pushover.net/1/messages.json",
    data={
        "token":   PUSHOVER_APP_TOKEN,
        "user":    PUSHOVER_USER_KEY,
        "title":   "Dentist",
        "message": "Reminder to brush your teeth",
        "priority": 1,  # high priority — bypasses quiet hours, pops on screen
    },
)

print(resp.status_code, resp.json())
