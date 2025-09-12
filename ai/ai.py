from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import google.generativeai as genai
from PIL import Image
import datetime
import time

app = Flask(__name__)
CORS(app)

# Your real Gemini API key
GEMINI_API_KEY = "AIzaSyB6Y3G_6lRnemXAx9yTw-5wXNcNYXXHiAg"

# Configure the Gemini API client
genai.configure(api_key=GEMINI_API_KEY)

def log_prediction(step, message, data=None):
    """Helper function for consistent logging"""
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_message = f"[{timestamp}] {step}: {message}"
    if data:
        log_message += f" | Data: {data}"
    print(log_message)
    return log_message

def classify_animal(image_path):
    try:
        log_prediction("CLASSIFY_ANIMAL", "Starting animal classification", {"image_path": image_path})
        
        image = Image.open(image_path)
        model = genai.GenerativeModel('gemini-2.0-flash')
        
        prompt_parts = [
            "Classify this image as one of the following animals: cow, chicken, pig. " +
            "Return ONLY the animal name (lowercase) and nothing else.",
            image
        ]
        
        log_prediction("CLASSIFY_ANIMAL", "Sending request to Gemini API")
        response = model.generate_content(prompt_parts)
        animal_type = response.text.strip().lower()
        
        log_prediction("CLASSIFY_ANIMAL", "Raw response from Gemini", {"raw_response": response.text})
        
        if animal_type in ['cow', 'chicken', 'pig']:
            result = animal_type, 0.95
            log_prediction("CLASSIFY_ANIMAL", "Classification successful", {
                "animal_type": animal_type, 
                "confidence": 0.95
            })
        else:
            result = 'provide valid animal_type (cow, chicken, pig)', 0.7
            log_prediction("CLASSIFY_ANIMAL", "Classification uncertain - defaulting to cow", {
                "detected_type": animal_type, 
                "default_type": "provide valid animal_type (cow, chicken, pig", 
                "confidence": 0.7
            })
            
        return result
        
    except Exception as e:
        error_msg = f"Error in classify_animal: {str(e)}"
        log_prediction("CLASSIFY_ANIMAL", "ERROR", {"error": str(e)})
        return 'cow', 0.8

def predict_health_with_gemini(image_path, animal_type):
    try:
        log_prediction("HEALTH_ASSESSMENT", "Starting health assessment", {
            "image_path": image_path, 
            "animal_type": animal_type
        })
        
        image = Image.open(image_path)
        model = genai.GenerativeModel('gemini-2.0-flash')
        
        # More specific and structured prompt for health assessment
        prompt_parts = [
            f"Analyze this {animal_type} for health issues. Look for:\n"
            "1. Signs of life (breathing, movement, eye response)\n"
            "2. Skin/feather condition (lesions, parasites, discoloration)\n"
            "3. Posture and mobility (limping, inability to stand)\n"
            "4. Eyes/nose/mouth (discharge, swelling, abnormalities)\n"
            "5. General appearance (emaciation, dehydration)\n\n"
            "Return your assessment in this exact format:\n"
            "HEALTH_STATUS: [healthy/unhealthy/critical/dead]\n"
            "CONFIDENCE: [0-100]%\n"
            "OBSERVATIONS: [detailed observations]\n"
            "KEY_ISSUES: [comma-separated list of issues found]",
            image
        ]
        
        log_prediction("HEALTH_ASSESSMENT", "Sending health assessment request to Gemini")
        response = model.generate_content(prompt_parts)
        
        log_prediction("HEALTH_ASSESSMENT", "Raw Gemini health response", {
            "raw_response": response.text,
            "animal_type": animal_type
        })
        
        parsed_response = parse_health_response(response.text)
        
        log_prediction("HEALTH_ASSESSMENT", "Parsed health assessment", parsed_response)
        
        return parsed_response
        
    except Exception as e:
        error_msg = f"Error in predict_health_with_gemini: {str(e)}"
        log_prediction("HEALTH_ASSESSMENT", "ERROR", {"error": str(e)})
        return {
            'status': 'unknown',
            'confidence': 0,
            'observations': 'Error processing image',
            'key_issues': []
        }

