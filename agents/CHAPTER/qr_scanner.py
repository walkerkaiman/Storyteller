import cv2
from pyzbar.pyzbar import decode

def scan_qr(camera_index=0):
    cap = cv2.VideoCapture(camera_index)
    user_id = None
    print("Starting QR code scanner...")
    while True:
        ret, frame = cap.read()
        if not ret:
            continue
        barcodes = decode(frame)
        for barcode in barcodes:
            user_id = barcode.data.decode('utf-8')
            print(f"QR code detected: {user_id}")
            cap.release()
            cv2.destroyAllWindows()
            return user_id
        cv2.imshow('QR Scanner', frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    cap.release()
    cv2.destroyAllWindows()
    return None 