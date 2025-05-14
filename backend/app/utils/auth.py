# import jwt
# from flask import request
# from app.models.user import User
# from config import SECRET_KEY  # hoặc settings của bạn

# def get_current_user_from_token():
#     auth_header = request.headers.get('Authorization')
#     if not auth_header or not auth_header.startswith("Bearer "):
#         return None
#     token = auth_header.split(" ")[1]
#     try:
#         payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
#         user_id = payload.get('user_id')
#         return User.query.get(user_id)
#     except Exception:
#         return None
