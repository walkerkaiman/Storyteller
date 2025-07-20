import json
import time
import threading
from backend_client import BackendClient
from qr_scanner import scan_qr
from black_box_adapter import start_black_box, wait_for_finish

CONFIG_PATH = 'config.json'

class ChapterRegistration:
    def __init__(self, config, backend):
        self.min = config['min_participants']
        self.max = config['max_participants']
        self.countdown_seconds = config['countdown_seconds']
        self.backend = backend
        self.participants = []
        self.timer = None
        self.timer_value = self.countdown_seconds
        self.lock = threading.Lock()
        self.registration_open = True
        self.config = config

    def register_participant(self, user_id):
        with self.lock:
            if not self.registration_open or user_id in self.participants or len(self.participants) >= self.max:
                return False
            self.participants.append(user_id)
            self.notify_backend()
            if len(self.participants) == self.min:
                self.start_timer()
            elif self.timer and len(self.participants) < self.max:
                self.reset_timer()
            if len(self.participants) == self.max:
                self.close_registration()
            return True

    def start_timer(self):
        self.timer_value = self.countdown_seconds
        self.timer = threading.Thread(target=self.countdown)
        self.timer.start()

    def reset_timer(self):
        self.timer_value = self.countdown_seconds

    def countdown(self):
        while self.timer_value > 0 and len(self.participants) < self.max:
            time.sleep(1)
            self.timer_value -= 1
            self.notify_backend()
        self.close_registration()

    def close_registration(self):
        with self.lock:
            if not self.registration_open:
                return
            self.registration_open = False
            self.notify_backend(final=True)
            print("Registration closed. Starting session.")
            # Start session after registration closes
            self.backend.send_state_batch(self.participants, "session_started")
            start_black_box(self.config['black_box_command'])
            result = wait_for_finish()
            for user_id in self.participants:
                self.backend.send_result(user_id, result)
                self.backend.send_state(user_id, "session_finished")
            print("Session finished. Ready for next group.")

    def notify_backend(self, final=False):
        self.backend.update_registration_status(
            len(self.participants),
            self.max,
            self.timer_value,
            final,
            min_participants=self.min,
            max_participants=self.max,
            countdown_seconds=self.countdown_seconds
        )

    def reset(self):
        self.participants = []
        self.timer = None
        self.timer_value = self.countdown_seconds
        self.registration_open = True


def load_config():
    with open(CONFIG_PATH, 'r') as f:
        return json.load(f)

def main():
    config = load_config()
    backend = BackendClient(config['backend_url'], config['chapter_id'])
    backend.register_chapter()
    print(f"CHAPTER {config['chapter_id']} started.")

    while True:
        reg = ChapterRegistration(config, backend)
        while reg.registration_open:
            print("Waiting for participant QR code...")
            user_id = scan_qr(config['qr_camera_index'])
            if user_id:
                if reg.register_participant(user_id):
                    print(f"Participant checked in: {user_id}")
                else:
                    print(f"User {user_id} already registered or registration closed.")
            time.sleep(1)
        reg.reset()
        print("Ready for next group.\n")

if __name__ == "__main__":
    main() 