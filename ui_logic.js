document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed. Initializing UI logic.");

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('loggedin')) {
        showToast('Logged in successfully.', 'success');
    }

    // Call initializeData from combat_logic.js to load game data
    if (typeof initializeData === 'function') {
        initializeData().then(() => {
            console.log("Game data initialized via initializeData() from ui_logic.js.");
        }).catch(error => {
            console.error("Error initializing game data from ui_logic.js:", error);
        });
    } else {
        console.error("initializeData function not found. Ensure combat_logic.js is loaded correctly.");
    }

    // Event Listeners for Buttons
    const btnRecommendTroopMix = document.getElementById('btn-recommend-troop-mix');
    if (btnRecommendTroopMix) {
        btnRecommendTroopMix.addEventListener('click', handleRecommendTroopMix);
    } else {
        console.error("Button 'btn-recommend-troop-mix' not found.");
    }

    const btnRecommendEnforcerSetup = document.getElementById('btn-recommend-enforcer-setup');
    if (btnRecommendEnforcerSetup) {
        btnRecommendEnforcerSetup.addEventListener('click', handleRecommendEnforcerSetup);
    } else {
        console.error("Button 'btn-recommend-enforcer-setup' not found.");
    }

    const btnSaveUserDetails = document.getElementById('btn-save-user-details');
    if (btnSaveUserDetails) {
        btnSaveUserDetails.addEventListener('click', handleSaveUserDetails);
    } else {
        console.error("Button 'btn-save-user-details' not found.");
    }

    populateLevelDropdown('opponent-tc-level');
    populateLevelDropdown('user-tc-level');
});

// --- Input Parsing Functions ---

function parseTroopInputs(textareaId) {
    const textarea = document.getElementById(textareaId);
    if (!textarea) {
        console.error(`Troop input textarea '${textareaId}' not found.`);
        return [];
    }
    const content = textarea.value.trim();
    if (!content) return [];

    const troops = [];
    const lines = content.split('\n');
    lines.forEach(line => {
        const parts = line.split(',');
        if (parts.length === 3) {
            const type = parts[0].trim();
            const tier = parts[1].trim();
            const quantity = parseInt(parts[2].trim(), 10);
            if (type && tier && quantity > 0) {
                troops.push({ type, tier, quantity });
            }
        }
    });
    return troops;
}

function parseEnforcerInputs(textareaId) {
    const textarea = document.getElementById(textareaId);
    if (!textarea) {
        console.error(`Enforcer input textarea '${textareaId}' not found.`);
        return [];
    }
    const content = textarea.value.trim();
    if (!content) return [];

    const enforcers = [];
    const entries = content.split(';');
    entries.forEach(entryStr => {
        const parts = entryStr.split(',');
        if (parts.length === 3) {
            const name = parts[0].trim();
            const tier = parts[1].trim();
            const hasWeaponStr = parts[2].trim().toLowerCase();
            if (name && tier && (hasWeaponStr === 'true' || hasWeaponStr === 'false')) {
                enforcers.push({
                    name: name,
                    tier: tier,
                    has_signature_weapon: (hasWeaponStr === 'true')
                });
            }
        }
    });
    return enforcers;
}

function parseAvailableEnforcers(textareaId) {
    const textarea = document.getElementById(textareaId);
    if (!textarea) {
        console.error(`Available enforcers textarea '${textareaId}' not found.`);
        return [];
    }
    const content = textarea.value.trim();
    if (!content) return [];

    const availableEnforcers = [];
    const entries = content.split(';');
    entries.forEach(entryStr => {
        const parts = entryStr.split(',');
        if (parts.length === 3) {
            const name = parts[0].trim();
            const tier = parts[1].trim();
            const hasWeaponStr = parts[2].trim().toLowerCase();
            if (name && tier && (hasWeaponStr === 'true' || hasWeaponStr === 'false')) {
                availableEnforcers.push({
                    name: name,
                    tier: tier,
                    has_signature_weapon: (hasWeaponStr === 'true')
                });
            } else {
                console.warn(`Malformed entry in available enforcers: "${entryStr}". Expected Name,Tier,true/false.`);
            }
        } else if (entryStr.trim()) { // Avoid warning for empty strings if there are trailing semicolons
            console.warn(`Malformed entry in available enforcers: "${entryStr}". Expected 3 parts separated by commas.`);
        }
    });
    return availableEnforcers;
}

function getTcLevel(inputId) {
    const element = document.getElementById(inputId);
    if (!element) {
        console.error(`TC level input '${inputId}' not found.`);
        return 0;
    }
    return parseInt(element.value, 10) || 0;
}

// --- Handler Function Stubs ---

