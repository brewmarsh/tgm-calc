// Global or namespaced object to store loaded game data
const gameData = {
    troopStats: null,
    enforcerBuffs: null,
    enforcerTierMultipliers: null,
    signatureWeaponBuffs: null,
    counterInfo: null,
    miscBuffs: null
};

/**
 * Asynchronously loads JSON data from a given file path.
 * @param {string} filePath The path to the JSON file.
 * @returns {Promise<object|null>} A promise that resolves with the parsed JSON object, or null if an error occurs.
 */
async function loadJSONData(filePath) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} for file ${filePath}`);
        }
        const data = await response.json();
        console.log(`Successfully loaded ${filePath}`);
        return data;
    } catch (error) {
        console.error(`Error loading JSON data from ${filePath}:`, error);
        return null;
    }
}

/**
 * Initializes all necessary game data by loading it from JSON files.
 * Stores the loaded data into the gameData object.
 * @returns {Promise<void>}
 */
async function initializeData() {
    console.log("Initializing game data...");
    const troopStatsPromise = loadJSONData('troop_stats.json');
    const enforcerBuffsPromise = loadJSONData('enforcer_buffs.json');
    const enforcerTierMultipliersPromise = loadJSONData('enforcer_tier_multipliers.json');
    const signatureWeaponBuffsPromise = loadJSONData('signature_weapon_buffs.json');
    const counterInfoPromise = loadJSONData('counter_info.json');
    const miscBuffsPromise = loadJSONData('misc_buffs.json');

    try {
        const [
            troopStats,
            enforcerBuffs,
            enforcerTierMultipliers,
            signatureWeaponBuffs,
            counterInfo,
            miscBuffs
        ] = await Promise.all([
            troopStatsPromise,
            enforcerBuffsPromise,
            enforcerTierMultipliersPromise,
            signatureWeaponBuffsPromise,
            counterInfoPromise,
            miscBuffsPromise
        ]);

        gameData.troopStats = troopStats;
        gameData.enforcerBuffs = enforcerBuffs;
        gameData.enforcerTierMultipliers = enforcerTierMultipliers;
        gameData.signatureWeaponBuffs = signatureWeaponBuffs;
        gameData.counterInfo = counterInfo;
        gameData.miscBuffs = miscBuffs;

        if (Object.values(gameData).every(data => data !== null)) {
            console.log("All game data initialized successfully.");
        } else {
            console.error("Some game data failed to load. Check individual error messages above.");
        }
    } catch (error) {
        console.error("An error occurred during the data initialization process:", error);
    }
}

/**
 * Placeholder function to get base stats for a troop type and tier.
 * @param {string} troopType - The type of the troop (e.g., "Bruiser").
 * @param {string} tier - The tier of the troop (e.g., "T1").
 * @returns {object|null} Base stats object (atk, def, hp) or null if not found.
 */
function getTroopBaseStats(troopType, tier) {
    console.log(`getTroopBaseStats attempting to find: troopType=${troopType}, tier=${tier}`);
    if (gameData.troopStats &&
        gameData.troopStats[troopType] &&
        gameData.troopStats[troopType][tier]) {
        const baseStats = gameData.troopStats[troopType][tier];
        // We are interested in atk, def, hp for combat calculations.
        // Other stats like speed, load, upkeep, influence are also available.
        return {
            atk: baseStats.atk,
            def: baseStats.def,
            hp: baseStats.hp
            // speed: baseStats.speed,
            // load: baseStats.load,
            // upkeep: baseStats.upkeep,
            // influence: baseStats.influence
        };
    }
    console.error(`Error: Base stats not found for troopType='${troopType}', tier='${tier}'. Check troop_stats.json and input names.`);
    return null;
}

/**
 * Placeholder function to apply enforcer buffs.
 * @param {object} currentStats - The current aggregated stats for a troop type.
 * Parses a buff name string to extract troop type and stat type.
 * @param {string} buffName - The buff name (e.g., "Biker ATK Up", "Crew HP Up").
 * @returns {object|null} Parsed details {squadType, statType, fullBuffName} or null.
 */
function parseBuffDetails(buffName) {
    if (!buffName || typeof buffName !== 'string') {
        console.warn(`parseBuffDetails: Invalid buffName input: ${buffName}`);
        return null;
    }

    const parts = buffName.split(' ');
    if (parts.length < 3) {
        console.warn(`parseBuffDetails: Buff name "${buffName}" is too short or malformed.`);
        return null;
    }

    let squadType = parts[0];
    const stat = parts[parts.length - 2].toUpperCase(); // ATK, DEF, HP
    const lastWord = parts[parts.length - 1].toUpperCase();

    if (lastWord !== 'UP' && lastWord !== 'DOWN') { // Assuming buffs are "Up" or "Down"
        console.warn(`parseBuffDetails: Buff name "${buffName}" does not end with "Up" or "Down".`);
        return null;
    }

    const validStats = ["ATK", "DEF", "HP"];
    if (!validStats.includes(stat)) {
        console.warn(`parseBuffDetails: Unrecognized stat type "${stat}" in buff "${buffName}".`);
        return null;
    }

    if (squadType.toUpperCase() === "CREW") {
        squadType = "Crew"; // Normalize
    } else {
        // Normalize troop type names if needed, e.g., "Bruisers" to "Bruiser" to match troop_stats keys
        // For now, assume keys in enforcer_buffs.json match keys in troop_stats.json
        // Example: If troop_stats.json uses "Bruiser", enforcer_buffs.json should use "Bruiser ATK Up"
        // This check ensures the squadType from buff matches a key in gameData.troopStats
        if (gameData.troopStats && !gameData.troopStats.hasOwnProperty(squadType)) {
             // A common case might be plural vs singular, e.g. "Bikers" vs "Biker"
            const singularSquadType = squadType.endsWith('s') ? squadType.slice(0, -1) : null;
            if (singularSquadType && gameData.troopStats.hasOwnProperty(singularSquadType)) {
                squadType = singularSquadType;
            } else {
                console.warn(`parseBuffDetails: Squad type "${squadType}" from buff "${buffName}" is not a recognized troop type and not "Crew".`);
                return null;
            }
        } else if (!gameData.troopStats) {
             console.warn(`parseBuffDetails: gameData.troopStats not available for squadType validation.`);
             // Proceed with caution or return null if strict validation is required before data load
        }
    }


    return {
        squadType: squadType, // e.g., "Bruiser", "Hitman", "Biker", "Mortar Car", "Crew"
        statType: stat,     // e.g., "ATK", "DEF", "HP"
        fullBuffName: buffName
    };
}


/**
 * Applies enforcer buffs to the battalion details.
 * @param {Array<object>} battalionDetails - Array of troop group stats.
 * @param {Array<object>} enforcers - Array of enforcer objects.
 * @returns {Array<object>} Modified battalionDetails with enforcer buffs applied.
 */
function applyEnforcerBuffs(battalionDetails, enforcers) {
    console.log("applyEnforcerBuffs called with enforcers:", JSON.stringify(enforcers, null, 2));

    if (!gameData.enforcerBuffs || !gameData.enforcerTierMultipliers) {
        console.warn("Enforcer buffs data or tier multipliers not loaded. Skipping enforcer buffs.");
        return battalionDetails;
    }

    const modifiedBattalionDetails = battalionDetails.map(group => ({ ...group, buffs_applied: group.buffs_applied || [] }));

    for (const enforcer of enforcers) {
        const enforcerData = gameData.enforcerBuffs[enforcer.name];
        if (!enforcerData) {
            console.warn(`Enforcer "${enforcer.name}" not found in enforcer_buffs.json. Skipping.`);
            continue;
        }

        const tierMultiplierData = gameData.enforcerTierMultipliers[enforcer.tier];
        if (!tierMultiplierData) {
            console.warn(`Tier "${enforcer.tier}" for enforcer "${enforcer.name}" not found in enforcer_tier_multipliers.json. Assuming 0 multiplier.`);
            // continue; // Or assume a default multiplier, e.g., 0 or 1 if appropriate
            var tierMultiplier = 0; // Explicitly setting to 0 if not found
        } else {
            var tierMultiplier = tierMultiplierData.percentage_benefit;
        }


        console.log(`Processing enforcer: ${enforcer.name} (Tier: ${enforcer.tier}, Multiplier: ${tierMultiplier})`);

        for (const buff of enforcerData.buffs) {
            if (buff.type !== "Combat") {
                console.log(`Skipping non-combat buff "${buff.name}" for enforcer ${enforcer.name}.`);
                continue;
            }

            const parsedBuff = parseBuffDetails(buff.name);
            if (!parsedBuff) {
                console.warn(`Failed to parse buff details for "${buff.name}" from enforcer ${enforcer.name}. Skipping this buff.`);
                continue;
            }

            const actualBuffPercentage = buff.max_value * tierMultiplier;
            if (actualBuffPercentage === 0) {
                 console.log(`Buff "${parsedBuff.fullBuffName}" for ${enforcer.name} results in 0% effect due to tier multiplier. Skipping.`);
                 continue;
            }

            console.log(`  Applying buff: ${parsedBuff.fullBuffName}, Type: ${parsedBuff.squadType}, Stat: ${parsedBuff.statType}, Base Value: ${buff.max_value}, Actual %: ${actualBuffPercentage.toFixed(4)}`);

            modifiedBattalionDetails.forEach(troopGroup => {
                if (troopGroup.error) return; // Skip groups with errors (e.g., base stats not found)

                const appliesToThisGroup = parsedBuff.squadType === "Crew" || parsedBuff.squadType === troopGroup.type;

                if (appliesToThisGroup) {
                    const targetStatKey = parsedBuff.statType.toLowerCase(); // "atk", "def", "hp"
                    const baseStatForCalcKey = `base_${targetStatKey}_total`; // e.g., "base_atk_total"

                    if (!troopGroup.hasOwnProperty(baseStatForCalcKey)) {
                        console.error(`  Error: Troop group ${troopGroup.type} ${troopGroup.tier} is missing '${baseStatForCalcKey}'. Cannot apply enforcer buff correctly.`);
                        return;
                    }

                    const baseValueForBuffCalc = troopGroup[baseStatForCalcKey];
                    const increase = baseValueForBuffCalc * actualBuffPercentage;

                    const originalStatValueBeforeThisBuff = troopGroup[targetStatKey];
                    troopGroup[targetStatKey] += increase;

                    troopGroup.buffs_applied.push({
                        buff_name: parsedBuff.fullBuffName,
                        source: `Enforcer: ${enforcer.name} (Tier: ${enforcer.tier})`,
                        value_percentage: actualBuffPercentage,
                        applied_to_stat: targetStatKey,
                        base_value_for_calc: baseValueForBuffCalc,
                        increase_amount: increase,
                        stat_value_before_this_buff: originalStatValueBeforeThisBuff,
                        stat_value_after_this_buff: troopGroup[targetStatKey]
                    });
                    console.log(`    Applied to ${troopGroup.type} ${troopGroup.tier}: ${targetStatKey} +${increase.toFixed(2)}. Old: ${originalStatValueBeforeThisBuff.toFixed(2)}, New: ${troopGroup[targetStatKey].toFixed(2)} (Base for calc: ${baseValueForBuffCalc.toFixed(2)})`);
                }
            });
        }
    }
    return modifiedBattalionDetails;
}

/**
 * Placeholder function to apply signature weapon buffs.
 * @param {object} currentStats - The current aggregated stats for a troop type.
 * Applies signature weapon buffs to the battalion details.
 * @param {Array<object>} battalionDetails - Array of troop group stats, having had misc and enforcer buffs applied.
 * @param {Array<object>} enforcers - Array of enforcer objects, including `has_signature_weapon` flag.
 * @returns {Array<object>} Modified battalionDetails with signature weapon buffs applied.
 */
function applySignatureWeaponBuffs(battalionDetails, enforcers) {
    console.log("applySignatureWeaponBuffs called with enforcers:", JSON.stringify(enforcers.filter(e => e.has_signature_weapon), null, 2));

    if (!gameData.signatureWeaponBuffs) {
        console.warn("Signature weapon buffs data not loaded. Skipping signature weapon buffs.");
        return battalionDetails;
    }

    const modifiedBattalionDetails = battalionDetails.map(group => ({ ...group })); // buffs_applied should already exist

    function processWeaponSkill(troopGroup, skill, weaponName, enforcerName, skillType) {
        if (!skill || !skill.name || typeof skill.buff_value !== 'number') {
            console.warn(`  Skipping ${skillType} for ${weaponName} (${enforcerName}) due to missing name or invalid buff_value.`);
            return;
        }

        const parsedBuff = parseBuffDetails(skill.name);
        if (!parsedBuff) {
            console.warn(`  Failed to parse signature weapon skill buff details for "${skill.name}" from ${weaponName} (${enforcerName}). Skipping this skill.`);
            return;
        }

        const actualBuffPercentage = skill.buff_value; // Signature weapon buffs are flat percentages

        if (actualBuffPercentage === 0) {
            console.log(`  Sig. Weapon Buff "${parsedBuff.fullBuffName}" for ${enforcerName} (${weaponName}) has 0% effect. Skipping.`);
            return;
        }

        console.log(`  Processing Sig. Weapon Skill: ${skillType} - ${parsedBuff.fullBuffName}, Actual %: ${actualBuffPercentage.toFixed(4)}`);

        const appliesToThisGroup = parsedBuff.squadType === "Crew" || parsedBuff.squadType === troopGroup.type;

        if (appliesToThisGroup) {
            const targetStatKey = parsedBuff.statType.toLowerCase(); // "atk", "def", "hp"
            const baseStatForCalcKey = `base_${targetStatKey}_total`;

            if (!troopGroup.hasOwnProperty(baseStatForCalcKey)) {
                console.error(`    Error: Troop group ${troopGroup.type} ${troopGroup.tier} is missing '${baseStatForCalcKey}'. Cannot apply signature weapon buff correctly.`);
                return;
            }

            const baseValueForBuffCalc = troopGroup[baseStatForCalcKey];
            const increase = baseValueForBuffCalc * actualBuffPercentage;

            const originalStatValueBeforeThisBuff = troopGroup[targetStatKey];
            troopGroup[targetStatKey] += increase;

            troopGroup.buffs_applied.push({
                buff_name: parsedBuff.fullBuffName,
                source: `Signature Weapon: ${weaponName} (${enforcerName}) - ${skillType}`,
                value_percentage: actualBuffPercentage,
                applied_to_stat: targetStatKey,
                base_value_for_calc: baseValueForBuffCalc,
                increase_amount: increase,
                stat_value_before_this_buff: originalStatValueBeforeThisBuff,
                stat_value_after_this_buff: troopGroup[targetStatKey]
            });
            console.log(`      Applied to ${troopGroup.type} ${troopGroup.tier}: ${targetStatKey} +${increase.toFixed(2)}. Old: ${originalStatValueBeforeThisBuff.toFixed(2)}, New: ${troopGroup[targetStatKey].toFixed(2)} (Base for calc: ${baseValueForBuffCalc.toFixed(2)})`);
        }
    }

    for (const enforcer of enforcers) {
        if (!enforcer.has_signature_weapon) {
            // console.log(`Enforcer ${enforcer.name} does not have signature weapon equipped. Skipping weapon buffs.`);
            continue;
        }

        const weaponData = gameData.signatureWeaponBuffs[enforcer.name];
        if (!weaponData) {
            console.warn(`Signature weapon data not found for enforcer "${enforcer.name}" in signature_weapon_buffs.json. Skipping.`);
            continue;
        }

        console.log(`Processing Signature Weapon for: ${enforcer.name} (Weapon: ${weaponData.weapon_name})`);

        modifiedBattalionDetails.forEach(troopGroup => {
            if (troopGroup.error) return;

            if (weaponData.basic_skill) {
                processWeaponSkill(troopGroup, weaponData.basic_skill, weaponData.weapon_name, enforcer.name, "Basic Skill");
            }
            if (weaponData.exclusive_skill) {
                processWeaponSkill(troopGroup, weaponData.exclusive_skill, weaponData.weapon_name, enforcer.name, "Exclusive Skill");
            }
        });
    }
    return modifiedBattalionDetails;
}

/**
 * Applies miscellaneous passive buffs to a troop group.
 * @param {object} currentGroupStats - Stats object for a specific troop group (e.g., {"type": "Bruiser", ... "atk": X, "def": Y, "hp": Z}).
 * @param {object} playerMiscBuffs - Player-specific miscellaneous buffs (e.g., {"training_center_level": 12}).
 * @returns {object} Modified currentGroupStats with buffs applied.
 */
function applyMiscPassiveBuffs(currentGroupStats, playerMiscBuffs) {
    console.log(`applyMiscPassiveBuffs processing for: ${currentGroupStats.type} ${currentGroupStats.tier}, Original DEF: ${currentGroupStats.def.toFixed(2)}`);

    const modifiedStats = { ...currentGroupStats }; // Work on a copy
    // Ensure buffs_applied array exists, even if no buffs are applied by this function.
    modifiedStats.buffs_applied = modifiedStats.buffs_applied || [];

    if (!gameData.miscBuffs || !gameData.miscBuffs.training_center_def_bonus) {
        console.warn("Misc buffs data or training_center_def_bonus not loaded. Skipping misc buffs application.");
        return modifiedStats; // Return stats potentially with an initialized empty buffs_applied array
    }

    // Training Center Defense Bonus
    if (playerMiscBuffs && playerMiscBuffs.hasOwnProperty('training_center_level')) {
        const tcLevel = playerMiscBuffs.training_center_level;
        const levelKey = `level_${tcLevel}`;
        const bonusPercentage = gameData.miscBuffs.training_center_def_bonus[levelKey];

        if (bonusPercentage !== undefined && typeof bonusPercentage === 'number') {
            const originalDef = modifiedStats.def; // DEF before this specific buff
            const defIncrease = originalDef * bonusPercentage;
            modifiedStats.def += defIncrease;

            modifiedStats.buffs_applied.push({
                buff_name: "Training Center DEF Bonus",
                source: `Training Center Level ${tcLevel}`,
                value: bonusPercentage,
                applied_to: "DEF",
                original_stat_value: originalDef,
                increase_amount: defIncrease,
                new_stat_value: modifiedStats.def
            });
            console.log(`Applied Training Center DEF Bonus (${(bonusPercentage * 100).toFixed(0)}%) to ${currentGroupStats.type} ${currentGroupStats.tier}. DEF: ${originalDef.toFixed(2)} -> ${modifiedStats.def.toFixed(2)} (Increase: ${defIncrease.toFixed(2)})`);
        } else {
            console.log(`No Training Center DEF Bonus found or invalid data for level ${tcLevel} for ${currentGroupStats.type} ${currentGroupStats.tier}.`);
        }
    } else {
        console.log(`Training Center level not provided in playerMiscBuffs for ${currentGroupStats.type} ${currentGroupStats.tier}. Skipping TC DEF buff.`);
    }

    // Future: Add other misc buffs here (e.g., investment_crew_buffs, underboss_gear_buffs)
    // Example:
    // if (gameData.miscBuffs.some_other_buff && playerMiscBuffs.some_flag) {
    //     // apply some_other_buff
    // }

    return modifiedStats;
}

/**
 * Calculates the total ATK, DEF, and HP for a given battalion.
 * @param {Array<object>} troops - Array of troop objects (e.g., {"type": "Bruiser", "tier": "T1", "quantity": 1000}).
 * @param {Array<object>} enforcers - Array of enforcer objects (e.g., {"name": "Bubba", "tier": "Grand", "has_signature_weapon": true}).
 * @param {object} playerMiscBuffs - Object for misc buffs (e.g., {"training_center_level": 12}).
 * @returns {object} Object with total_atk, total_def, total_hp, and detailed breakdown.
 */
function calculateBattalionStats(troops, enforcers, playerMiscBuffs) {
    console.log("calculateBattalionStats called with:");
    console.log("Troops:", JSON.stringify(troops, null, 2));
    console.log("Enforcers:", JSON.stringify(enforcers, null, 2));
    console.log("Player Misc Buffs:", JSON.stringify(playerMiscBuffs, null, 2));

    const battalionDetails = [];
    let totalBattalionStats = { atk: 0, def: 0, hp: 0 };

    if (!gameData.troopStats) {
        console.error("Troop stats data is not loaded. Cannot calculate battalion stats.");
        return {
            total_atk: 0,
            total_def: 0,
            total_hp: 0,
            details: [],
            error: "Troop stats not loaded"
        };
    }

    for (const troop of troops) {
        const baseStats = getTroopBaseStats(troop.type, troop.tier);

        if (baseStats) {
            const groupBaseAtk = baseStats.atk * troop.quantity;
            const groupBaseDef = baseStats.def * troop.quantity;
            const groupBaseHp = baseStats.hp * troop.quantity;

            let currentGroupStats = {
                type: troop.type,
                tier: troop.tier,
                quantity: troop.quantity,
                // Store base stats * quantity for enforcer/weapon buff calculations
                base_atk_total: groupBaseAtk,
                base_def_total: groupBaseDef,
                base_hp_total: groupBaseHp,
                // Initialize current atk, def, hp with these base totals
                atk: groupBaseAtk,
                def: groupBaseDef,
                hp: groupBaseHp,
                buffs_applied: []
            };

            // Apply Misc Passive Buffs first (e.g., Training Center)
            // These modify atk, def, hp directly.
            currentGroupStats = applyMiscPassiveBuffs(currentGroupStats, playerMiscBuffs);

            // Add to battalionDetails before enforcer/weapon buffs,
            // as those functions will iterate over battalionDetails.
            // Or, collect all currentGroupStats and then pass to enforcer/weapon buffs.
            // For now, let's push and then have applyEnforcerBuffs take battalionDetails.
            battalionDetails.push(currentGroupStats);

        } else {
            console.warn(`Skipping troop entry due to missing base stats: ${troop.type} ${troop.tier}`);
            // Ensure even error entries are pushed so indexing isn't off if processing later
            // though applyEnforcerBuffs should ideally just work on the passed array.
             battalionDetails.push({
                type: troop.type,
                tier: troop.tier,
                quantity: troop.quantity,
                error: `Base stats not found for ${troop.type} ${troop.tier}.`
            });
        }
    }

    // After all troop groups are processed and had misc buffs applied,
    // apply enforcer buffs which might affect multiple groups.
    // applyEnforcerBuffs will use base_xxx_total for its percentage calculations.
    let processedBattalionDetails = applyEnforcerBuffs(battalionDetails, enforcers);
    processedBattalionDetails = applySignatureWeaponBuffs(processedBattalionDetails, enforcers);


    // Recalculate totalBattalionStats from the final, buffed details
    totalBattalionStats = { atk: 0, def: 0, hp: 0 }; // Reset totals
    for (const group of processedBattalionDetails) { // Iterate over the result of buff applications
        if (!group.error) {
            totalBattalionStats.atk += group.atk;
            totalBattalionStats.def += group.def;
            totalBattalionStats.hp += group.hp;
        }
    }

    return {
        total_atk: totalBattalionStats.atk,
        total_def: totalBattalionStats.def,
        total_hp: totalBattalionStats.hp,
        details: processedBattalionDetails // Return the fully processed details
    };
}

// Example of how to call initializeData and then use other functions.
// This part would typically be triggered by an event (e.g., page load in browser)
// or called explicitly in a Node.js environment.
async function main() {
    await initializeData();

    // Example usage (can be removed or commented out for production)
    if (Object.values(gameData).every(data => data !== null)) {
        console.log("Game data available:", gameData);

        const exampleTroops = [
            { "type": "Bruiser", "tier": "T1", "quantity": 1000 },
            { "type": "Hitman", "tier": "T2", "quantity": 500 },
            { "type": "Biker", "tier": "T5", "quantity": 100 },
            { "type": "NonExistentType", "tier": "T1", "quantity": 100 }, // For testing error handling
            { "type": "Mortar Car", "tier": "T3", "quantity": 200}
        ];
        const exampleEnforcers = [
            { "name": "Bubba", "tier": "Grand", "has_signature_weapon": true },
            { "name": "Captain", "tier": "Elite", "has_signature_weapon": false }
        ];
        // Test with a valid level, a level not present, and without the property
        const exampleMiscBuffs_TC12 = { "training_center_level": 12 }; // Valid TC level
        const exampleMiscBuffs_TC10_Invalid = { "training_center_level": 10 }; // TC Level not in JSON
        const exampleMiscBuffs_NoTC = {}; // No TC level specified
        const exampleMiscBuffs_TC30 = {"training_center_level": 30}; // Another valid TC level, max in current JSON

        console.log("\n--- Test Case 1: Training Center Level 12 ---");
        const battalionStats_TC12 = calculateBattalionStats(exampleTroops, exampleEnforcers, exampleMiscBuffs_TC12);
        console.log("Calculated Battalion Stats (TC Level 12):", JSON.stringify(battalionStats_TC12, null, 2));

        console.log("\n--- Test Case 2: Training Center Level 10 (Not in JSON) ---");
        const battalionStats_TC10_Invalid = calculateBattalionStats(exampleTroops, exampleEnforcers, exampleMiscBuffs_TC10_Invalid);
        console.log("Calculated Battalion Stats (TC Level 10 - Invalid):", JSON.stringify(battalionStats_TC10_Invalid, null, 2));

        console.log("\n--- Test Case 3: No Training Center Level ---");
        const battalionStats_NoTC = calculateBattalionStats(exampleTroops, exampleEnforcers, exampleMiscBuffs_NoTC);
        console.log("Calculated Battalion Stats (No TC Level):", JSON.stringify(battalionStats_NoTC, null, 2));

        console.log("\n--- Test Case 4: Training Center Level 30 (Max Valid) ---");
        const battalionStats_TC30 = calculateBattalionStats(exampleTroops, exampleEnforcers, exampleMiscBuffs_TC30);
        console.log("Calculated Battalion Stats (TC Level 30):", JSON.stringify(battalionStats_TC30, null, 2));

        // Test getTroopBaseStats directly
        console.log("\n--- Direct getTroopBaseStats Tests ---");
        console.log("Bruiser T1 Base Stats:", getTroopBaseStats("Bruiser", "T1"));
        console.log("Direct test of getTroopBaseStats for Hitman T5:", getTroopBaseStats("Hitman", "T5"));
        console.log("Direct test of getTroopBaseStats for Invalid T1:", getTroopBaseStats("Invalid", "T1"));

    } else {
        console.error("Cannot proceed with examples, game data failed to load. Check file paths and JSON format.");
    }
}

// If this script is run directly (e.g., in Node.js) or to simulate auto-execution
// Ensure this is the way to run or test your script in your environment.
// For example, in Node.js, you would run `node combat_logic.js`
// In a browser, `initializeData()` would be called on an event like `DOMContentLoaded` or `window.onload`.
main().catch(error => {
    console.error("Error in main execution:", error);
});

// If this were a module for a browser, you might export functions:
// export { initializeData, calculateBattalionStats, gameData, getTroopBaseStats };
// Or attach to window object for global access in older script setups:
// window.CombatLogic = { initializeData, calculateBattalionStats, gameData, getTroopBaseStats };

console.log("combat_logic.js loaded. `main()` has been called to initialize data and run examples.");

// --- Counter Modifier Constants ---
const COUNTER_STRONG_MOD = 0.5; // Example: 50% damage bonus
const COUNTER_WEAK_MOD = -0.33;  // Example: 33% damage reduction (approx)
const MAX_BATTLE_ROUNDS = 100;

/**
 * Gets the counter modifier based on attacker and defender troop types.
 * @param {string} attackerType - The type of the attacking troop (e.g., "Bruisers", "Hitman").
 * @param {string} defenderType - The type of the defending troop.
 * @returns {number} The counter modifier (e.g., 0.5, -0.33, 0).
 */
function getCounterModifier(attackerType, defenderType) {
    if (!gameData.counterInfo) {
        console.warn("getCounterModifier: counter_info.json not loaded. Returning 0.");
        return 0;
    }

    // Normalize types: remove 's' if plural, ensure consistent casing (e.g., title case for lookup if needed)
    // Assuming keys in counter_info.json are singular (e.g., "Bruiser")
    const normalizedAttackerType = attackerType.endsWith('s') ? attackerType.slice(0, -1) : attackerType;
    const normalizedDefenderType = defenderType.endsWith('s') ? defenderType.slice(0, -1) : defenderType;

    // console.log(`getCounterModifier: Attacker: ${attackerType} -> ${normalizedAttackerType}, Defender: ${defenderType} -> ${normalizedDefenderType}`);

    const attackerCounterInfo = gameData.counterInfo[normalizedAttackerType];

    if (attackerCounterInfo) {
        if (attackerCounterInfo.strong_against && attackerCounterInfo.strong_against.includes(normalizedDefenderType)) {
            console.log(`  Counter: ${normalizedAttackerType} STRONG against ${normalizedDefenderType} (+${COUNTER_STRONG_MOD*100}%)`);
            return COUNTER_STRONG_MOD;
        }
        if (attackerCounterInfo.weak_against && attackerCounterInfo.weak_against.includes(normalizedDefenderType)) {
            console.log(`  Counter: ${normalizedAttackerType} WEAK against ${normalizedDefenderType} (${COUNTER_WEAK_MOD*100}%)`);
            return COUNTER_WEAK_MOD;
        }
    } else {
        // This warning might be too noisy if one side has no specific counter info (e.g. Wall vs troops)
        // console.warn(`getCounterModifier: Counter info not found for attacker type "${normalizedAttackerType}".`);
    }
    // Check if defender has info against attacker (for non-troop specific counters like Wall)
    const defenderCounterInfo = gameData.counterInfo[normalizedDefenderType];
     if (defenderCounterInfo) {
        // Example: If Wall is strong_against Bruiser, and attacker is Bruiser, defender is Wall
        // This part might need more sophisticated logic if counters are not always symmetrical
        // or if "Wall" type has its own specific counter entries against troop types.
        // For now, the provided structure is attacker-centric.
        // If Mortar Car is strong_against Wall, and attacker is Mortar Car, defender is Wall -> handled by attackerCounterInfo
    }


    return 0; // Neutral interaction
}


/**
 * Simulates a battle between two battalions.
 * @param {object} attackerBattalionOutput - The full result from calculateBattalionStats for the attacker.
 * @param {object} defenderBattalionOutput - The full result from calculateBattalionStats for the defender.
 * @returns {object} Battle result including winner, rounds, HP remaining, and log.
 */
function simulateBattle(attackerBattalionOutput, defenderBattalionOutput) {
    console.log("\n--- Starting Battle Simulation ---");
    console.log("Attacker Totals:",
        "ATK:", attackerBattalionOutput.total_atk.toFixed(0),
        "DEF:", attackerBattalionOutput.total_def.toFixed(0),
        "HP:", attackerBattalionOutput.total_hp.toFixed(0)
    );
    console.log("Defender Totals:",
        "ATK:", defenderBattalionOutput.total_atk.toFixed(0),
        "DEF:", defenderBattalionOutput.total_def.toFixed(0),
        "HP:", defenderBattalionOutput.total_hp.toFixed(0)
    );

    const simAttackerGroups = JSON.parse(JSON.stringify(attackerBattalionOutput.details.filter(g => !g.error)));
    const simDefenderGroups = JSON.parse(JSON.stringify(defenderBattalionOutput.details.filter(g => !g.error)));

    const initialAttackerTotalHp = Math.max(1, simAttackerGroups.reduce((sum, group) => sum + group.hp, 0));
    const initialDefenderTotalHp = Math.max(1, simDefenderGroups.reduce((sum, group) => sum + group.hp, 0));

    let battleLog = [];
    let roundsFought = 0;
    let winner = "draw";

    for (let round = 1; round <= MAX_BATTLE_ROUNDS; round++) {
        roundsFought = round; // Update roundsFought as the loop progresses
        battleLog.push(`\n--- Round ${round} ---`);

        let currentAttackerTotalHp_StartRound = simAttackerGroups.reduce((sum, group) => sum + Math.max(0, group.hp), 0);
        let currentDefenderTotalHp_StartRound = simDefenderGroups.reduce((sum, group) => sum + Math.max(0, group.hp), 0);

        battleLog.push(`Start of Round: Attacker HP: ${currentAttackerTotalHp_StartRound.toFixed(0)}, Defender HP: ${currentDefenderTotalHp_StartRound.toFixed(0)}`);

        if (currentAttackerTotalHp_StartRound === 0 || currentDefenderTotalHp_StartRound === 0) {
            battleLog.push("Battle ended: One side eliminated before actions this round.");
            // If battle ends at start of round, roundsFought should be round-1 as last full round.
            // However, if it's round 1 and one side is already 0 HP, roundsFought correctly is 0 if loop doesn't run.
            // If loop runs once and this hits, roundsFought would be 1, but it means one side was already 0.
            // Let's adjust roundsFought determination more carefully based on when break occurs.
            // If break here, this round didn't complete.
            roundsFought = round -1;
            break;
        }

        // Attacker's Damage Calculation Phase
        let total_damage_potential_by_attacker_this_round = 0;
        simAttackerGroups.forEach(att_group => {
            if (att_group.hp <= 0) return;
            let effective_atk_by_att_group_vs_all_defenders = 0;
            if (currentDefenderTotalHp_StartRound > 0) {
                simDefenderGroups.forEach(def_group => {
                    if (def_group.hp <= 0) return;
                    const modifier = getCounterModifier(att_group.type, def_group.type);
                    effective_atk_by_att_group_vs_all_defenders += att_group.atk * (1 + modifier) * (def_group.hp / currentDefenderTotalHp_StartRound);
                });
            }
            total_damage_potential_by_attacker_this_round += effective_atk_by_att_group_vs_all_defenders;
        });
        battleLog.push(`Attacker intends to deal: ${total_damage_potential_by_attacker_this_round.toFixed(0)} damage`);

        // Defender's Damage Calculation Phase
        let total_damage_potential_by_defender_this_round = 0;
        simDefenderGroups.forEach(def_group => {
            if (def_group.hp <= 0) return;
            let effective_atk_by_def_group_vs_all_attackers = 0;
            if (currentAttackerTotalHp_StartRound > 0) {
                simAttackerGroups.forEach(att_group => {
                    if (att_group.hp <= 0) return;
                    const modifier = getCounterModifier(def_group.type, att_group.type);
                    effective_atk_by_def_group_vs_all_attackers += def_group.atk * (1 + modifier) * (att_group.hp / currentAttackerTotalHp_StartRound);
                });
            }
            total_damage_potential_by_defender_this_round += effective_atk_by_def_group_vs_all_attackers;
        });
        battleLog.push(`Defender intends to deal: ${total_damage_potential_by_defender_this_round.toFixed(0)} damage`);

        battleLog.push("Damage Application Phase:");
        // Damage Application to Defender
        if (currentDefenderTotalHp_StartRound > 0) { // Check to prevent division by zero if defender HP was 0
            simDefenderGroups.forEach(def_group => {
                if (def_group.hp <= 0) return;
                 // Pro-rate damage if total defender HP is very low to avoid massive overkill logging on tiny HP pools
                const damage_share_to_def_group = total_damage_potential_by_attacker_this_round * (def_group.hp / currentDefenderTotalHp_StartRound);
                const original_hp = def_group.hp;
                def_group.hp = Math.max(0, def_group.hp - damage_share_to_def_group);
                battleLog.push(`  Defender's ${def_group.type || 'Unknown Type'} T${def_group.tier || 'N/A'} HP: ${original_hp.toFixed(0)} -> ${def_group.hp.toFixed(0)} (took ${damage_share_to_def_group.toFixed(0)})`);
            });
        }

        // Damage Application to Attacker
        if (currentAttackerTotalHp_StartRound > 0) { // Check to prevent division by zero
            simAttackerGroups.forEach(att_group => {
                if (att_group.hp <= 0) return;
                const damage_share_to_att_group = total_damage_potential_by_defender_this_round * (att_group.hp / currentAttackerTotalHp_StartRound);
                const original_hp = att_group.hp;
                att_group.hp = Math.max(0, att_group.hp - damage_share_to_att_group);
                battleLog.push(`  Attacker's ${att_group.type || 'Unknown Type'} T${att_group.tier || 'N/A'} HP: ${original_hp.toFixed(0)} -> ${att_group.hp.toFixed(0)} (took ${damage_share_to_att_group.toFixed(0)})`);
            });
        }

        // Check for elimination again after damage application for this round
        const attackerHpAfterRound = simAttackerGroups.reduce((sum, group) => sum + Math.max(0, group.hp), 0);
        const defenderHpAfterRound = simDefenderGroups.reduce((sum, group) => sum + Math.max(0, group.hp), 0);

        if (attackerHpAfterRound === 0 || defenderHpAfterRound === 0) {
            battleLog.push("Battle ended after round actions: One side eliminated.");
            // roundsFought is already `round` here, which is correct as this round completed.
            break;
        }

        if (round === MAX_BATTLE_ROUNDS) {
            battleLog.push("Battle ended: Max rounds reached.");
            // roundsFought is already `round` (MAX_BATTLE_ROUNDS)
            break;
        }
    }

    // --- Determine Winner ---
    const finalAttackerTotalHp = simAttackerGroups.reduce((sum, group) => sum + Math.max(0, group.hp), 0);
    const finalDefenderTotalHp = simDefenderGroups.reduce((sum, group) => sum + Math.max(0, group.hp), 0);

    battleLog.push(`\n--- Battle End ---`);
    battleLog.push(`Rounds Fought: ${roundsFought}`); // This will be the actual number of rounds fully or partially processed.
    battleLog.push(`Final Attacker HP: ${finalAttackerTotalHp.toFixed(0)} / ${initialAttackerTotalHp.toFixed(0)}`);
    battleLog.push(`Final Defender HP: ${finalDefenderTotalHp.toFixed(0)} / ${initialDefenderTotalHp.toFixed(0)}`);

    if (finalAttackerTotalHp > 0 && finalDefenderTotalHp <= 0) {
        winner = "attacker";
    } else if (finalDefenderTotalHp > 0 && finalAttackerTotalHp <= 0) {
        winner = "defender";
    } else if (finalAttackerTotalHp <= 0 && finalDefenderTotalHp <= 0) {
        winner = "draw";
        battleLog.push("Both sides eliminated. Result: Draw");
    } else { // Both sides have HP > 0, implies max rounds reached
        const attackerHpPercentage = (finalAttackerTotalHp / initialAttackerTotalHp) * 100;
        const defenderHpPercentage = (finalDefenderTotalHp / initialDefenderTotalHp) * 100;
        if (attackerHpPercentage > defenderHpPercentage) {
            winner = "attacker";
        } else if (defenderHpPercentage > attackerHpPercentage) {
            winner = "defender";
        } else {
            winner = "draw";
        }
        battleLog.push(`Max rounds reached or both survived. Winner by HP percentage: ${winner}`);
    }
    battleLog.push(`Winner: ${winner}`);

    const attacker_hp_remaining_percentage = (finalAttackerTotalHp / initialAttackerTotalHp) * 100;
    const defender_hp_remaining_percentage = (finalDefenderTotalHp / initialDefenderTotalHp) * 100;

    return {
        winner: winner,
        rounds_fought: roundsFought,
        attacker_hp_remaining_percentage: attacker_hp_remaining_percentage,
        defender_hp_remaining_percentage: defender_hp_remaining_percentage,
        log: battleLog
    };
}

