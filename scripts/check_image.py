import face_recognition
import sys
import pathlib
import pickle
import time
import os

file_path = sys.argv[1]
encoding_path = sys.argv[2]
person_names = []
person_encodings = []
# Loading Encodings
# print("Loading Directory "+encoding_path)
# print("Loading Encodings")
for filename in pathlib.Path(encoding_path).iterdir():
    if filename.name.split('.')[1] in ['enc']:
        person_names.append(filename.name.split('.')[0])
        read_file = open(filename,'rb')
        tmp_encoding = pickle.load(read_file)
        person_encodings.append(tmp_encoding)
        # print("Loading encoding "+person_names[-1])
        read_file.close()

# Loading Test Image
filename = pathlib.Path(file_path)
unknown_face_encodings = []
if filename.name.split('.')[1] in ['jpg','jpeg']:
    # print("Loading "+filename.name)
    test_image = face_recognition.load_image_file(filename)
    temporary_encoding = face_recognition.face_encodings(test_image)
    for unknown_faces in temporary_encoding:
        # print("Loading Unknown Image!")
        unknown_face_encodings.append(unknown_faces)


# Checking For Know Faces
# print("Checking For Known Faces")
ret = []
for i,encoding in enumerate(person_encodings):
    for test_encoding in unknown_face_encodings:
        test_encoding = [test_encoding]
        result = face_recognition.compare_faces(encoding,test_encoding)
        if result[0] == True:
            print(person_names[i])
            ret.append(person_names[i])
# for i in ret:
#     print(i)
#     os.write(3, bytes(i,'utf-8'))
os.remove(filename) 