import os
import numpy as np
from PIL import Image
import tensorflow as tf
from flask import Flask, jsonify, request
from flask_cors import CORS
import keras
from tensorflow.keras.applications.efficientnet import preprocess_input
_orig_dense = keras.layers.Dense.__init__
def _safe_dense_init(self, *args, **kwargs):
    kwargs.pop('quantization_config', None)
    kwargs.pop('activity_regularizer', None)
    return _orig_dense(self, *args, **kwargs)
keras.layers.Dense.__init__ = _safe_dense_init

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
def load_model_with_fix(model_path):
    try:
        return tf.keras.models.load_model(model_path, compile=False)
    except Exception as e:
        print(f"standard load failed for {os.path.basename(model_path)}, applying fix...")
    
model_cnn_path = os.path.join(BASE_DIR, 'my_pneumonia_model_clean.h5')
model_cnn= load_model_with_fix(model_cnn_path)
if model_cnn:
    print("CNN model loaded successfully")
model_eff_path = os.path.join(BASE_DIR, 'model_pneumonia16+augumentation_final2.h5')
model_eff= load_model_with_fix(model_eff_path)
if model_eff:
    print("EfficientNet model loaded successfully")

@app.route('/')
def home():
    return jsonify({"status": "API is running", 
                    "model_loaded": {
                        "cnn": model_cnn is not None,
                        "efficientnet": model_eff is not None
                    }})
    
@app.route('/predict', methods=['POST'])
def predict_cnn():
    return run_prediction(model_cnn, "CNN")

@app.route('/predict2', methods=['POST'])
def predict_efficientnet():
    return run_prediction(model_eff, "EfficientNet")

def run_prediction(model, model_name):
    if model is None:
        return jsonify({"error" : f'{model_name} model not loaded'}),500
    if 'file' not in request.files:
        return jsonify({'error': 'No file selected'}),400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'no file selected'}),400
    
    try:
        if model_name == "CNN":
            img = Image.open(file).convert('L')
            img = img.resize((150,150))
            img_array = np.array(img) / 255.0
            img_array = img_array.reshape(1, 150, 150, 1)
            threshold = 0.5
            prediction = model.predict(img_array, verbose=0)[0][0]
            print(f"[{model_name}] Raw prediction: {prediction}, Threshold: {threshold}")
            pred_value = float(prediction)
            if prediction < threshold:
                result = "NORMAL"
                confidence = round( pred_value * 100, 2)
            else:
                result = 'PNEUMONIA'
                confidence = round((1 - pred_value ) * 100, 2)
        else:
            img = Image.open(file).convert('RGB')
            img = img.resize((224,224))
            img_array = np.array(img)
            img_array = preprocess_input(img_array)
            img_array = img_array.reshape(1, 224, 224, 3)
            threshold = 0.5
            prediction = model.predict(img_array, verbose=0)[0][0]
            print(f"[{model_name}] Raw prediction: {prediction}, Threshold: {threshold}")
            pred_value = float(prediction)

            if prediction >  threshold:
                result = "PNEUMONIA"
                confidence = round(( pred_value) * 100,2)
            else:
                result = 'NORMAL'
                confidence = round(( 1 - pred_value ) * 100, 2)
            confidence = round(float(confidence), 2)
            confidence = max(confidence, 1)
            print("prediction raw= ",prediction)
            print("prediction float= ",float(prediction))

        return jsonify({
            'model' : model_name,
            'prediction': result,
            'confidence': confidence,
            'prediction_value': pred_value
        })
    except Exception as e:
        print(f"prediction error ({model_name}): {str(e)}")
        return jsonify({'error': f'Prediction failed: {str(e)}'}),500
        
if __name__ == '__main__':
    print("Starting Flask Server...")
    app.run(host='0.0.0.0', port= 5000, debug=False)