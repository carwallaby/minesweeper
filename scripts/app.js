// game board variables
var totalRows = 9,
    totalCols = 9,
    totalMines = 10;
// user variables
var flagsPlaced, unclicked, flagMode;
// 2-dimensional array of mine coordinates
var mineCoordinates = [];

// elements
var $board = $('#game-board'),
    $new = $('#new-game'),
    $flag = $('#flag-mode'),
    $statusText = $('#status-text'),
    $status = $('#game-status');

// utility -------------------------

// takes in 2 arrays as parameters. returns boolean - true if identical.
function identicalArrays(firstArray, secondArray) {
    if (firstArray.length !== secondArray.length) {
        // arrays aren't the same length, so can't be identical
        return false;
    }
    // go through each array index and compare the values
    for (var i = 0; i < firstArray.length; i++) {
        if (firstArray[i] !== secondArray[i]) {
            // equal index values don't match; not identical
            return false;
        }
    }
    // all values matched
    return true;
}

// takes in tile element. returns coordinate array.
function getTileCoordinates(tile) {
    var row = parseInt(tile.attr('data-row')),
        col = parseInt(tile.attr('data-col'));
    return [row, col];
}

// takes array of coordinates and returns associated tile
function getTileFromCoordinates(coordinates) {
    var row = coordinates[0],
        col = coordinates[1];
    return $('.game-tile[data-row="' + row + '"][data-col="' + col + '"]');
}

// returns random coordinate array
function getRandomCoordinates() {
    var row = Math.floor(Math.random() * totalRows) + 1;
    var col = Math.floor(Math.random() * totalCols) + 1;
    return [row, col];
}

// takes in coordinates array. returns boolean - true if valid coordinate pair.
function validCoordinatePair(coordinates) {
    var row = coordinates[0],
        col = coordinates[1];
    if (row > 0 && col > 0 && row <= totalRows && col <= totalCols) {
        // both measurements are between 1 and max
        return true;
    }
    return false;
}

// takes in coordinates array, returns boolean - true if coordinates map to current mine
function isMine(coordinates) {
    for (var i = 0; i < mineCoordinates.length; i++) {
        if (identicalArrays(coordinates, mineCoordinates[i])) {
            return true;
        }
    }
    return false;
}

// takes in coordinates array, returns array of all valid tile coordinates that touch the original coordinates
function getNeighborTiles(coordinates) {
    var row = coordinates[0],
        col = coordinates[1],
        neighbors = [];
    // coordinates of all potential neighboring tiles
    var potentialNeighbors = [
        [(row - 1), (col - 1)],
        [(row - 1), col],
        [(row - 1), (col + 1)],
        [row, (col - 1)],
        [row, (col + 1)],
        [(row + 1), (col - 1)],
        [(row + 1), col],
        [(row + 1), (col + 1)]
    ];
    // check if the potential neighbors are valid
    $.each(potentialNeighbors, function(index, value) {
        if (validCoordinatePair(value)) {
            neighbors.push(value);
        }
    });
    return neighbors;
}

// takes in coordinates array, returns number of mines coordinates are touching
function getTouchingMineCount(coordinates) {
    var count = 0;
    var neighbors = getNeighborTiles(coordinates);
    // go through each mine coordinate value
    for (var mine = 0; mine < mineCoordinates.length; mine++) {
        // go through each neighbor value
        for (var neighbor = 0; neighbor < neighbors.length; neighbor++) {
            // if neighbor is a mine, increment the count
            if (identicalArrays(mineCoordinates[mine], neighbors[neighbor])) {
                count++;
            }
        }
    }
    return count;
}

// reveals all current mines
function revealMines() {
    // go through each tile
    $('.game-tile').each(function() {
        var tile = $(this);
        var coordinates = getTileCoordinates(tile);
        if (isMine(coordinates)) {
            // if tile is a mine, remove button class and flag and add mine class
            tile.removeClass('button-3d').removeClass('flagged').addClass('mine');
        }
    });
}

// setup -------------------------

// takes in 2 numbers and returns template
function createTileTemplate(row, col) {
    var htmlString = '<div class="button-3d game-tile"';
    // add data values for coordinates
    htmlString += ' data-row="' + row + '"';
    htmlString += ' data-col="' + col + '"';
    htmlString += '></div>';
    return $(htmlString);
}

