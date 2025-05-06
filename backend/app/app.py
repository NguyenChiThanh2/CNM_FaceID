from app import create_app
from app.routes import register_routes
from flask import Flask, send_file, abort
import os
from werkzeug.utils import secure_filename
from flask_cors import CORS

app = create_app()
register_routes(app)
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)
@app.route('/api/images/<filename>')
def get_image(filename):
    image_path = os.path.join(app.root_path, '..', 'static', 'images', 'avatars', filename)
    
    if os.path.exists(image_path):
        if filename.lower().endswith('.jpg') or filename.lower().endswith('.jpeg'):
            mime_type = 'image/jpeg'
        elif filename.lower().endswith('.png'):
            mime_type = 'image/png'
        elif filename.lower().endswith('.gif'):
            mime_type = 'image/gif'
        else:
            mime_type = 'application/octet-stream'

        return send_file(image_path, mimetype=mime_type)
    else:
        abort(404)

@app.errorhandler(404)
def page_not_found(e):
    image_path = os.path.join(app.root_path, 'static', 'images', '404.png')
    if os.path.exists(image_path):
        return send_file(image_path, mimetype='image/png'), 404
    return "404 Not Found", 404
