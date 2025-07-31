# API

This document outlines the API of the TGM-Calc project.

## 1. Authentication

The API uses session-based authentication. Users must be logged in to access the protected endpoints.

## 2. Endpoints

### 2.1. `GET /`

Returns the home page.

### 2.2. `POST /calculate`

Calculates the optimal troop composition to counter an opponent's army.

**Request Body:**

*   `bruisers`: The number of bruisers in the opponent's army.
*   `hitmen`: The number of hitmen in the opponent's army.
*   `bikers`: The number of bikers in the opponent's army.

**Response:**

A JSON object containing the optimal troop composition.

### 2.3. `GET /enforcer_calculator`

Returns the enforcer calculator page.

### 2.4. `POST /enforcer_calculator`

Calculates the best enforcers for a given situation.

**Request Body:**

*   `user_enforcers`: A string containing the user's enforcers.
*   `opponent_enforcers`: A string containing the opponent's enforcers.

**Response:**

A JSON object containing the optimal enforcer setup.

### 2.5. `GET /gear_calculator`

Returns the gear and investment calculator page.

### 2.6. `POST /gear_calculator`

Calculates the total attack and defense boost from gear and investments.

**Request Body:**

*   `gear`: A list of the user's gear.
*   `advanced_arms`: The level of the Advanced Arms investment.
*   `defensive_tactics`: The level of the Defensive Tactics investment.

**Response:**

A JSON object containing the total attack and defense boost.

### 2.7. `GET /building_cost_calculator`

Returns the building cost calculator page.

### 2.8. `POST /building_cost_calculator`

Calculates the investment required to get from level x to level y of a building.

**Request Body:**

*   `building_name`: The name of the building.
*   `current_level`: The current level of the building.
*   `target_level`: The target level of the building.

**Response:**

A JSON object containing the total cost.

### 2.9. `GET /user/<username>`

Returns a user's profile page.

### 2.10. `GET /follow/<username>`

Follows a user.

### 2.11. `GET /unfollow/<username>`

Unfollows a user.

### 2.12. `GET /profile`

Returns the user's profile page.

### 2.13. `POST /profile`

Updates the user's avatar or uploads a screenshot.

### 2.14. `GET /analyze_screenshot/<int:screenshot_id>`

Analyzes a screenshot and displays the extracted data.

### 2.15. `POST /confirm_update/<int:screenshot_id>`

Confirms and apply the extracted data to the user's profile.

### 2.14. `GET /find_friends`

Returns the find friends page.

### 2.15. `POST /find_friends`

Searches for users.

### 2.16. `GET /change_password`

Returns the change password page.

### 2.17. `POST /change_password`

Changes the user's password.

### 2.18. `POST /save_user_details`

Saves the user's troop and enforcer details.
