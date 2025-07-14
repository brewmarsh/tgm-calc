from flask import Flask, render_template, request
from calculator import calculate_optimal_troops

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/calculate', methods=['POST'])
def calculate():
    try:
        opponent_troops = {
            'bruisers': int(request.form.get('bruisers', 0)),
            'hitmen': int(request.form.get('hitmen', 0)),
            'bikers': int(request.form.get('bikers', 0)),
        }
        optimal_troops = calculate_optimal_troops(opponent_troops)
        return render_template('index.html', result=optimal_troops)
    except (ValueError, TypeError):
        return 'Error: Invalid input'

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=22846)