// fills in all of the tiles with coordinate data values
function populateBoard() {
    // make sure board is empty
    $board.empty();
    for (var row = 1; row <= totalRows; row++) {
        for (var col = 1; col <= totalCols; col++) {
            var $tile = createTileTemplate(row, col);
            $board.append($tile);
        }
    }
}

// populates 2d array of mine coordinates
function populateMineCoordinates() {
    // make sure saved mine coordinate array is empty
    mineCoordinates = [];
    // keep getting new coordinates until all mines are accounted for
    while (mineCoordinates.length < totalMines) {
        var duplicate = false;
        var coordinates = getRandomCoordinates();
        // check that new mine coordinates don't already exist
        for (var i = 0; i < mineCoordinates.length; i++) {
            if (identicalArrays(coordinates, mineCoordinates[i])) {
                duplicate = true;
                break;
            }
        }
        if (!duplicate) {
            // add a new mine as long as it's a unique value
            mineCoordinates.push(coordinates);
        }
    }
}

// set up board for new game :)
function initGame() {
    populateBoard();
    populateMineCoordinates();
    flagMode = false;
    $flag.removeClass('selected');
    flagsPlaced = 0;
    unclicked = totalRows * totalCols;
    $status.removeClass('winner');
    $statusText.text(totalMines + ' remaining.');
    // set up click handler on game tiles
    $('.game-tile').click(function() {
        var tile = $(this);
        if (flagMode) {
            toggleFlag(tile);
        } else {
            handleClick(tile);
        }
    });
    // set up flag handler
    $('.game-tile').bind('contextmenu', function(e) {
        e.preventDefault();
        var tile = $(this);
        toggleFlag(tile);
    });
}

// game -------------------------

// place a flag
function toggleFlag(tile) {
    if (tile.hasClass('flagged')) {
        tile.removeClass('flagged');
        flagsPlaced--;
    } else {
        // only as many flags as there are mines
        if (flagsPlaced < totalMines) {
            tile.addClass('flagged');
            flagsPlaced++;
        }
    }
    $statusText.text((totalMines - flagsPlaced) + ' remaining.');
}

// click on a tile that is touching no mines
function handleSafeTileClick(coordinates) {
    var neighbors = getNeighborTiles(coordinates);
    $.each(neighbors, function(index, value) {
        var tile = getTileFromCoordinates(value);
        // virtually click on all neighbor tiles that are still hidden
        if (!tile.hasClass('flat')) {
            handleClick(tile);
        }
    });
}

// handle user clicking on a tile
function handleClick(tile) {
    // we don't click this tile anymore
    tile.unbind('click').unbind('contextmenu');

    var coordinates = getTileCoordinates(tile);
    // clicked on a mine, so end the game
    if (isMine(coordinates)) {
        revealMines();
        $('.game-tile').unbind('click').unbind('contextmenu');
        $statusText.text('you lose!');
        return;
    }
    revealTile(tile);
    // increment unclicked tile count
    unclicked--;
    // all tiles are clicked besides mines, so end the game
    if (unclicked === totalMines) {
        tile.removeClass('button-3d').addClass('flat');
        $('.game-tile').unbind('click').unbind('contextmenu');
        $statusText.text('you win!');
        $status.addClass('winner');
    }
}

// add tile styling and reveal number of touching mines
function revealTile(tile) {
    tile.removeClass('button-3d').addClass('flat');
    var coordinates = getTileCoordinates(tile);
    var touchingMineCount = getTouchingMineCount(coordinates);
    // update flag count if a flagged tile is revealed
    if (tile.hasClass('flagged')) {
        tile.removeClass('flagged');
        flagsPlaced--;
        $statusText.text((totalMines - flagsPlaced) + ' remaining.');
    }
    if (touchingMineCount > 0) {
        tile.addClass('touches-' + touchingMineCount);
        tile.append('<span>' + touchingMineCount + '</span>');
    } else {
        handleSafeTileClick(coordinates);
    }
}

// buttons -------------------------

// start a new game
$new.click(function() {
    initGame();
});

// toggle flag mode
$flag.click(function() {
    $(this).toggleClass('selected');
    if (flagMode) {
        flagMode = false;
    } else {
        flagMode = true;
    }
});

// init -------------------------

initGame();
