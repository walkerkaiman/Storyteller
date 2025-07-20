import subprocess

def start_black_box(command):
    print(f"Starting black box: {command}")
    global process
    process = subprocess.Popen(command, shell=True)

def wait_for_finish():
    print("Waiting for black box to finish...")
    # Simulate waiting for a signal from the black box
    input("Press Enter when black box is finished...")
    if process:
        process.terminate()
    print("Black box finished.")
    return {"status": "finished"} 