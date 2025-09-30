import os

basedir = os.path.abspath(os.path.dirname(__file__))
UPLOAD_FOLDER = os.path.join(basedir, "uploads/nghi_phep/thaisan")
UPLOAD_FOLDER_PHEPNAM = os.path.join(basedir, "uploads/nghi_phep/phepnam")
UPLOAD_FOLDER_PHEPKL = os.path.join(basedir, "uploads/nghi_phep/phepkhongluong")
UPLOAD_FOLDER_KHAUTRU = os.path.join(basedir, "uploads/khau_tru")

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
if not os.path.exists(UPLOAD_FOLDER_KHAUTRU):
    os.makedirs(UPLOAD_FOLDER_KHAUTRU)
if not os.path.exists(UPLOAD_FOLDER_PHEPNAM):
    os.makedirs(UPLOAD_FOLDER_PHEPNAM)
if not os.path.exists(UPLOAD_FOLDER_PHEPKL):
    os.makedirs(UPLOAD_FOLDER_PHEPKL)

class Config:
    SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(basedir, 'db_qlns.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
