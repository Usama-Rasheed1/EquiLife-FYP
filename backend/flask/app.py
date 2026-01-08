# app.py
from flask import Flask, request, jsonify
import pickle
import pandas as pd

app = Flask(__name__)

# Load the model
with open('mental_health_model.pkl', 'rb') as f:
    model = pickle.load(f)

# Define prediction route
@app.route('/predict', methods=['POST'])
def predict():
    data = request.json  # Expecting JSON from frontend
    # Convert JSON to DataFrame
    user_df = pd.DataFrame([data])
    # Predict
    trend = model.predict(user_df)[0]
    # Optionally: get prediction probabilities
    probs = model.predict_proba(user_df)[0]
    prob_dict = dict(zip(model.classes_, probs))
    return jsonify({'trend': trend, 'probabilities': prob_dict})

if __name__ == '__main__':
    app.run(debug=True)
