from app import create_app
from app.routes import register_routes  # bạn cần có 1 file routes/__init__.py chứa register_routes
from flask import send_file
import os

app = create_app()
register_routes(app)  # đăng ký blueprint (bao gồm file_bp — xem app/routes/file_routes.py)

# CORS đã được cấu hình trong create_app() (app/__init__.py) — trước đây bị
# khai lần 2 ở đây, cùng áp lên app instance, nên bỏ hẳn để chỉ còn 1 nguồn
# cấu hình duy nhất.


@app.errorhandler(404)
def page_not_found(e):
    image_path = os.path.join(app.root_path, 'static', 'images', '404.png')
    if os.path.exists(image_path):
        return send_file(image_path, mimetype='image/png'), 404
    return "404 Not Found", 404

if __name__ == '__main__':
    app.run(debug=True)
