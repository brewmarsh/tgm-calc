# Product Requirements: TGM-Calc

## 1. Vision

To provide a simple and effective tool for players of "The Grand Mafia" to calculate optimal troop compositions and manage their in-game resources and social connections.

## 2. Goals

*   **Primary Goal:** To help users win more battles by providing an accurate troop counter calculator.
*   **Secondary Goal:** To provide a platform for users to connect with other players, track their progress, and manage their profiles.

## 3. User Stories

### 3.1. As a new user, I want to...

*   ...be able to create an account easily so that I can access the application's features.
*   ...be able to log in securely to my account.

### 3.2. As a logged-in user, I want to...

*   ...be able to calculate the optimal troop composition to counter my opponent's army.
*   ...be able to save my troop and enforcer details to my profile for easy access.
*   ...be able to customize my profile with an avatar.
*   ...be able to find and follow other users.
*   ...be able to change my password securely.
*   ...be able to upload screenshots to my profile.
*   ...be automatically redirected to the calculator page after logging in.
*   ...be able to analyze screenshots to update my profile data.
*   ...be able to correct the extracted data from the screenshot analysis to improve the accuracy of the OCR.

## 4. Non-Functional Requirements

### 4.1. Performance

*   The application should load quickly and respond to user input within a reasonable timeframe.
*   The troop calculation should be performed almost instantaneously.

### 4.2. Security

*   User passwords must be stored securely using modern hashing techniques.
*   The application should be protected against common web vulnerabilities (e.g., XSS, CSRF).
*   User data should be handled with care to ensure privacy.

### 4.3. Usability

*   The user interface should be intuitive and easy to navigate.
*   The application should be accessible to users with disabilities.
*   The application should be responsive and work well on different screen sizes.

### 4.4. Reliability

*   The application should be available and functioning correctly with minimal downtime.

## 5. Implemented Features

*   **User Accounts:** Users can create an account, log in, and log out.
*   **Troop Calculator:** A tool to calculate the optimal troop composition to counter an opponent's army.
*   **Enforcer Calculator:** A tool to calculate the best enforcers for a given situation.
*   **Resource Calculator:** A tool to help users manage their in-game resources.
*   **User Profiles:** Users can save their troop and enforcer details to their profile, and customize their profile with an avatar.
*   **Social Features:** Users can find and follow other users.
*   **Screenshot Uploads:** Users can upload screenshots to their profile.

## 6. Future Features

*   **Gear and Investment Calculator:** A tool to help users optimize their gear and investments.
*   **Direct Messaging:** Allow users to send direct messages to each other.
*   **OCR Training Interface:** An interface to allow users to correct the extracted data from the screenshot analysis to improve the accuracy of the OCR.

## 6. Assumptions

*   Users have a basic understanding of the game "The Grand Mafia."
*   Users are familiar with the concepts of troops, enforcers, and other in-game terminology.
*   The application is intended for personal, non-commercial use.

## 7. Development Requirements

### 7.1. CI/CD

*   A CI/CD pipeline should be established to automate testing and deployment.
*   Every commit to the main branch should trigger a build and run the test suite.
*   Automated deployments to a staging environment should be configured for pull requests.
*   Production deployments should be manual, triggered by a release tag.

### 7.2. Security

*   Regular security scans should be performed on the codebase to identify vulnerabilities.
*   Dependencies should be kept up-to-date to avoid known vulnerabilities.
*   The principle of least privilege should be applied to all system components.

### 7.3. Code Quality

*   The codebase should adhere to the PEP 8 style guide for Python.
*   Code should be well-documented with comments and docstrings.
*   A linter (e.g., Flake8) should be used to enforce code quality standards.
*   All new features should be accompanied by unit tests.

**Note:** The integration test for the `confirm_update` route is currently failing. This needs to be fixed.
