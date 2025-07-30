# Agent Guidelines

This document provides guidelines for agents working on this codebase.

## 1. Project Structure and Key Directories

*   `/`: The root directory contains the main application file (`app.py`), Docker-related files (`Dockerfile`, `docker-compose.yml`), and other configuration files.
*   `static/`: Contains static assets such as CSS and images.
*   `templates/`: Contains Flask templates for the web application.
*   `tests/`: Contains tests for the application.

## 2. Build, Test, and Deployment Commands

*   **To install dependencies:** `pip install -r requirements.txt`
*   **To run the application:** `python app.py`
*   **To run tests:** `python -m unittest discover tests`

## 3. Common Debugging Procedures and Tools

*   **Check application logs:** When debugging API issues, first check `app.log` for application-level errors.
*   **Check container logs:** For Docker container issues, use `docker logs [container_name]` to retrieve logs.
*   **Verbose Docker builds:** If a Docker build fails, consider rebuilding with `DOCKER_BUILDKIT=0` for more verbose output to inspect layers.
*   **Cleaning the environment:** To clean up the Docker environment, use `docker-compose down -v`.

## 4. Coding Standards and Best Practices

*   **Python:** Follow PEP 8 style guidelines. All new functions should have docstrings.
*   **Error Handling:** Use centralized `try-catch` blocks and log to `console.error`.
*   **Refactoring:** Prefer `const` over `let` where variable reassignment is not needed.

## 5. Resource Optimization Guidelines

*   **Clear Docker cache:** If you are running low on disk space, you can clear the Docker build cache with `docker builder prune`.
*   **Clean npm cache:** Before running large builds, execute `npm cache clean --force` to free up disk space in the VM.
*   **Resources** Prefer libraries and modules that use minimal resources and prune unecessary resources from larger packages

## 6. Environment Variables

*   `SECRET_KEY`: A secret key for signing session cookies.
*   `DATABASE_URL`: The URL of the database.

## 7. Input/Output Conventions

*   **API Responses:** API responses should be in JSON format.
*   **Code Coverage:** All new features should include corresponding unit tests with at least 80% code coverage.
*   **Commit Messages:** Commit messages should follow the conventional commit format.

## 8. Iterative Problem Resolution

Agents should iteratively resolve similar problems. For example, if there is an error in a single file regarding indentation, agents should examine all files for similar issues, starting with those files closest in the folder structure. Then agents should continuously update the agents.md file with their findings on how to further avoid similar problems.

## 9. Closed Loop Documentation

Agents must update any documentation as they make changes to code, including updating AGENTS.md when they find a new development or debugging technique, updating REQUIREMENTS.md when requirements are implemented, new bugs are found or new features are identified and updating DESIGN.md when soemthing from the design is updated.

## 10. Code Style

- All constants must be defined in `custom_components/meraki_ha/const.py`.
- Do not use magic strings or numbers in the code.

## 5. Testing

- All new features must be accompanied by unit tests.
- Run the entire test suite before submitting code to ensure that no regressions have been introduced.

## 6. Dependencies

- Use `dependabot` to keep dependencies up-to-date.
- Regularly review and update dependencies as needed.
