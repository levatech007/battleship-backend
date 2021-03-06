var models = require('../models');
var Game = models.Game;
// p1 plays in the browser
//p2 is the computer

// Get JSON view of all the games currently in DB
function index(req, res) {
  Game.find({}, function(err, game){
    if (err) {
      res.send(err);
    } else {
      res.json(game);
    };
  });
};

function allRowColumnPossibilities(gridSize) { // creates all array possibilities with [row, column] (if 5x5, gridSize = 5)
  let numberPossibilitiesArray = Array.from(Array(gridSize).keys());
  let allPossibilities = [];
  numberPossibilitiesArray.map(oneRow => {
    numberPossibilitiesArray.map(oneColumn => {
      allPossibilities.push([oneRow, oneColumn]);
    });
  });
  return allPossibilities;
};

function isEqual(positions, guess) { // checks the equality of an array with 2 elements: [1,2] and [1,2] => true
  return positions[0] === guess[0] && positions[1] === guess[1];
};

function isHit(positionsArray, guess) { // checks if guess is in opposite player's ship positions array
  for(let i = 0; i < positionsArray.length; i++) {
    let oneItem = positionsArray[i];
    if (isEqual(oneItem, guess)) {
      return true
    };
  };
  return false
};

function makeShips(existing, length) {
  let horizontal = Math.random() > 0.5
  ship = []
  if(horizontal) {
    let col = Math.floor(Math.random() * (10-(length-1)))
    let row = Math.floor(Math.random() * (10))
    let start = [row, col];
    let free = !isHit(existing, start)
    if(free) {
      ship.push(start)
      for(let i = 1; i < length; i++) {
        let next = [row, col + i];
        let isFree = !isHit(existing, next)
        if(isFree) {
          ship.push(next);
        } else {
          return false
        }
      }
      return ship
    } else {
      return false
    }
  } else {
      let col = Math.floor(Math.random() * (length))
      let row = Math.floor(Math.random() * (10 -(length-1)))
      let start = [row, col];
      let free = !isHit(existing, start)
      if(free) {
        ship.push(start)
        for(let i = 1; i < length; i++) {
          let next = [row + i, col];
          let isFree = !isHit(existing, next)
          if(isFree) {
            ship.push(next);
          } else {
            return false
          }
        }
        return ship
      } else {
        return false
      }
    }
}

  function selectComputerShips() {
    const shipLengths = [5,4,3,3,2];
    let placedShips = [];
    shipLengths.map(ship => {
      let shipPlaced = false
      while (!shipPlaced) {
        let placeShip = makeShips(placedShips, ship);
        if (placeShip) {
          placeShip.map(coordinate => {
            placedShips.push(coordinate);
          })
        shipPlaced = true;
      }
    }
  })
  return placedShips

  }
  selectComputerShips()

function pickRandomElement(possibilitiesArray) {
  let randomIdx = Math.floor(Math.random() * possibilitiesArray.length);
  let element = possibilitiesArray[randomIdx];
  return element;
};

function removeFromP2Guesses(guesses, guess) {
  var filteredGuesses = guesses.filter((eachGuess, idx) => {
    return !isEqual(eachGuess, guess)
  });
  return filteredGuesses;
};

function create(req, res) {// Add new Game to DB on 'Enter' click
  let game = new Game ({
    computerShipLocations: selectComputerShips(),
    availableGuessesComputer: allRowColumnPossibilities(10),
  })
  game.save(function (err, game) {
    if (err) {
      res.send(err);
    } else {
      res.json(game);
    }
  });
};

function show(req, res) { // select a game by id
  Game.findOne({_id: req.params.game_id}, function(err, foundGame){
    if (err) res.send(err);
    else res.json(foundGame);
  });
};

function update(req, res) {
  Game.findOne({_id: req.params.game_id}, function(err, foundGame){
    if (err) {
      res.send(err);
    } else if (req.body.playerGuesses) {
      if (isHit(foundGame.computerShipLocations, req.body.playerGuesses)) {
        foundGame.playerGuesses = req.body.playerGuesses;
        foundGame.playerHits = (foundGame.playerHits + 1);
        foundGame.save(function(err, saved){
        res.send(true);
        });
      } else {
        res.send(false);
      };
    } else if (req.body.computerTurn) {
      let computerRandomGuess = pickRandomElement(foundGame.availableGuessesComputer);
      let doesGuessMatch = isHit(foundGame.playerShipLocations, computerRandomGuess);
      if (doesGuessMatch) {
        foundGame.computerHits = (foundGame.computerHits + 1);
        foundGame.availableGuessesComputer = removeFromP2Guesses(foundGame.availableGuessesComputer, computerRandomGuess);
        let response = [computerRandomGuess, 'match'];
        foundGame.save(function(err, saved){
          res.json(response);
        });
      } else {
          foundGame.availableGuessesComputer = removeFromP2Guesses(foundGame.availableGuessesComputer, computerRandomGuess);
          foundGame.save(function(err, saved){
            res.json(computerRandomGuess);
          });
      };
    } else {
      foundGame.playerShipLocations = req.body.playerShipLocations,
      foundGame.save(function(err, saved) {
        if(err) { console.log('error', err); }
        res.json(saved);
      });
    };
  });
};

function destroy(req, res) {
  Game.findByIdAndRemove(req.params.game_id, function(err, deletedGame) {
    if(err) {
      res.send(err);
    } else {
      res.send(200, `game with ID: ${req.params.game_id} was deleted!`);
    };
  });
};

module.exports.index = index;
module.exports.create = create;
module.exports.show = show;
module.exports.update = update;
module.exports.destroy = destroy;
