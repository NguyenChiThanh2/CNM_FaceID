cap = cv2.VideoCapture(0)  # Mở webcam

while True:
    ret, frame = cap.read()
    if not ret:
        break

    # ... (gọi các bước từ 3.1 đến 3.6)

    cv2.imshow('Face Recognition', frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()