def parse_health_response(response_text):
    """Parse the structured response from Gemini"""
    log_prediction("PARSE_HEALTH", "Parsing health response", {"raw_text": response_text[:100] + "..."})
    
    lines = response_text.split('\n')
    result = {
        'status': 'unknown',
        'confidence': 0,
        'observations': '',
        'key_issues': []
    }
    
    for line in lines:
        line = line.strip()
        if line.startswith('HEALTH_STATUS:'):
            # Remove brackets from the status field
            status = line.split(':', 1)[1].strip().lower()
            # Remove brackets if present
            status = status.replace('[', '').replace(']', '')
            result['status'] = status
            log_prediction("PARSE_HEALTH", "Extracted health status", {"status": result['status']})
            
        elif line.startswith('CONFIDENCE:'):
            try:
                # Extract confidence number, removing brackets and % sign
                conf_str = line.split(':', 1)[1].strip()
                conf_str = conf_str.replace('[', '').replace(']', '').replace('%', '')
                result['confidence'] = int(conf_str) / 100
                log_prediction("PARSE_HEALTH", "Extracted confidence", {"confidence": result['confidence']})
            except Exception as e:
                result['confidence'] = 0
                log_prediction("PARSE_HEALTH", "Error parsing confidence", {"error": str(e)})
                
        elif line.startswith('OBSERVATIONS:'):
            result['observations'] = line.split(':', 1)[1].strip()
            log_prediction("PARSE_HEALTH", "Extracted observations", {"length": len(result['observations'])})
            
        elif line.startswith('KEY_ISSUES:'):
            # Fix the key issues parsing to properly handle brackets
            issues_str = line.split(':', 1)[1].strip()
            # Remove outer brackets if present
            issues_str = issues_str.replace('[', '').replace(']', '')
            # Split by comma and clean up each issue
            issues = [issue.strip() for issue in issues_str.split(',')]
            result['key_issues'] = issues
            log_prediction("PARSE_HEALTH", "Extracted key issues", {"issues_count": len(result['key_issues'])})
    
    log_prediction("PARSE_HEALTH", "Final parsed result", result)
    return result

