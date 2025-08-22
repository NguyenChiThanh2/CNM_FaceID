# from functools import wraps
# from flask import request, jsonify
# from app.utils.auth import get_current_user_from_token  # bạn cần định nghĩa

# def role_required(allowed_roles):
#     def decorator(f):
#         @wraps(f)
#         def wrapper(*args, **kwargs):
#             user = get_current_user_from_token()
#             if user is None:
#                 return jsonify({"error": "Unauthorized"}), 401
#             if user.role_users.ma_vai_tro not in allowed_roles:
#                 return jsonify({"error": "Forbidden"}), 403
#             return f(*args, **kwargs)
#         return wrapper
#     return decorator
