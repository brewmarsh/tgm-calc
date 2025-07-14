document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed. Initializing UI logic.");

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
});

// --- Input Parsing Functions ---

function parseTroopInputs(listContainerId, typePrefix) {
    const container = document.getElementById(listContainerId);
    if (!container) {
        console.error(`Troop input container '${listContainerId}' not found.`);
        return [];
    }
    const troopGroups = container.querySelectorAll('.troop-group');
    const troops = [];
    troopGroups.forEach((group, index) => {
        const typeElement = group.querySelector(`.${typePrefix}-troop-type`);
        const tierElement = group.querySelector(`.${typePrefix}-troop-tier`);
        const quantityElement = group.querySelector(`.${typePrefix}-troop-quantity`);

        if (typeElement && tierElement && quantityElement) {
            const type = typeElement.value;
            const tier = tierElement.value;
            const quantity = parseInt(quantityElement.value, 10);

            if (type && tier && quantity > 0) {
                troops.push({ type, tier, quantity });
            }
        } else {
            console.warn(`Missing elements in troop group ${index + 1} within '${listContainerId}'.`);
        }
    });
    return troops;
}

function parseEnforcerInputs(listContainerId, typePrefix) {
    const container = document.getElementById(listContainerId);
    if (!container) {
        console.error(`Enforcer input container '${listContainerId}' not found.`);
        return [];
    }
    const enforcerGroups = container.querySelectorAll('.enforcer-group');
    const enforcers = [];
    enforcerGroups.forEach((group, index) => {
        const nameElement = group.querySelector(`.${typePrefix}-enforcer-name`);
        const tierElement = group.querySelector(`.${typePrefix}-enforcer-tier`);
        const weaponElement = group.querySelector(`.${typePrefix}-enforcer-weapon`);

        if (nameElement && tierElement && weaponElement) {
            const name = nameElement.value.trim();
            const tier = tierElement.value;
            const has_signature_weapon = weaponElement.checked;

            if (name) {
                enforcers.push({ name, tier, has_signature_weapon });
            }
        } else {
            console.warn(`Missing elements in enforcer group ${index + 1} within '${listContainerId}'.`);
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
    console.log("Handling Recommend Troop Mix...");
    const opponentTroops = parseTroopInputs('opponent-troops-list', 'opponent');
    const opponentEnforcers = parseEnforcerInputs('opponent-enforcers-list', 'opponent');
    const opponentTcLevel = getTcLevel('opponent-tc-level');

    console.log("Parsed Opponent Data for Troop Mix Rec:", { opponentTroops, opponentEnforcers, opponentTcLevel });

    if (typeof recommendTroopMix === 'function') {
        const recommendation = await recommendTroopMix(opponentTroops, opponentEnforcers, { training_center_level: opponentTcLevel });
        displayTroopRecommendation(recommendation);
        if (recommendation && recommendation.simulation_result) {
            displayBattleLog(recommendation.simulation_result.log);
        } else if (recommendation && recommendation.error) {
             displayBattleLog(`Error generating troop mix: ${recommendation.error}`);
        } else {
            displayBattleLog("Could not generate troop mix recommendation or simulation.");
        }
    } else {
        console.error("recommendTroopMix function not found.");
        displayTroopRecommendation("Error: Core logic not available.");
        displayBattleLog("");
    }
}

async function handleRecommendEnforcerSetup() {
    console.log("Handling Recommend Enforcer Setup...");
    const opponentTroops = parseTroopInputs('opponent-troops-list', 'opponent');
    const opponentEnforcers = parseEnforcerInputs('opponent-enforcers-list', 'opponent');
    const opponentTcLevel = getTcLevel('opponent-tc-level');

    const userTroops = parseTroopInputs('user-troops-list', 'user');
    const userAvailableEnforcers = parseAvailableEnforcers('user-available-enforcers');
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
        } else if (recommendation && recommendation.error) {
            displayBattleLog(`Error generating enforcer setup: ${recommendation.error}`);
        } else {
            displayBattleLog("Could not generate enforcer setup recommendation or simulation.");
        }
    } else {
        console.error("recommendEnforcerSetup function not found.");
        displayEnforcerRecommendation("Error: Core logic not available.");
        displayBattleLog("");
    }
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
