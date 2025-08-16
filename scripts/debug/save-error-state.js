// Run this in browser console when game is stuck to capture state
(function saveErrorState() {
  const die = document.querySelector('.die');
  const game = window.game;
  
  const errorState = {
    timestamp: new Date().toISOString(),
    error: 'Robot automation stateKind undefined bug',
    
    // Die element state
    dieElement: {
      currentPlayerType: die?.dataset.currentPlayerType,
      gameState: die?.dataset.gameState,
      activeColor: die?.dataset.activeColor,
      diceValues: Array.from(document.querySelectorAll('.die')).map(d => d.dataset.dieValue)
    },
    
    // Window game object
    windowGame: game ? {
      id: game.id,
      stateKind: game.stateKind,
      activePlayer: game.activePlayer,
      activePlay: game.activePlay ? {
        movesType: Array.isArray(game.activePlay.moves) ? 'array' : 'set',
        movesLength: Array.isArray(game.activePlay.moves) ? game.activePlay.moves.length : game.activePlay.moves?.size
      } : null
    } : 'NO_WINDOW_GAME',
    
    // Board state
    checkers: {
      total: document.querySelectorAll('.checker').length,
      moveable: document.querySelectorAll('[data-moveable="true"]').length,
      clickableDice: document.querySelectorAll('[data-clickable="true"]').length
    },
    
    url: window.location.href
  };
  
  console.log('🔍 ERROR STATE CAPTURED:', JSON.stringify(errorState, null, 2));
  
  // Also copy to clipboard if possible
  if (navigator.clipboard) {
    navigator.clipboard.writeText(JSON.stringify(errorState, null, 2));
    console.log('📋 Error state copied to clipboard');
  }
  
  return errorState;
})();