// Define maze variables
let maze = []; // 2D array representing the maze
let numRows = 7; // Number of rows in the maze
let numCols = 7; // Number of columns in the maze
let startRow = numRows - 1; // Start position row index (bottom-right corner)
let startCol = numCols - 1; // Start position column index (bottom-right corner)
let endRow = 0; // End position row index (top-left corner)
let endCol = 0; // End position column index (top-left corner)
let settingGoal = false; // Flag to indicate if we are setting the goal


// Function to generate a random maze using Recursive Backtracking
function generateRandomMaze() {
  console.log('Generating random maze...');

  // Initialize maze grid
  maze = [];
  for (let i = 0; i < numRows; i++) {
    maze.push([]);
    for (let j = 0; j < numCols; j++) {
      maze[i].push(1); // Initialize all cells as walls (1)
    }
  }

  // Ensure start and end positions are paths
  maze[startRow][startCol] = 0;
  maze[endRow][endCol] = 0;

  // Create the maze using Recursive Backtracking
  const stack = [[startRow, startCol]];
  const visited = Array.from({ length: numRows }, () => Array(numCols).fill(false));
  visited[startRow][startCol] = true;

  while (stack.length > 0) {
    const [currentRow, currentCol] = stack[stack.length - 1];
    const directions = [
      [-2, 0], [2, 0], [0, -2], [0, 2]
    ];
    shuffleArray(directions);

    let moved = false;
    for (const [dRow, dCol] of directions) {
      const nextRow = currentRow + dRow;
      const nextCol = currentCol + dCol;
      const betweenRow = currentRow + dRow / 2;
      const betweenCol = currentCol + dCol / 2;

      if (
        nextRow >= 0 && nextRow < numRows &&
        nextCol >= 0 && nextCol < numCols &&
        !visited[nextRow][nextCol]
      ) {
        maze[betweenRow][betweenCol] = 0; // Mark intermediate cell as path (0)
        maze[nextRow][nextCol] = 0; // Mark next cell as path (0)
        visited[nextRow][nextCol] = true; // Mark next cell as visited
        stack.push([nextRow, nextCol]);
        moved = true;
        break;
      }
    }

    if (!moved) {
      stack.pop(); // Backtrack
    }
  }

  // Ensure start and end are open
  maze[startRow][startCol] = 0;
  maze[endRow][endCol] = 0;

  // Display maze in HTML
  displayMaze();
}


// Function to enable goal setting mode
function enableGoalSetting() {
  settingGoal = true;
  document.getElementById('goal-button').disabled = true; // Disable the button while setting the goal
}

// Function to set the goal position
function setGoal(row, col) {
  if (settingGoal) {
    // Clear the previous goal cell
    maze[endRow][endCol] = 0;

    // Set the new goal cell
    endRow = row;
    endCol = col;
    maze[endRow][endCol] = 0;

    // Update the display
    displayMaze();
    settingGoal = false;
    document.getElementById('goal-button').disabled = false; // Enable the button after setting the goal
  }
}


// Function to toggle the state of a cell between wall and path
function toggleCellState(row, col) {
  if (row < 0 || row >= numRows || col < 0 || col >= numCols) {
    console.error('Cell coordinates are out of bounds');
    return;
  }

  // Toggle the cell's state
  if (maze[row][col] === 1) {
    maze[row][col] = 0; // Change wall to path
  } else if (maze[row][col] === 0) {
    maze[row][col] = 1; // Change path to wall
  }

  // Update the display
  displayMaze();
}

// Update the displayMaze function to call setGoal on cell click
function displayMaze() {
  let mazeContainer = document.getElementById('maze-grid');
  if (!mazeContainer) {
    console.error('Maze container not found');
    return;
  }

  mazeContainer.innerHTML = ''; // Clear previous maze

  for (let i = 0; i < numRows; i++) {
    let row = document.createElement('tr');
    for (let j = 0; j < numCols; j++) {
      let cell = document.createElement('td');
      if (i === startRow && j === startCol) {
        cell.classList.add('start');
      } else if (i === endRow && j === endCol) {
        cell.classList.add('end');
      } else if (maze[i][j] === 1) {
        cell.classList.add('wall');
      } else if (maze[i][j] === 2) {
        cell.classList.add('path');
        cell.classList.add('red'); // Add red class for solution path
      } else {
        cell.classList.add('path');
      }

      // Add a click event listener to toggle cell state or set goal
      cell.addEventListener('click', () => {
        if (settingGoal) {
          setGoal(i, j);
        } else {
          toggleCellState(i, j);
        }
      });

      row.appendChild(cell);
    }
    mazeContainer.appendChild(row);
  }
}

