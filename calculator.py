def calculate_optimal_troops(opponent_troops):
    """
    Calculates the optimal troop composition to counter the opponent's troops.

    Args:
        opponent_troops (dict): A dictionary containing the opponent's troop
                                composition.
            Example: {'bruisers': 100, 'hitmen': 50, 'bikers': 75}

    Returns:
        dict: A dictionary containing the optimal troop composition.
    """
    optimal_troops = {'bruisers': 0, 'hitmen': 0, 'bikers': 0}

    # Counter logic:
    # Bikers are strong against Bruisers
    # Bruisers are strong against Hitmen
    # Hitmen are strong against Bikers

    if 'bruisers' in opponent_troops:
        optimal_troops['bikers'] += opponent_troops['bruisers']
    if 'hitmen' in opponent_troops:
        optimal_troops['bruisers'] += opponent_troops['hitmen']
    if 'bikers' in opponent_troops:
        optimal_troops['hitmen'] += opponent_troops['bikers']

    return optimal_troops