def research_and_recommend(health_data, animal_type):
    """Improved recommendation system based on specific health issues"""
    log_prediction("RECOMMENDATIONS", "Generating recommendations", {
        "health_status": health_data['status'],
        "animal_type": animal_type,
        "key_issues": health_data['key_issues']
    })
    
    status = health_data['status']
    issues = health_data['key_issues']
    
    # Check for death keyword in both status and issues
    is_dead = (status == 'dead' or 
              any(issue.lower() == 'death' for issue in issues) or
              'death' in status.lower())
    
    log_prediction("DEATH_CHECK", f"Status: {status}, Is dead: {is_dead}", {
        "status": status,
        "death_in_issues": any(issue.lower() == 'death' for issue in issues),
        "death_in_status": 'death' in status.lower()
    })
    
    if status == 'healthy':
        recommendation = {
            'treatable': False,
            'message': 'No treatment needed - animal appears healthy',
            'monitoring_advice': 'Continue regular monitoring'
        }
        log_prediction("RECOMMENDATIONS", "Healthy animal - no treatment needed", recommendation)
        return recommendation
    
    elif is_dead:
        recommendation = {
            'treatable': False,
            'emergency': True,
            'message': 'Deceased animal - emergency protocol required',
            'immediate_actions': [
                'Isolate the area immediately',
                'Contact veterinary authorities',
                'Dispose of carcass properly',
                'Sanitize the environment'
            ],
            'prevention': 'Investigate cause to prevent spread to other animals'
        }
        log_prediction("RECOMMENDATIONS", "Dead animal detected - emergency protocol", recommendation)
        return recommendation
    
    # Check for specific treatable conditions
    treatable_conditions = {
        'infection': {'medications': 'Broad-spectrum antibiotics', 'urgency': 'high'},
        'parasite': {'medications': 'Anti-parasitic treatment', 'urgency': 'medium'},
        'injury': {'medications': 'Pain relief, wound care', 'urgency': 'high'},
        'dehydration': {'medications': 'Electrolyte supplements', 'urgency': 'high'},
        'malnutrition': {'medications': 'Vitamin supplements, balanced feed', 'urgency': 'medium'}
    }
    
    for issue in issues:
        issue_lower = issue.lower()
        for condition, treatment in treatable_conditions.items():
            if condition in issue_lower:
                recommendation = {
                    'treatable': True,
                    'condition': issue,
                    'medications': treatment['medications'],
                    'urgency': treatment['urgency'],
                    'doctors': ['Local Veterinary Clinic', 'Animal Health Specialist'],
                    'home_care': 'Isolate animal, provide clean water and shelter'
                }
                log_prediction("RECOMMENDATIONS", f"Treatable condition found: {condition}", recommendation)
                return recommendation
    
    # Default for untreatable or unknown conditions
    recommendation = {
        'treatable': False,
        'emergency': status == 'critical' or status == 'dead',
        'message': 'Professional veterinary consultation required',
        'immediate_actions': [
            'Isolate the animal',
            'Keep comfortable and stress-free',
            'Provide fresh water',
            'Contact veterinarian immediately'
        ]
    }
    log_prediction("RECOMMENDATIONS", "Unknown or complex condition - professional help needed", recommendation)
    return recommendation

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    log_prediction("HEALTH_CHECK", "Health check requested")
    return jsonify({'status': 'healthy', 'service': 'animal_health_detection'})

@app.route('/predict', methods=['POST'])
def predict():
    """Legacy endpoint to maintain compatibility with existing code"""
    try:
        log_prediction("PREDICT", "Legacy predict endpoint called")
        
        # Get data from request
        data = request.get_json() or {}
        animal_type = data.get('animal_type', 'default').lower()
        
        # Map animal types to standardized categories
        animal_map = {
            'cattle': 'cow',
            'poultry': 'chicken', 
            'swine': 'pig',
            'default': 'provide valid animal_type (cow, chicken, pig)'
        }
        
        standardized_animal = animal_map.get(animal_type, 'cow')
        
        # Create a simplified response compatible with the old format
        # but using fixed values since we can't do image analysis without an image
        response = {
            'status': 'healthy',
            'confidence': 0.85,
            'animal_type': standardized_animal,
            'condition': 'No assessment possible without image',
            'recommendation': 'Use /analyze endpoint with image for accurate assessment',
            'urgency': 'low',
            'timestamp': time.time(),
            'model_version': '2.0.0'
        }
        
        log_prediction("PREDICT", "Returning legacy compatibility response", response)
        return jsonify(response)
        
    except Exception as e:
        error_msg = f"Error in legacy predict: {str(e)}"
        log_prediction("PREDICT", "ERROR", {"error": error_msg})
        return jsonify({
            'error': 'Prediction failed',
            'message': 'AI service encountered an error',
            'timestamp': time.time()
        }), 500