// Helper function to shuffle an array randomly
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Function to reset the maze
function resetMaze() {
  // Iterate over the maze grid and reset the solution path
  for (let i = 0; i < numRows; i++) {
    for (let j = 0; j < numCols; j++) {
      if (maze[i][j] === 2) {
        maze[i][j] = 0; // Reset solution path to regular path
      }
    }
  }

  // Update the display
  displayMaze();
}

// Function to calculate Manhattan distance
function manhattanDistance(x1, y1, x2, y2) {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

// Function to calculate Euclidean distance
function euclideanDistance(x1, y1, x2, y2) {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

// Function to solve the maze using the selected algorithm
function solveMaze() {
  let algorithm = document.getElementById('algorithm').value;
  let heuristic = document.getElementById('heuristic').value;

  if (algorithm !== 'astar' && algorithm !== 'ucs' && algorithm !== 'bestfirst') {
    console.log('Selected algorithm is not supported.');
    return;
  }

  console.log(`Solving maze using ${algorithm} with ${heuristic} heuristic...`);

  let openList = new PriorityQueue();
  let closedList = new Set();
  let path = [];
  let steps = 0;
  let nodesExplored = 0;

  openList.enqueue([startRow, startCol], 0); // Enqueue start position with cost 0

  let parents = {};
  parents[`${startRow},${startCol}`] = null;

  let cost = {};
  cost[`${startRow},${startCol}`] = 0;

  while (!openList.isEmpty()) {
    let [currentRow, currentCol] = openList.dequeue().element;
    steps++;

    if (currentRow === endRow && currentCol === endCol) {
      let node = `${endRow},${endCol}`;
      while (node) {
        path.unshift(node.split(',').map(Number));
        node = parents[node];
      }
      break;
    }

    closedList.add(`${currentRow},${currentCol}`);

    let directions = [
      [-1, 0], [1, 0], [0, -1], [0, 1]
    ];

    for (let [dRow, dCol] of directions) {
      let nextRow = currentRow + dRow;
      let nextCol = currentCol + dCol;
      let nextCell = `${nextRow},${nextCol}`;

      if (
        nextRow >= 0 && nextRow < numRows &&
        nextCol >= 0 && nextCol < numCols &&
        !closedList.has(nextCell) &&
        maze[nextRow][nextCol] === 0
      ) {
        let newCost = cost[`${currentRow},${currentCol}`] + 1;
        let priority = newCost;

        if (algorithm === 'astar' || algorithm === 'bestfirst') {
          if (heuristic === 'manhattan') {
            priority += manhattanDistance(nextRow, nextCol, endRow, endCol);
          } else if (heuristic === 'euclidean') {
            priority += euclideanDistance(nextRow, nextCol, endRow, endCol);
          }
        }

        if (!(nextCell in cost) || newCost < cost[nextCell]) {
          cost[nextCell] = newCost;
          openList.enqueue([nextRow, nextCol], priority);
          parents[nextCell] = `${currentRow},${currentCol}`;
        }
      }
    }
    nodesExplored++;
  }

  document.getElementById('steps-taken').innerText = steps;
  document.getElementById('nodes-explored').innerText = nodesExplored;

  if (path.length > 0) {
    displaySolvedMaze(path);
  } else {
    console.log('No path found');
  }
}

// PriorityQueue class
class PriorityQueue {
  constructor() {
    this.elements = [];
  }

  enqueue(element, priority) {
    this.elements.push({ element, priority });
    this.elements.sort((a, b) => a.priority - b.priority);
  }

  dequeue() {
    return this.elements.shift();
  }

  isEmpty() {
    return this.elements.length === 0;
  }
}

// Function to display the solved maze with the path in red
function displaySolvedMaze(path) {
  console.log('Displaying solved maze...');
  let mazeContainer = document.getElementById('maze-grid');
  if (!mazeContainer) {
    console.error('Maze container not found');
    return;
  }

  let solvedMaze = maze.map(row => row.slice());

  path.forEach(([row, col]) => {
    if (!(row === startRow && col === startCol) && !(row === endRow && col === endCol)) {
      solvedMaze[row][col] = 2; // Mark path as 2
    }
  });

  mazeContainer.innerHTML = '';
  for (let i = 0; i < numRows; i++) {
    let row = document.createElement('tr');
    for (let j = 0; j < numCols; j++) {
      let cell = document.createElement('td');
      if (i === startRow && j === startCol) {
        cell.classList.add('start');
      } else if (i === endRow && j === endCol) {
        cell.classList.add('end');
      } else if (solvedMaze[i][j] === 1) {
        cell.classList.add('wall');
      } else if (solvedMaze[i][j] === 2) {
        cell.classList.add('path');
        cell.classList.add('red'); // Add red class for solution path
      } else {
        cell.classList.add('path');
      }
      row.appendChild(cell);
    }
    mazeContainer.appendChild(row);
  }
}
// Add the button click listener
document.getElementById('goal-button').addEventListener('click', enableGoalSetting);

// Initial generation of maze
generateRandomMaze();
