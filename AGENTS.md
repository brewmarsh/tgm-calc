# Agent Guidelines

This document provides guidelines for agents working on this codebase.

## 1. Project Overview

This project is a Flask application that provides a troop counter calculator for the game "The Grand Mafia".

## 2. Development Setup

### Dependencies
*   **Backend:** `pip install -r requirements.txt`

### Building and Running
*   **Build:** `docker compose build`
*   **Run:** `docker compose up --build -d`

## 3. Project Structure and Key Directories

*   `/`: The root directory contains the main application file (`app.py`), Docker-related files (`Dockerfile`, `docker-compose.yml`), and other configuration files.
*   `static/`: Contains static assets such as CSS and images.
*   `templates/`: Contains Flask templates for the web application.
*   `tests/`: Contains tests for the application.

## 4. Build, Test, and Deployment Commands

*   **To install dependencies:** `pip install -r requirements.txt`
*   **To run the application:** `python app.py`
*   **Run Tests:**
    *   **Backend:** `python -m unittest discover tests`
*   All new features must be accompanied by unit tests with at least 80% code coverage.
*   Run the entire test suite before submitting code to ensure that no regressions have been introduced.

## 5. Debugging

*   **API Issues:** Check the backend logs for errors: `docker logs app-backend-1`
*   **Docker Container Issues:** Use `docker logs [container_name]` to retrieve logs.
*   **Docker Build Failures:** If a Docker build fails, consider rebuilding with `DOCKER_BUILDKIT=0` for more verbose output to inspect layers.

## 6. Coding Standards

### General
*   Error handling should use centralized `try-catch` blocks and log to `console.error`.

### Backend
*   Follow the PEP 8 style guide for Python.
*   Use a linter like `flake8` or `pylint` to check for style issues.
*   All public functions and classes must have comprehensive docstrings using the Google Python Style Guide format.
*   All configuration data must be validated using `voluptuous` schemas.
*   Define constants in `custom_components/meraki_ha/const.py`.

## 7. Resource Optimization

*   Before running large builds, ensure the `/tmp/` directory is cleared.
*   For Python projects, execute `pip cache purge` to free up disk space.
*   If you still have disk space issues, prune the Docker builder cache: `docker builder prune -a -f`.

## 8. Environment Variables

*   The `POSTGRES_DB`, `POSTGRES_USER`, and `POSTGRES_PASSWORD` environment variables must be set in the `.env` file for the backend to connect to the database.

## 9. Input/Output Conventions

*   **API Responses:** API responses should be in JSON format.
*   **Code Coverage:** All new features should include corresponding unit tests with at least 80% code coverage.
*   **Commit Messages:** Commit messages should follow the conventional commit format.

## 10. Iterative Problem Resolution

Agents should iteratively resolve similar problems. For example, if there is an error in a single file regarding indentation, agents should examine all files for similar issues, starting with those files closest in the folder structure. Then agents should continuously update the agents.md file with their findings on how to further avoid similar problems.

## 11. Closed Loop Documentation

Agents must update any documentation as they make changes to code, including updating AGENTS.md when they find a new development or debugging technique, updating REQUIREMENTS.md when requirements are implemented, new bugs are found or new features are identified and updating DESIGN.md when soemthing from the design is updated.

## 12. Dependencies

*   Use `dependabot` to keep dependencies up-to-date.
*   Regularly review and update dependencies as needed.

- All constants must be defined in `custom_components/meraki_ha/const.py`.
- Do not use magic strings or numbers in the code.

## 5. Testing

- All new features must be accompanied by unit tests.
- Run the entire test suite before submitting code to ensure that no regressions have been introduced.

## 6. Dependencies

- Use `dependabot` to keep dependencies up-to-date.
- Regularly review and update dependencies as needed.
