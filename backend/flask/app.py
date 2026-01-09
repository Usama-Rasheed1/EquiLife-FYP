from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import pandas as pd

app = Flask(__name__)
CORS(app) 
# Load the model
with open('mental_health_model.pkl', 'rb') as f:
    model = pickle.load(f)

# Define prediction route
@app.route('/predict', methods=['POST'])
def predict():
    data = request.json  
    user_df = pd.DataFrame([data])
    # Predict
    trend = model.predict(user_df)[0]
    probs = model.predict_proba(user_df)[0]
    prob_dict = dict(zip(model.classes_, probs))
    return jsonify({'trend': trend, 'probabilities': prob_dict})

if __name__ == '__main__':
    app.run(debug=True)
