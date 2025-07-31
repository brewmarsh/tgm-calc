# Design

This document outlines the design of the TGM-Calc project.

## 1. Architecture

The project is a Flask application with a simple architecture. The main components are:

*   **`app.py`:** The main application file that initializes the Flask application and registers the blueprints.
*   **`main.py`:** The main blueprint that contains the routes for the application.
*   **`auth.py`:** The auth blueprint that contains the routes for user authentication.
*   **`calculator.py`:** A module that contains the logic for the calculators.
*   **`models.py`:** A module that contains the database models.
*   **`forms.py`:** A module that contains the forms for the application.
*   **`templates/`:** A directory that contains the HTML templates for the application.
*   **`static/`:** A directory that contains the static files for the application.

## 2. Database

The project uses a SQLite database to store user information. The database schema is defined in the `models.py` file.

## 3. Calculators

The project provides the following calculators:

*   **Troop Calculator:** Calculates the optimal troop composition to counter an opponent's army.
*   **Enforcer Calculator:** Calculates the best enforcers for a given situation.
*   **Gear & Investment Calculator:** Calculates the total attack and defense boost from gear and investments.
*   **Building Cost Calculator:** Calculates the investment required to get from level x to level y of a building.

## 4. User Authentication

The project uses Flask-Login for user authentication. Users can create an account, log in, and log out.

## 5. User Profiles

Users can save their troop and enforcer details to their profile, and customize their profile with an avatar.

## 6. Social Features

Users can find and follow other users.

## 7. Screenshot Analysis

Users can upload screenshots of their game data and have it automatically parsed and added to their profile.
