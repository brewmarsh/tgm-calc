from flask import Flask, render_template, request

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/submit', methods=['POST'])
def submit():
    name = request.form['name']
    email = request.form['email']
    return f'Hello {name}, your email is {email}'

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=22846)
