# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Set the working directory in the container
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Make port 22846 available to the world outside this container
EXPOSE 22846

# Run create_db.py to create the database tables
RUN python create_db.py

# Run app.py when the container launches
CMD ["gunicorn", "--bind", "0.0.0.0:22846", "--timeout", "120", "--graceful-timeout", "60", "app:app"]
