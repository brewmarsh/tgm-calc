from flask import Flask, render_template, request

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/calculate', methods=['POST'])
def calculate():
    try:
        num1 = float(request.form['num1'])
        num2 = float(request.form['num2'])
        operation = request.form['operation']
        result = 0

        if operation == 'add':
            result = num1 + num2
        elif operation == 'subtract':
            result = num1 - num2
        elif operation == 'multiply':
            result = num1 * num2
        elif operation == 'divide':
            if num2 == 0:
                return 'Error: Division by zero'
            result = num1 / num2
        else:
            return 'Error: Invalid operation'

        return render_template('index.html', result=result)
    except ValueError:
        return 'Error: Invalid input'

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=22846)