// --- Troop Mix Recommendation Logic ---

// Placeholder - these should be chosen carefully based on available data
// Ensure these enforcers exist in your enforcer_buffs.json and signature_weapon_buffs.json
const DEFAULT_RECOMMENDATION_ENFORCERS = [
    { name: "Red Thorn", tier: "Grand", has_signature_weapon: true }, // Biker
    // { name: "El Santo", tier: "Grand", has_signature_weapon: true }, // Assuming this is Hitman or Bruiser
    { name: "Captain", tier: "Grand", has_signature_weapon: true }, // Hitman
    { name: "Tengu", tier: "Grand", has_signature_weapon: true },    // Placeholder, ensure this enforcer exists
    { name: "Bubba", tier: "Grand", has_signature_weapon: true },    // Bruiser
    // { name: "Hellcat", tier: "Grand", has_signature_weapon: true }  // Placeholder, ensure this enforcer exists
    { name: "The Professor", tier: "Grand", has_signature_weapon: true} // Crew Buffs
];
const DEFAULT_RECOMMENDATION_MISC_BUFFS = { "training_center_level": 25 }; // Example TC Level for user

/**
 * Recommends a troop mix to counter an opponent's battalion.
 * @param {Array<object>} opponentTroopList - Opponent's troops (e.g., [{"type": "Bruiser", "tier": "T1", "quantity": 1000}]).
 * @param {Array<object>} opponentEnforcers - Opponent's enforcers.
 * @param {object} opponentMiscBuffs - Opponent's miscellaneous buffs.
 * @returns {object} Recommendation object or error object.
 */
