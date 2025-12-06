from flask import Flask, jsonify, request
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)

# Updated Route to match Vercel path
@app.route('/api/get_result', methods=['GET'])
def get_result():
    pin = request.args.get('pin')
    sem_id = request.args.get('semYearId')
    exam_id = request.args.get('examMonthYearId')
    scheme_id = request.args.get('schemeId')

    if not all([pin, sem_id, exam_id, scheme_id]):
        return jsonify({"error": "Missing parameters"}), 400

    url = f"https://www.sbtet.telangana.gov.in/api/api/Results/GetStudentWiseReport?ExamMonthYearId={exam_id}&ExamTypeId=5&Pin={pin}&SchemeId={scheme_id}&SemYearId={sem_id}&StudentTypeId=1"

    headers = {
        "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36",
        "Referer": "https://www.sbtet.telangana.gov.in/",
        "Origin": "https://www.sbtet.telangana.gov.in",
        "Accept": "application/json, text/plain, */*"
    }

    try:
        response = requests.get(url, headers=headers, verify=False, timeout=10)
        return jsonify(response.json())
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Vercel handles the execution, so we don't need app.run() for deployment
if __name__ == '__main__':
    app.run(debug=True)
