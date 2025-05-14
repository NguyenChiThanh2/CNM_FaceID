from flask import Blueprint, request, jsonify
import base64
import cv2
import numpy as np
from PIL import Image
from io import BytesIO
from app.controllers.cham_cong_controller import (
    create_cham_cong_from_face_service,
    get_all_cham_cong,
    get_cham_cong_by_id,
    update_cham_cong,
    delete_cham_cong
)
from app.services.cham_cong_service import create_cham_cong_from_face_service



cham_cong_bp = Blueprint('cham_cong_bp', __name__, url_prefix='/api')

# Route: GET all
@cham_cong_bp.route('/get-all-cham-cong', methods=['GET'])
def get_all_cham_cong_router():
    return get_all_cham_cong()

# Route: GET by ID
@cham_cong_bp.route('/get-cham-cong-by-id/<int:id>', methods=['GET'])
def get_cham_cong_by_id_router(id):
    return get_cham_cong_by_id(id)

# Route: UPDATE
@cham_cong_bp.route('/edit-cham-cong/<int:id>', methods=['PUT'])
def update_cham_cong_router(id):
    return update_cham_cong(id)

# Route: DELETE
@cham_cong_bp.route('/delete-cham-cong/<int:id>', methods=['DELETE'])
def delete_cham_cong_router(id):
    return delete_cham_cong(id)

@cham_cong_bp.route('/face-checkin', methods=['POST'])
def create_cham_cong_from_face():
    data = request.get_json()
    base64_image = data.get('image_base64')
    if not base64_image:
        return jsonify({'message': 'Thiếu ảnh base64'}), 400
    result, status_code = create_cham_cong_from_face_service(base64_image)
    return jsonify(result), status_code