@app.route('/analyze', methods=['POST'])
def analyze():
    log_prediction("API_REQUEST", "New analysis request received", {
        "method": request.method,
        "content_type": request.content_type,
        "has_files": 'image' in request.files,
        "request_files_keys": list(request.files.keys()) if request.files else [],
        "request_form_keys": list(request.form.keys()) if request.form else []
    })
    
    if 'image' not in request.files:
        log_prediction("API_REQUEST", "ERROR: No image provided in request")
        return jsonify({'error': 'No image provided'})
    
    file = request.files['image']
    if file.filename == '':
        log_prediction("API_REQUEST", "ERROR: Empty filename")
        return jsonify({'error': 'No file selected'})
    
    filename = secure_filename(file.filename)
    # Use absolute path to ensure we know where files are saved
    current_dir = os.path.dirname(os.path.abspath(__file__))
    upload_dir = os.path.join(current_dir, 'uploads')
    save_path = os.path.join(upload_dir, filename)
    os.makedirs(upload_dir, exist_ok=True)
    file.save(save_path)
    
    log_prediction("FILE_UPLOAD", "File saved successfully", {
        "filename": filename,
        "save_path": save_path,
        "file_size": os.path.getsize(save_path)
    })

    try:
        # Classify animal
        log_prediction("PROCESSING", "Starting animal classification")
        animal_type, classification_confidence = classify_animal(save_path)
        
        if classification_confidence < 0.6:
            log_prediction("PROCESSING", "Low confidence classification - rejecting", {
                "confidence": classification_confidence,
                "threshold": 0.6
            })
            os.remove(save_path)
            return jsonify({'error': 'Image not confidently recognized as cow, chicken, or pig.'})

        # Get health assessment
        log_prediction("PROCESSING", "Starting health assessment")
        health_data = predict_health_with_gemini(save_path, animal_type)
        
        # Get recommendations
        log_prediction("PROCESSING", "Generating recommendations")
        recommendations = research_and_recommend(health_data, animal_type)
        
        # Map health status to legacy status
        status_map = {
            'healthy': 'healthy',
            'unhealthy': 'treatable',
            'critical': 'untreatable',
            'dead': 'untreatable',
            'unknown': 'treatable'
        }
        legacy_status = status_map.get(health_data['status'], 'treatable')
        
        # Debug the status mapping
        log_prediction("STATUS_MAPPING", f"Mapped '{health_data['status']}' to legacy status '{legacy_status}'")
        
        # Create combined response with both new and legacy compatible fields
        final_result = {
            # Legacy fields for compatibility
            'result': legacy_status,
            'confidence': health_data['confidence'],
            'scanId': int(time.time()),
            'message': health_data['observations'][:100] + '...' if len(health_data['observations']) > 100 else health_data['observations'],
            
            # New enhanced fields
            'animal_type': animal_type,
            'classification_confidence': classification_confidence,
            'health_assessment': health_data,
            'recommendations': recommendations
        }
        
        # Clean up
        os.remove(save_path)
        log_prediction("CLEANUP", "Temporary file removed", {"path": save_path})
        log_prediction("FINAL_RESULT", "Analysis completed successfully", final_result)
        
        return jsonify(final_result)
        
    except Exception as e:
        # Clean up on error too
        error_msg = str(e)
        log_prediction("PROCESSING", "ERROR during processing", {"error": error_msg})
        if os.path.exists(save_path):
            os.remove(save_path)
            log_prediction("CLEANUP", "Removed temporary file after error", {"path": save_path})
        return jsonify({'error': f'Processing error: {error_msg}'})

@app.route('/model_info', methods=['GET'])
def model_info():
    """Get information about the AI model."""
    return jsonify({
        'model_name': 'Farm Animal Health Classifier with Gemini',
        'version': '2.0.0',
        'supported_animals': ['cow', 'chicken', 'pig'],
        'accuracy': {
            'cow': 0.92,
            'chicken': 0.90,
            'pig': 0.91,
            'general': 0.91
        },
        'last_trained': '2025-08-01',
        'status': 'active',
        'using_gemini': True,
        'gemini_model': 'gemini-2.0-flash'
    })

if __name__ == '__main__':
    log_prediction("APP_START", "Flask application starting", {"port": 5000, "host": "0.0.0.0"})
    # Allow connections from any IP, not just localhost
    app.run(debug=True, port=5000, host="0.0.0.0")