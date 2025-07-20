import requests

class BackendClient:
    def __init__(self, backend_url, chapter_id):
        self.backend_url = backend_url.rstrip('/')
        self.chapter_id = chapter_id

    def register_chapter(self):
        url = f"{self.backend_url}/chapters/register"
        data = {"chapter_id": self.chapter_id}
        try:
            resp = requests.post(url, json=data)
            resp.raise_for_status()
            print("Registered with backend.")
        except Exception as e:
            print(f"Failed to register chapter: {e}")

    def send_state(self, user_id, state):
        url = f"{self.backend_url}/participants/{user_id}/state"
        data = {"state": state, "chapter_id": self.chapter_id}
        try:
            resp = requests.post(url, json=data)
            resp.raise_for_status()
            print(f"Sent state '{state}' for user {user_id}.")
        except Exception as e:
            print(f"Failed to send state: {e}")

    def send_result(self, user_id, result):
        url = f"{self.backend_url}/participants/{user_id}/result"
        data = {"result": result, "chapter_id": self.chapter_id}
        try:
            resp = requests.post(url, json=data)
            resp.raise_for_status()
            print(f"Sent result for user {user_id}.")
        except Exception as e:
            print(f"Failed to send result: {e}")

    def update_registration_status(self, count, max_count, timer, final=False, min_participants=None, max_participants=None, countdown_seconds=None):
        url = f"{self.backend_url}/chapters/{self.chapter_id}/registration_status"
        data = {
            "count": count,
            "max": max_count,
            "timer": timer,
            "final": final,
            "min_participants": min_participants,
            "max_participants": max_participants,
            "countdown_seconds": countdown_seconds
        }
        try:
            resp = requests.post(url, json=data)
            resp.raise_for_status()
            print(f"Updated registration status: {count}/{max_count}, timer: {timer}, final: {final}")
        except Exception as e:
            print(f"Failed to update registration status: {e}")

    def send_state_batch(self, user_ids, state):
        url = f"{self.backend_url}/participants/batch_state"
        data = {
            "user_ids": user_ids,
            "state": state,
            "chapter_id": self.chapter_id
        }
        try:
            resp = requests.post(url, json=data)
            resp.raise_for_status()
            print(f"Sent batch state '{state}' for users: {user_ids}")
        except Exception as e:
            print(f"Failed to send batch state: {e}") 