async function recommendTroopMix(opponentTroopList, opponentEnforcers, opponentMiscBuffs) {
    console.log("\n--- Starting Troop Mix Recommendation ---");
    console.log("Opponent Troops:", JSON.stringify(opponentTroopList));
    console.log("Opponent Enforcers:", JSON.stringify(opponentEnforcers));
    console.log("Opponent Misc Buffs:", JSON.stringify(opponentMiscBuffs));

    if (!gameData.troopStats || !gameData.counterInfo) {
        console.error("recommendTroopMix: Essential game data (troopStats or counterInfo) not loaded.");
        return { error: "Essential game data not loaded.", recommended_mix: [], simulation_result: null };
    }

    // Step A: Calculate Opponent's Stats
    const actualOpponentStats = calculateBattalionStats(opponentTroopList, opponentEnforcers, opponentMiscBuffs);
    if (!actualOpponentStats || actualOpponentStats.error || actualOpponentStats.total_hp <= 0) {
        console.error("recommendTroopMix: Failed to calculate opponent stats or opponent has no HP.", actualOpponentStats?.error);
        return { error: `Failed to calculate valid opponent stats or opponent has no HP. Details: ${actualOpponentStats?.error || 'N/A'}`, recommended_mix: [], simulation_result: null };
    }
    console.log(`Opponent Total HP calculated: ${actualOpponentStats.total_hp.toFixed(0)}`);

    // Step B: Identify Opponent's Dominant Combat Troop Type (Bruiser, Biker, Hitmen)
    const opponentTypeHpMap = { "Bruiser": 0, "Hitman": 0, "Biker": 0 }; // Use singular form for consistency
    let totalCombatHp = 0;
    actualOpponentStats.details.forEach(group => {
        if (group.error) return;
        // Normalize group type from plural (e.g., "Bruisers") to singular ("Bruiser") for map keys
        const singularType = group.type.endsWith('s') ? group.type.slice(0, -1) : group.type;
        if (opponentTypeHpMap.hasOwnProperty(singularType)) {
            opponentTypeHpMap[singularType] += group.hp;
            totalCombatHp += group.hp;
        }
    });

    if (totalCombatHp === 0) {
        console.error("recommendTroopMix: Opponent has no Bruisers, Hitmen, or Bikers, or their HP is zero.");
        return { error: "Opponent has no discernible combat troop presence (Bruisers, Hitmen, Bikers with HP > 0).", recommended_mix: [], simulation_result: null };
    }

    let dominantOpponentType = "";
    let maxHp = 0;
    for (const type in opponentTypeHpMap) {
        if (opponentTypeHpMap[type] > maxHp) {
            maxHp = opponentTypeHpMap[type];
            dominantOpponentType = type;
        }
    }
    console.log(`Opponent Dominant Combat Type: ${dominantOpponentType} (Total HP: ${maxHp.toFixed(0)})`);
    console.log("Opponent HP Map:", JSON.stringify(opponentTypeHpMap));


    // Step C: Determine Basic Counter Strategy
    let recommendedPrimaryType = "";
    let sacrificialType1 = "";
    let sacrificialType2 = "";

    // Ensuring types are singular for consistency with troopStats keys
    if (dominantOpponentType === "Bruiser") {
        recommendedPrimaryType = "Biker"; sacrificialType1 = "Hitman"; sacrificialType2 = "Bruiser";
    } else if (dominantOpponentType === "Biker") {
        recommendedPrimaryType = "Hitman"; sacrificialType1 = "Bruiser"; sacrificialType2 = "Biker";
    } else if (dominantOpponentType === "Hitman") {
        recommendedPrimaryType = "Bruiser"; sacrificialType1 = "Biker"; sacrificialType2 = "Hitman";
    } else {
        console.error(`recommendTroopMix: Could not determine a counter for dominant type: ${dominantOpponentType}`);
        return { error: `No counter strategy for dominant opponent type: ${dominantOpponentType}. This shouldn't happen if dominant type was identified.`, recommended_mix: [], simulation_result: null };
    }
    console.log(`Counter strategy: Primary: ${recommendedPrimaryType}, Sacrificial1: ${sacrificialType1}, Sacrificial2: ${sacrificialType2}`);

    // Step D: Generate One Candidate Mix
    const opponentTotalHp = actualOpponentStats.total_hp;
    const primaryUnitBaseStats_T4 = gameData.troopStats?.[recommendedPrimaryType]?.['T4'];

    if (!primaryUnitBaseStats_T4 || !primaryUnitBaseStats_T4.hp || primaryUnitBaseStats_T4.hp === 0) {
        console.warn(`recommendTroopMix: Base HP for T4 ${recommendedPrimaryType} not found or is zero. Using default HP of 50 for calculation.`);
        primaryUnitBaseStats_T4.hp = 50; // Default HP if not found, T4s usually have more, this is a fallback
    }

    // Aim for slightly more HP with the primary counter type than the opponent's total HP
    const estimatedPrimaryQty = Math.ceil((opponentTotalHp * 1.2) / primaryUnitBaseStats_T4.hp);
    const sacrificialQty = Math.ceil(estimatedPrimaryQty * 0.1); // 10% of primary for each sacrificial type

    const generatedMix = [
        { type: recommendedPrimaryType, tier: "T4", quantity: Math.max(100, estimatedPrimaryQty) },
        { type: sacrificialType1, tier: "T1", quantity: Math.max(100, sacrificialQty) }, // Using T1 for sacrificial
        { type: sacrificialType2, tier: "T1", quantity: Math.max(100, sacrificialQty) }  // Using T1 for sacrificial
    ];
    console.log("Generated User Mix:", JSON.stringify(generatedMix));


    // Step E: Evaluate Candidate Mix
    const userCandidateStats = calculateBattalionStats(generatedMix, DEFAULT_RECOMMENDATION_ENFORCERS, DEFAULT_RECOMMENDATION_MISC_BUFFS);
    if (!userCandidateStats || userCandidateStats.error || userCandidateStats.total_hp <= 0) {
        console.error("recommendTroopMix: Failed to calculate stats for the recommended user mix.", userCandidateStats?.error);
        return {
            error: `Failed to calculate stats for recommended mix. Details: ${userCandidateStats?.error || 'N/A'}`,
            recommended_mix: generatedMix,
            opponent_dominant_type: dominantOpponentType,
            simulation_result: null,
            assumed_user_enforcers: DEFAULT_RECOMMENDATION_ENFORCERS,
            assumed_user_misc_buffs: DEFAULT_RECOMMENDATION_MISC_BUFFS
        };
    }
    console.log(`User Candidate Mix Total HP: ${userCandidateStats.total_hp.toFixed(0)}`);

    const simulationResult = simulateBattle(userCandidateStats, actualOpponentStats);

    return {
        recommended_mix: generatedMix,
        opponent_dominant_type: dominantOpponentType,
        simulation_result: simulationResult,
        assumed_user_enforcers: DEFAULT_RECOMMENDATION_ENFORCERS,
        assumed_user_misc_buffs: DEFAULT_RECOMMENDATION_MISC_BUFFS,
        user_candidate_stats_summary: {
            total_atk: userCandidateStats.total_atk,
            total_def: userCandidateStats.total_def,
            total_hp: userCandidateStats.total_hp,
        },
        opponent_stats_summary: {
            total_atk: actualOpponentStats.total_atk,
            total_def: actualOpponentStats.total_def,
            total_hp: actualOpponentStats.total_hp,
        }
    };
}

