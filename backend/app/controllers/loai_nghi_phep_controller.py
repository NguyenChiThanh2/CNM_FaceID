from flask import request, jsonify
from app.services.loai_nghi_phep_service import (
    get_all_loai_nghi_phep_service, get_loai_nghi_phep_by_id_service,
    create_loai_nghi_phep_service, update_loai_nghi_phep_service,
    delete_loai_nghi_phep_service
)

def get_all_loai_nghi_phep():
    loai_list = get_all_loai_nghi_phep_service()
    return jsonify([loai.to_dict() for loai in loai_list]), 200

def get_loai_nghi_phep_by_id(id):
    loai = get_loai_nghi_phep_by_id_service(id)
    if not loai:
        return jsonify({'error': 'Loại nghỉ phép không tồn tại'}), 404
    return jsonify(loai.to_dict()), 200

def create_loai_nghi_phep():
    data = request.json
    try:
        loai = create_loai_nghi_phep_service(
            ten=data['ten'],
            mo_ta=data.get('mo_ta'),
            co_luong=data.get('co_luong', True)
        )
        return jsonify(loai.to_dict()), 201
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

def update_loai_nghi_phep(id):
    data = request.json
    try:
        loai = update_loai_nghi_phep_service(
            id,
            ten=data.get('ten'),
            mo_ta=data.get('mo_ta'),
            co_luong=data.get('co_luong')
        )
        return jsonify(loai.to_dict()), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

def delete_loai_nghi_phep(id):
    try:
        result = delete_loai_nghi_phep_service(id)
        return jsonify(result), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 400