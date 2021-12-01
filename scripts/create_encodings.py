import face_recognition
import sys
import pathlib
import pickle
import time
import os

# First Argument to this script is the file path and second is the location to save the file 
# third is the name of the person.
file_path = sys.argv[1]
save_path = sys.argv[2]
person_name = sys.argv[3]
filename = pathlib.Path(file_path)
save_file_path = pathlib.Path(save_path)
if filename.name.split('.')[1] in ['jpg','jpeg']:
    # print("Loading "+filename.name)
    # print("Creating Encoding of "+filename.name)
    train_image = face_recognition.load_image_file(filename)
    train_face_encodings = face_recognition.face_encodings(train_image)[0]
    write_filename = save_path+person_name+'.enc'
    pathlib.Path(save_file_path).mkdir(parents=True, exist_ok=True) 
    write_file = open(write_filename,'wb')
    pickle.dump(train_face_encodings,write_file)
    # print("Writing Encoding of "+person_name+" to file")
    write_file.close()
    # print("Removing Temporary Data")
    os.remove(filename)
    # print("Temporary Data Removed")