// --- Enforcer Setup Recommendation Logic ---

/**
 * Provides a default list of available enforcers if none are specified by the user.
 * Assumes all are Grand tier and have signature weapons.
 * @returns {Array<object>} An array of enforcer objects.
 */
function getDefaultAvailableEnforcers() {
    if (!gameData.enforcerBuffs) {
        console.warn("getDefaultAvailableEnforcers: gameData.enforcerBuffs not loaded. Returning empty list.");
        return [];
    }
    // Filter out enforcers not present in signatureWeaponBuffs for `has_signature_weapon: true`
    return Object.keys(gameData.enforcerBuffs)
        .filter(name => gameData.signatureWeaponBuffs && gameData.signatureWeaponBuffs[name]) // Ensure they have weapon data
        .map(name => ({
            name: name,
            tier: "Grand",
            has_signature_weapon: true
        }));
}

/**
 * Utility function to generate k-combinations from an array.
 * @param {Array} array - The source array.
 * @param {number} k - The size of combinations to generate.
 * @returns {Array<Array>} An array of k-combinations.
 */
function getCombinations(array, k) {
    if (k === 0) return [[]];
    if (array.length < k) return [];
    const first = array[0];
    const rest = array.slice(1);
    const combsWithoutFirst = getCombinations(rest, k);
    const combsWithFirst = getCombinations(rest, k - 1).map(comb => [first, ...comb]);
    return [...combsWithFirst, ...combsWithoutFirst];
}


