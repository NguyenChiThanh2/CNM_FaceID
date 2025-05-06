import face_recognition

image = face_recognition.load_image_file("some_face.jpg")
face_locations = face_recognition.face_locations(image)

print("Số khuôn mặt phát hiện:", len(face_locations))

