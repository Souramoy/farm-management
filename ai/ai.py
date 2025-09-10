from flask import Flask, request, jsonify
from flask_cors import CORS
import random
import time
import os
import json

app = Flask(__name__)
CORS(app)

# Simulate different AI models for different animal types
HEALTH_PREDICTIONS = {
    'cattle': {
        'healthy': 0.7,
        'treatable': 0.2,
        'untreatable': 0.1
    },
    'poultry': {
        'healthy': 0.6,
        'treatable': 0.3,
        'untreatable': 0.1
    },
    'swine': {
        'healthy': 0.65,
        'treatable': 0.25,
        'untreatable': 0.1
    },
    'default': {
        'healthy': 0.7,
        'treatable': 0.25,
        'untreatable': 0.05
    }
}

DISEASE_CONDITIONS = {
    'treatable': [
        'Mild respiratory infection',
        'Skin irritation',
        'Minor digestive upset',
        'Nutritional deficiency',
        'Parasitic infection'
    ],
    'untreatable': [
        'Severe viral infection',
        'Advanced metabolic disorder',
        'Chronic degenerative condition',
        'Acute systemic failure'
    ]
}

def get_weighted_prediction(animal_type='default'):
    """Generate a weighted random prediction based on animal type."""
    weights = HEALTH_PREDICTIONS.get(animal_type, HEALTH_PREDICTIONS['default'])
    rand = random.random()
    
    if rand < weights['healthy']:
        return 'healthy'
    elif rand < weights['healthy'] + weights['treatable']:
        return 'treatable'
    else:
        return 'untreatable'

def get_condition_details(status):
    """Get additional details about the detected condition."""
    if status == 'healthy':
        return {
            'condition': 'No issues detected',
            'recommendation': 'Continue regular monitoring and preventive care',
            'urgency': 'low'
        }
    elif status == 'treatable':
        condition = random.choice(DISEASE_CONDITIONS['treatable'])
        return {
            'condition': condition,
            'recommendation': 'Consult with veterinarian for treatment options',
            'urgency': 'medium'
        }
    else:  # untreatable
        condition = random.choice(DISEASE_CONDITIONS['untreatable'])
        return {
            'condition': condition,
            'recommendation': 'Immediate veterinary attention required',
            'urgency': 'high'
        }

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'service': 'Farm AI Prediction Service',
        'version': '1.0.0',
        'timestamp': time.time()
    })

@app.route('/predict', methods=['POST'])
def predict():
    """Main prediction endpoint for animal health analysis."""
    try:
        # Simulate processing time
        time.sleep(random.uniform(0.5, 2.0))
        
        # Get animal type from request (optional)
        data = request.get_json() or {}
        animal_type = data.get('animal_type', 'default').lower()
        
        # Generate prediction
        status = get_weighted_prediction(animal_type)
        confidence = random.uniform(0.75, 0.95) if status == 'healthy' else random.uniform(0.60, 0.90)
        
        # Get condition details
        details = get_condition_details(status)
        
        response = {
            'status': status,
            'confidence': round(confidence, 3),
            'animal_type': animal_type,
            'condition': details['condition'],
            'recommendation': details['recommendation'],
            'urgency': details['urgency'],
            'timestamp': time.time(),
            'model_version': '1.0.0'
        }
        
        # Log prediction for monitoring
        print(f"AI Prediction: {status} ({confidence:.1%} confidence) - {details['condition']}")
        
        return jsonify(response)
        
    except Exception as e:
        print(f"Prediction error: {str(e)}")
        return jsonify({
            'error': 'Prediction failed',
            'message': 'AI service encountered an error',
            'timestamp': time.time()
        }), 500

@app.route('/batch_predict', methods=['POST'])
def batch_predict():
    """Batch prediction endpoint for multiple images."""
    try:
        data = request.get_json() or {}
        batch_size = data.get('batch_size', 1)
        animal_type = data.get('animal_type', 'default').lower()
        
        if batch_size > 10:  # Limit batch size
            return jsonify({'error': 'Batch size too large (max 10)'}), 400
        
        results = []
        for i in range(batch_size):
            time.sleep(0.1)  # Small delay per prediction
            status = get_weighted_prediction(animal_type)
            confidence = random.uniform(0.60, 0.95)
            details = get_condition_details(status)
            
            results.append({
                'id': i + 1,
                'status': status,
                'confidence': round(confidence, 3),
                'condition': details['condition'],
                'recommendation': details['recommendation'],
                'urgency': details['urgency']
            })
        
        return jsonify({
            'results': results,
            'batch_size': batch_size,
            'timestamp': time.time()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/model_info', methods=['GET'])
def model_info():
    """Get information about the AI model."""
    return jsonify({
        'model_name': 'Farm Animal Health Classifier',
        'version': '1.0.0',
        'supported_animals': list(HEALTH_PREDICTIONS.keys()),
        'accuracy': {
            'cattle': 0.89,
            'poultry': 0.85,
            'swine': 0.87,
            'general': 0.83
        },
        'last_trained': '2024-01-15',
        'status': 'active'
    })

if __name__ == '__main__':
    print("🤖 Starting Farm AI Prediction Service...")
    print("🔬 Model: Farm Animal Health Classifier v1.0.0")
    print("🌐 Server: http://localhost:5000")
    app.run(debug=True, port=5000, host='0.0.0.0')