async function handleRecommendTroopMix() {
    const spinner = document.querySelector('.loading-spinner');
    spinner.style.display = 'inline-block';
    console.log("Handling Recommend Troop Mix...");
    const opponentTroops = parseTroopInputs('opponent-troops-text');
    const opponentEnforcers = parseEnforcerInputs('opponent-enforcers-text');
    const opponentTcLevel = getTcLevel('opponent-tc-level');

    console.log("Parsed Opponent Data for Troop Mix Rec:", { opponentTroops, opponentEnforcers, opponentTcLevel });

    if (typeof recommendTroopMix === 'function') {
        const recommendation = await recommendTroopMix(opponentTroops, opponentEnforcers, { training_center_level: opponentTcLevel });
        displayTroopRecommendation(recommendation);
        if (recommendation && recommendation.simulation_result) {
            displayBattleLog(recommendation.simulation_result.log);
            showToast('Troop mix recommendation generated successfully.', 'success');
        } else if (recommendation && recommendation.error) {
             displayBattleLog(`Error generating troop mix: ${recommendation.error}`);
             showToast(`Error generating troop mix: ${recommendation.error}`, 'danger');
        } else {
            displayBattleLog("Could not generate troop mix recommendation or simulation.");
            showToast('Could not generate troop mix recommendation or simulation.', 'danger');
        }
    } else {
        console.error("recommendTroopMix function not found.");
        displayTroopRecommendation("Error: Core logic not available.");
        displayBattleLog("");
        showToast('Error: Core logic not available.', 'danger');
    }
    spinner.style.display = 'none';
}

function handleSaveUserDetails() {
    const userTroops = document.getElementById('user-troops-text').value;
    const userEnforcers = document.getElementById('user-available-enforcers').value;

    fetch('/save_user_details', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            'user_troops': userTroops,
            'user_enforcers': userEnforcers
        })
    }).then(response => {
        if (response.ok) {
            showToast('Your details have been saved.', 'success');
        } else {
            showToast('There was an error saving your details.', 'danger');
        }
    });
}

async function handleRecommendEnforcerSetup() {
    const spinner = document.querySelector('.loading-spinner');
    spinner.style.display = 'inline-block';
    console.log("Handling Recommend Enforcer Setup...");
    const opponentTroops = parseTroopInputs('opponent-troops-text');
    const opponentEnforcers = parseEnforcerInputs('opponent-enforcers-text');
    const opponentTcLevel = getTcLevel('opponent-tc-level');

    const userTroops = parseTroopInputs('user-troops-text');
    const userAvailableEnforcers = parseEnforcerInputs('user-available-enforcers');
    const userTcLevel = getTcLevel('user-tc-level');

    console.log("Parsed Data for Enforcer Setup Rec:");
    console.log("Opponent:", { opponentTroops, opponentEnforcers, opponentTcLevel });
    console.log("User:", { userTroops, userAvailableEnforcers, userTcLevel });

    if (typeof recommendEnforcerSetup === 'function') {
        const recommendation = await recommendEnforcerSetup(
            userTroops,
            { training_center_level: userTcLevel },
            opponentTroops,
            opponentEnforcers,
            { training_center_level: opponentTcLevel },
            userAvailableEnforcers
        );
        displayEnforcerRecommendation(recommendation);
        if (recommendation && recommendation.best_enforcer_recommendation && recommendation.best_enforcer_recommendation.simulation) {
            displayBattleLog(recommendation.best_enforcer_recommendation.simulation.log);
            showToast('Enforcer setup recommendation generated successfully.', 'success');
        } else if (recommendation && recommendation.error) {
            displayBattleLog(`Error generating enforcer setup: ${recommendation.error}`);
            showToast(`Error generating enforcer setup: ${recommendation.error}`, 'danger');
        } else {
            displayBattleLog("Could not generate enforcer setup recommendation or simulation.");
            showToast('Could not generate enforcer setup recommendation or simulation.', 'danger');
        }
    } else {
        console.error("recommendEnforcerSetup function not found.");
        displayEnforcerRecommendation("Error: Core logic not available.");
        displayBattleLog("");
        showToast('Error: Core logic not available.', 'danger');
    }
    spinner.style.display = 'none';
}



// --- Output Display Functions (Stubs) ---

function displayTroopRecommendation(data) {
    const outputElement = document.querySelector('#troop-mix-recommendation-output pre');
    if (outputElement) {
        outputElement.textContent = (typeof data === 'string') ? data : JSON.stringify(data, null, 2);
    } else {
        console.error("Output element for troop mix recommendation not found.");
    }
}

function displayEnforcerRecommendation(data) {
    const outputElement = document.querySelector('#enforcer-setup-recommendation-output pre');
    if (outputElement) {
        outputElement.textContent = (typeof data === 'string') ? data : JSON.stringify(data, null, 2);
    } else {
        console.error("Output element for enforcer setup recommendation not found.");
    }
}

function displayBattleLog(logData) {
    const outputElement = document.querySelector('#detailed-battle-log-output pre');
    if (outputElement) {
        if (Array.isArray(logData)) {
            outputElement.textContent = logData.join('\n');
        } else if (typeof logData === 'object') {
            outputElement.textContent = JSON.stringify(logData, null, 2);
        } else {
            outputElement.textContent = logData;
        }
    } else {
        console.error("Output element for detailed battle log not found.");
    }
}

function showToast(message, type = 'info') {
    const toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        console.error('Toast container not found.');
        return;
    }

    const toastEl = document.createElement('div');
    toastEl.className = `toast align-items-center text-white bg-${type} border-0`;
    toastEl.role = 'alert';
    toastEl.ariaLive = 'assertive';
    toastEl.ariaAtomic = 'true';

    const toastBody = document.createElement('div');
    toastBody.className = 'd-flex';
    toastBody.innerHTML = `
        <div class="toast-body">
            ${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    `;

    toastEl.appendChild(toastBody);
    toastContainer.appendChild(toastEl);

    const toast = new bootstrap.Toast(toastEl);
    toast.show();

    toastEl.addEventListener('hidden.bs.toast', () => {
        toastEl.remove();
    });
}