/**
 * Recommends an enforcer setup for a user's battalion against an opponent.
 * @param {Array<object>} userTroopList - User's troops.
 * @param {object} userMiscBuffs - User's miscellaneous buffs.
 * @param {Array<object>} opponentTroopList - Opponent's troops.
 * @param {Array<object>} opponentEnforcers - Opponent's enforcers.
 * @param {object} opponentMiscBuffs - Opponent's miscellaneous buffs.
 * @param {Array<object>} [availableUserEnforcers] - Optional. User's available enforcers.
 * @returns {object} Recommendation object or error object.
 */
async function recommendEnforcerSetup(
    userTroopList,
    userMiscBuffs,
    opponentTroopList,
    opponentEnforcers,
    opponentMiscBuffs,
    availableUserEnforcers
) {
    console.log("\n--- Starting Enforcer Setup Recommendation ---");
    // Log inputs (abbreviated for brevity in output)
    console.log("User Troops (count):", userTroopList.length, "User Misc Buffs:", JSON.stringify(userMiscBuffs));
    console.log("Opponent Troops (count):", opponentTroopList.length, "Opponent Enforcers (count):", opponentEnforcers.length);

    if (!gameData.enforcerBuffs || !gameData.troopStats || !gameData.signatureWeaponBuffs) {
        return { error: "Essential game data (enforcers, troops, or weapons) not loaded.", best_enforcer_recommendation: null, all_evaluated_setups: [] };
    }

    let resolvedAvailableEnforcers = availableUserEnforcers;
    if (!resolvedAvailableEnforcers || resolvedAvailableEnforcers.length === 0) {
        console.log("No specific availableUserEnforcers provided, using default set from gameData.");
        resolvedAvailableEnforcers = getDefaultAvailableEnforcers();
        if(resolvedAvailableEnforcers.length === 0) {
            return { error: "No available enforcers to form teams, even from defaults.", best_enforcer_recommendation: null, all_evaluated_setups: [] };
        }
    }
    // For now, we use hardcoded teams. Later, resolvedAvailableEnforcers would be used for dynamic team generation.
    // console.log("Using enforcer pool size (for future dynamic generation):", resolvedAvailableEnforcers.length);

    // A. Validate resolvedAvailableUserEnforcers
    const validatedAvailableEnforcers = resolvedAvailableEnforcers.filter(e => {
        const enforcerExists = gameData.enforcerBuffs && gameData.enforcerBuffs[e.name];
        const weaponDataExists = !e.has_signature_weapon || (gameData.signatureWeaponBuffs && gameData.signatureWeaponBuffs[e.name]);
        if (!enforcerExists) console.warn(`Available enforcer ${e.name} not in enforcerBuffs.json.`);
        if (e.has_signature_weapon && !weaponDataExists) console.warn(`Available enforcer ${e.name} marked with weapon, but no data in signatureWeaponBuffs.json.`);
        return enforcerExists && weaponDataExists;
    });

    if (validatedAvailableEnforcers.length < 5) {
        return { error: `Not enough valid available enforcers to form a team of 5. Need 5, found ${validatedAvailableEnforcers.length}.`, best_enforcer_recommendation: null, all_evaluated_setups: [] };
    }


    const actualOpponentStats = calculateBattalionStats(opponentTroopList, opponentEnforcers, opponentMiscBuffs);
    if (!actualOpponentStats || actualOpponentStats.error || actualOpponentStats.total_hp <= 0) {
        return { error: `Failed to calculate valid opponent stats. Details: ${actualOpponentStats?.error || 'Opponent HP is 0'}`, best_enforcer_recommendation: null, all_evaluated_setups: [] };
    }

    const baseUserStatsWithoutEnforcers = calculateBattalionStats(userTroopList, [], userMiscBuffs);
    if (!baseUserStatsWithoutEnforcers || baseUserStatsWithoutEnforcers.error || baseUserStatsWithoutEnforcers.total_hp <= 0) {
        return { error: `User's troops have no HP or stats calculation failed. Details: ${baseUserStatsWithoutEnforcers?.error || 'User HP is 0'}`, best_enforcer_recommendation: null, all_evaluated_setups: [] };
    }
    console.log(`Base User Stats (no enforcers): HP ${baseUserStatsWithoutEnforcers.total_hp.toFixed(0)}`);

    // B. Identify primaryUserCombatType
    let primaryUserCombatType = "";
    let maxUserQty = 0;
    const userCombatTypes = ["Bruiser", "Biker", "Hitman"]; // Singular form
    userTroopList.forEach(troop => {
        const singularType = troop.type.endsWith('s') ? troop.type.slice(0, -1) : troop.type;
        if (userCombatTypes.includes(singularType) && troop.quantity > maxUserQty) {
            maxUserQty = troop.quantity;
            primaryUserCombatType = singularType;
        }
    });
    if (!primaryUserCombatType) { // Fallback if no dominant combat type, or only mortar cars
        primaryUserCombatType = "Bruiser"; // Default or could pick based on overall highest quantity of any type
        console.log("No dominant Bruiser/Biker/Hitman type for user, defaulting primaryUserCombatType to Bruiser for enforcer scoring.");
    } else {
        console.log("Primary User Combat Type for enforcer scoring:", primaryUserCombatType);
    }


    // C. Select Candidate Underbosses (UBs)
    const PREFERRED_UB_NAMES = ["Red Thorn", "Captain", "The Professor", "Bubba", "Viper", "Banshee", "Enigma"]; // Using known enforcers
    let ubCandidates = validatedAvailableEnforcers
        .filter(e => PREFERRED_UB_NAMES.includes(e.name))
        .sort((a,b) => PREFERRED_UB_NAMES.indexOf(a.name) - PREFERRED_UB_NAMES.indexOf(b.name)) // Keep some preference order
        .slice(0, 3);

    if (ubCandidates.length === 0 && validatedAvailableEnforcers.length >= 1) {
        console.log("No preferred UBs found, using top 1-2 from available enforcers as fallback UB candidates.");
        // Simple fallback: take the first 1-2 available as UBs. Could be smarter.
        ubCandidates = validatedAvailableEnforcers.slice(0, Math.min(2, validatedAvailableEnforcers.length));
    }
     if (ubCandidates.length === 0 ) {
        return { error: "Could not select any Underboss candidates from available enforcers.", best_enforcer_recommendation: null, all_evaluated_setups: [] };
    }


    // D. Select Candidate Squad Enforcers & Generate Teams
    let candidateSetups = [];
    const MAX_TOTAL_CANDIDATE_TEAMS = 75; // Limit total teams generated

    for (const ub of ubCandidates) {
        if (candidateSetups.length >= MAX_TOTAL_CANDIDATE_TEAMS) break;

        const potentialSquadEnforcers = validatedAvailableEnforcers.filter(e => e.name !== ub.name);

        // Score potential squad enforcers
        const scoredSquadEnforcers = potentialSquadEnforcers.map(e => {
            let score = 0;
            const enforcerDetail = gameData.enforcerBuffs[e.name];
            if (enforcerDetail && enforcerDetail.buffs) {
                enforcerDetail.buffs.forEach(buff => {
                    if (buff.type !== "Combat") return;
                    const parsed = parseBuffDetails(buff.name);
                    if (parsed) {
                        if (parsed.squadType === "Crew" && (parsed.statType === "ATK" || parsed.statType === "DEF" || parsed.statType === "HP")) {
                            score += 1;
                        } else if (parsed.squadType === primaryUserCombatType && (parsed.statType === "ATK" || parsed.statType === "DEF" || parsed.statType === "HP")) {
                            score += 2; // Higher score for matching primary troop type
                        }
                    }
                });
            }
            return { ...e, score };
        }).sort((a, b) => b.score - a.score); // Sort by score descending

        const squadPool = scoredSquadEnforcers.slice(0, 7); // Top 7 for combinations

        if (squadPool.length < 4) {
            console.log(`Not enough squad enforcers in pool for UB ${ub.name} (need 4, got ${squadPool.length}). Skipping this UB.`);
            continue;
        }

        const squadCombinations = getCombinations(squadPool, 4);

        for (const squadCombination of squadCombinations) {
            if (candidateSetups.length >= MAX_TOTAL_CANDIDATE_TEAMS) break;

            const newTeamArray = [ub, ...squadCombination].map(e_full => ({ // e_full contains score, map back to original structure
                 name: e_full.name,
                 tier: e_full.tier, // Assuming tier is part of availableUserEnforcers object
                 has_signature_weapon: e_full.has_signature_weapon // Assuming this is part of availableUserEnforcers
            }));

            if (new Set(newTeamArray.map(e => e.name)).size === 5) { // Ensure 5 unique enforcers
                candidateSetups.push(newTeamArray);
            }
        }
    }

    if (candidateSetups.length === 0) {
        console.warn("No candidate teams generated. Check UB selection, squad pool, or MAX_TOTAL_CANDIDATE_TEAMS.");
        return { error: "No candidate enforcer teams could be generated.", best_enforcer_recommendation: null, all_evaluated_setups: [] };
    }
    console.log(`Generated ${candidateSetups.length} unique candidate enforcer teams for evaluation.`);


    let evaluatedSetups = [];
    for (const enforcerTeam of candidateSetups) {
        // console.log("Evaluating team:", enforcerTeam.map(e=>e.name).join(', ')); // Can be too verbose
        const currentUserBattalionWithThisTeam = calculateBattalionStats(userTroopList, enforcerTeam, userMiscBuffs);

        if (!currentUserBattalionWithThisTeam || currentUserBattalionWithThisTeam.error || currentUserBattalionWithThisTeam.total_hp <= 0) {
            console.warn(`  Skipping team due to calculation error or zero HP for user with this team. Error: ${currentUserBattalionWithThisTeam?.error}`);
            continue;
        }

        const simulationResult = simulateBattle(currentUserBattalionWithThisTeam, actualOpponentStats);
        evaluatedSetups.push({
            enforcer_team: enforcerTeam,
            user_stats_summary: {
                total_atk: currentUserBattalionWithThisTeam.total_atk,
                total_def: currentUserBattalionWithThisTeam.total_def,
                total_hp: currentUserBattalionWithThisTeam.total_hp,
            },
            simulation: simulationResult
        });
    }

    if (evaluatedSetups.length === 0) {
        return { error: "No enforcer setups could be evaluated successfully.", best_enforcer_recommendation: null, all_evaluated_setups: [] };
    }

    // Sort and Select Best
    evaluatedSetups.sort((a, b) => {
        if (a.simulation.winner === "attacker" && b.simulation.winner !== "attacker") return -1;
        if (b.simulation.winner === "attacker" && a.simulation.winner !== "attacker") return 1;
        // If both are wins for attacker, or both are not, sort by attacker HP remaining
        return b.simulation.attacker_hp_remaining_percentage - a.simulation.attacker_hp_remaining_percentage;
    });

    const bestSetup = evaluatedSetups.length > 0 ? evaluatedSetups[0] : null;

    console.log("Best setup identified:", bestSetup ? bestSetup.enforcer_team.map(e=>e.name).join(', ') : "None", "Sim winner:", bestSetup?.simulation.winner);

    return {
        best_enforcer_recommendation: bestSetup,
        all_evaluated_setups: evaluatedSetups.slice(0, Math.min(5, evaluatedSetups.length)) // Return top 5 or fewer
    };
}
