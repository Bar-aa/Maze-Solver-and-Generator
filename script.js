// Define maze variables
let maze = []; // 2D array representing the maze
let numRows = 9; // Number of rows in the maze
let numCols = 9; // Number of columns in the maze
let startRow = numRows - 1; // Start position row index (bottom-right corner)
let startCol = numCols - 1; // Start position column index (bottom-right corner)
let goals = []; // Array to store goal positions (can hold up to two goals)
let settingGoal = false; // Flag to indicate if we are setting the goal
let settingStart = false; // Flag to indicate if we are setting the start
let solving = false; // Flag to indicate if maze-solving is in progress
let solveTimeouts = []; // Array to store timeouts for cancelling
let stepsTaken = 0;
let nodesExplored = 0;

// Simplified maze generation function
function generateRandomMaze() {
  maze = [];
  for (let i = 0; i < numRows; i++) {
    maze.push([]);
    for (let j = 0; j < numCols; j++) {
      maze[i].push(Math.random() > 0.7 ? 1 : 0); // Randomly set cell as wall (1) or path (0)
    }
  }
  maze[startRow][startCol] = 0; // Ensure start position is a path
  goals.forEach(goal => maze[goal.row][goal.col] = 0); // Ensure all goal positions are paths

  console.log("Random Maze Generated:");
  console.table(maze);

  displayMaze();
}

// Function to enable goal setting mode
function enableGoalSetting() {
  settingGoal = true;
  document.getElementById("goal-button").disabled = true; // Disable the button while setting the goal
  console.log("Goal setting enabled.");
}

// Function to set the goal position
function setGoal(row, col) {
  if (settingGoal) {
    // Clear the previous goal cell if two goals are already set
    if (goals.length >= 2) {
      const oldGoal = goals.shift(); // Remove the oldest goal
      maze[oldGoal.row][oldGoal.col] = 0; // Reset old goal to path
      console.log("Old goal cleared at:", oldGoal);
    }

    // Set the new goal cell
    goals.push({ row, col });
    maze[row][col] = 0;

    console.log("New goal set at:", { row, col });

    // Update the display
    displayMaze();
    settingGoal = false;
    document.getElementById("goal-button").disabled = false; // Enable the button after setting the goal
  }
}

// Function to enable start setting mode
function enableStartSetting() {
  settingStart = true;
  document.getElementById("start-button").disabled = true; // Disable the button while setting the start
  console.log("Start setting enabled.");
}

// Function to set the start position
function setStart(row, col) {
  if (settingStart) {
    maze[startRow][startCol] = 0; // Clear the previous start cell

    startRow = row;
    startCol = col;
    maze[startRow][startCol] = 0; // Set the new start cell

    console.log("Start position set to:", { row, col });

    displayMaze();
    settingStart = false;
    document.getElementById("start-button").disabled = false; // Enable the button after setting the start
  }
}

// Update the displayMaze function to call setGoal on cell click
function displayMaze() {
  let mazeContainer = document.getElementById("maze-grid");
  mazeContainer.innerHTML = ""; // Clear previous maze

  for (let i = 0; i < numRows; i++) {
    let row = document.createElement("tr");
    for (let j = 0; j < numCols; j++) {
      let cell = document.createElement("td");
      if (i === startRow && j === startCol) {
        cell.classList.add("start");
      } else if (goals.some(goal => goal.row === i && goal.col === j)) {
        cell.classList.add("end");
      } else if (maze[i][j] === 1) {
        cell.classList.add("wall");
      } else if (maze[i][j] === 2) {
        cell.classList.add("path", "red"); // Apply the red color to the solution path
      } else {
        cell.classList.add("path");
      }

      cell.addEventListener("click", () => {
        if (settingGoal) {
          setGoal(i, j);
        } else if (settingStart) {
          setStart(i, j);
        } else {
          toggleCellState(i, j);
        }
      });

      row.appendChild(cell);
    }
    mazeContainer.appendChild(row);
  }
}

// Function to toggle cell state (wall or path)
function toggleCellState(row, col) {
  maze[row][col] = maze[row][col] === 1 ? 0 : 1;
  console.log(`Toggled cell at (${row}, ${col}) to:`, maze[row][col] === 1 ? "wall" : "path");
  displayMaze();
}

function resetMaze() {
  // Cancel any ongoing solving animations
  solveTimeouts.forEach(clearTimeout);
  solving = false;
  solveTimeouts = [];

  // Reset maze state
  for (let i = 0; i < numRows; i++) {
    for (let j = 0; j < numCols; j++) {
      if (maze[i][j] === 2) {
        maze[i][j] = 0; // Reset solution path to regular path
      }
    }
  }

  console.log("Maze reset.");

  // Reset steps taken and nodes explored
  stepsTaken = 0;
  nodesExplored = 0;
  document.getElementById("steps-taken").innerText = stepsTaken;
  document.getElementById("nodes-explored").innerText = nodesExplored;

  // Update the display
  displayMaze();
}

// Function to calculate the heuristic based on user's choice
function calculateHeuristic(heuristicType, pointA, pointB) {
  switch (heuristicType) {
    case "manhattan":
      return manhattanDistance(pointA, pointB);
    case "euclidean":
      return euclideanDistance(pointA, pointB);
    default:
      return manhattanDistance(pointA, pointB); // Default to Manhattan if none selected
  }
}

// Function to calculate Manhattan Distance
function manhattanDistance(pointA, pointB) {
  const distance = Math.abs(pointA[0] - pointB[0]) + Math.abs(pointA[1] - pointB[1]);
  console.log(`Manhattan distance from (${pointA}) to (${pointB}):`, distance);
  return distance;
}

// Function to calculate Euclidean Distance
function euclideanDistance(pointA, pointB) {
  const distance = Math.sqrt(
    Math.pow(pointA[0] - pointB[0], 2) + Math.pow(pointA[1] - pointB[1], 2)
  );
  console.log(`Euclidean distance from (${pointA}) to (${pointB}):`, distance);
  return distance;
}

// Main function to solve the maze based on selected algorithm and heuristic
function solveMaze() {
  const algorithm = document.getElementById("algorithm").value;
  const heuristicType = document.getElementById("heuristic").value;

  console.log(`Solving maze using ${algorithm} with ${heuristicType} heuristic`);

  if (algorithm === "astar") {
    aStarSearch(heuristicType);
  } else if (algorithm === "ucs") {
    uniformCostSearch();
  }
  else if (algorithm === "bestfirst") {
    bestFirstSearch(heuristicType);
  }
}

// Function to perform A* Search
async function aStarSearch(heuristicType) {
  if (solving) return; // Exit if already solving
  solving = true;

  nodesExplored = 0;
  document.getElementById("nodes-explored").innerText = nodesExplored;

  const openList = [];
  const closedList = new Set();
  const gScore = Array(numRows).fill(null).map(() => Array(numCols).fill(Infinity));
  const fScore = Array(numRows).fill(null).map(() => Array(numCols).fill(Infinity));
  const cameFrom = {};

  const startNode = {
    x: startRow,
    y: startCol,
    g: 0,
    h: Math.min(...goals.map(goal => calculateHeuristic(heuristicType, [startRow, startCol], [goal.row, goal.col]))),
    f: 0
  };
  openList.push(startNode);
  gScore[startRow][startCol] = 0;
  fScore[startRow][startCol] = startNode.h;

  console.log("A* Search started");
  console.log(`Start Node: (${startRow}, ${startCol})`);
  console.log(`Goal Nodes: ${goals.map(goal => `(${goal.row}, ${goal.col})`).join(' and ')}`);

  do {
    if (openList.length === 0) {
      console.log("No solution found");
      solving = false;
      return;
    }

    const current = openList.reduce((acc, node) => (node.f < acc.f ? node : acc), openList[0]);

    const currentIndex = openList.indexOf(current);
    openList.splice(currentIndex, 1);
    closedList.add(`${current.x},${current.y}`);

    // Check if the current node is a goal
    if (goals.some(goal => goal.row === current.x && goal.col === current.y)) {
      console.log("Goal reached:", { x: current.x, y: current.y });
      reconstructPath(cameFrom, current);
      solving = false;
      return;
    }

    const neighbors = getNeighbors(current.x, current.y);
    for (const neighbor of neighbors) {
      if (closedList.has(`${neighbor.x},${neighbor.y}`)) continue;

      const tentativeGScore = gScore[current.x][current.y] + 1;
      if (tentativeGScore < gScore[neighbor.x][neighbor.y]) {
        cameFrom[`${neighbor.x},${neighbor.y}`] = current;
        gScore[neighbor.x][neighbor.y] = tentativeGScore;
        fScore[neighbor.x][neighbor.y] = tentativeGScore + Math.min(
          ...goals.map(goal => calculateHeuristic(heuristicType, [neighbor.x, neighbor.y], [goal.row, goal.col]))
        );

        if (!openList.some(node => node.x === neighbor.x && node.y === neighbor.y)) {
          openList.push({
            ...neighbor,
            g: gScore[neighbor.x][neighbor.y],
            h: fScore[neighbor.x][neighbor.y] - gScore[neighbor.x][neighbor.y],
            f: fScore[neighbor.x][neighbor.y]
          });
          nodesExplored++;
        }
      }
    }

    stepsTaken++;
    document.getElementById("steps-taken").innerText = stepsTaken;
    document.getElementById("nodes-explored").innerText = nodesExplored;

    await new Promise(resolve => solveTimeouts.push(setTimeout(resolve, 100))); // Slow down for demonstration
  } while (openList.length > 0);

  solving = false;
}



// Function to perform Uniform Cost Search
async function uniformCostSearch() {
  if (solving) return; // Exit if already solving
  solving = true;

  nodesExplored = 0;
  document.getElementById("nodes-explored").innerText = nodesExplored;

  const openList = [];
  const closedList = new Set();
  const gScore = Array(numRows).fill(null).map(() => Array(numCols).fill(Infinity));
  const cameFrom = {};

  const startNode = {
    x: startRow,
    y: startCol,
    g: 0
  };
  openList.push(startNode);
  gScore[startRow][startCol] = 0;

  console.log("Uniform Cost Search started");
  console.log(`Start Node: (${startRow}, ${startCol})`);
  console.log(`Goal Nodes: ${goals.map(goal => `(${goal.row}, ${goal.col})`).join(' and ')}`);

  do {
    if (openList.length === 0) {
      console.log("No solution found");
      solving = false;
      return;
    }

    const current = openList.reduce((acc, node) => (node.g < acc.g ? node : acc), openList[0]);

    const currentIndex = openList.indexOf(current);
    openList.splice(currentIndex, 1);
    closedList.add(`${current.x},${current.y}`);

    // Check if the current node is a goal
    if (goals.some(goal => goal.row === current.x && goal.col === current.y)) {
      console.log("Goal reached:", { x: current.x, y: current.y });
      reconstructPath(cameFrom, current);
      solving = false;
      return;
    }

    const neighbors = getNeighbors(current.x, current.y);
    for (const neighbor of neighbors) {
      if (closedList.has(`${neighbor.x},${neighbor.y}`)) continue;

      const tentativeGScore = gScore[current.x][current.y] + 1;
      if (tentativeGScore < gScore[neighbor.x][neighbor.y]) {
        cameFrom[`${neighbor.x},${neighbor.y}`] = current;
        gScore[neighbor.x][neighbor.y] = tentativeGScore;

        if (!openList.some(node => node.x === neighbor.x && node.y === neighbor.y)) {
          openList.push({
            ...neighbor,
            g: gScore[neighbor.x][neighbor.y]
          });
          nodesExplored++;
          console.log(`Exploring Node: (${neighbor.x}, ${neighbor.y})`);
        }
      }
    }

    stepsTaken++;
    document.getElementById("steps-taken").innerText = stepsTaken;
    document.getElementById("nodes-explored").innerText = nodesExplored;

    await new Promise(resolve => solveTimeouts.push(setTimeout(resolve, 100))); // Slow down for demonstration
  } while (openList.length > 0);

  solving = false;
}


// Function to perform Best-First Search
async function bestFirstSearch(heuristicType) {
  if (solving) return; // Exit if already solving
  solving = true;

  nodesExplored = 0;
  document.getElementById("nodes-explored").innerText = nodesExplored;

  const openList = [];
  const closedList = new Set();
  const cameFrom = {};

  const startNode = {
    x: startRow,
    y: startCol,
    h: Math.min(...goals.map(goal => calculateHeuristic(heuristicType, [startRow, startCol], [goal.row, goal.col])))
  };
  openList.push(startNode);

  console.log("Best-First Search started");
  console.log(`Start Node: (${startRow}, ${startCol})`);
  console.log(`Goal Nodes: ${goals.map(goal => `(${goal.row}, ${goal.col})`).join(' and ')}`);

  do {
    if (openList.length === 0) {
      console.log("No solution found");
      solving = false;
      return;
    }

    const current = openList.reduce((acc, node) => (node.h < acc.h ? node : acc), openList[0]);

    const currentIndex = openList.indexOf(current);
    openList.splice(currentIndex, 1);
    closedList.add(`${current.x},${current.y}`);

    // Check if the current node is a goal
    if (goals.some(goal => goal.row === current.x && goal.col === current.y)) {
      console.log("Goal reached:", { x: current.x, y: current.y });
      reconstructPath(cameFrom, current);
      solving = false;
      return;
    }

    const neighbors = getNeighbors(current.x, current.y);
    for (const neighbor of neighbors) {
      if (closedList.has(`${neighbor.x},${neighbor.y}`)) continue;

      if (!openList.some(node => node.x === neighbor.x && node.y === neighbor.y)) {
        openList.push({
          ...neighbor,
          h: Math.min(...goals.map(goal => calculateHeuristic(heuristicType, [neighbor.x, neighbor.y], [goal.row, goal.col])))
        });
        cameFrom[`${neighbor.x},${neighbor.y}`] = current;
        nodesExplored++;
        console.log(`Exploring Node: (${neighbor.x}, ${neighbor.y})`);
      }
    }

    stepsTaken++;
    document.getElementById("steps-taken").innerText = stepsTaken;
    document.getElementById("nodes-explored").innerText = nodesExplored;

    await new Promise(resolve => solveTimeouts.push(setTimeout(resolve, 100))); // Slow down for demonstration
  } while (openList.length > 0);

  solving = false;
}




// Function to reconstruct the path from start to goal
function reconstructPath(cameFrom, current) {
  const totalPath = [current];
  while (`${current.x},${current.y}` in cameFrom) {
    current = cameFrom[`${current.x},${current.y}`];
    totalPath.unshift(current);
  }

  // Log the path found
  console.log("Path found:", totalPath);

  // Update stepsTaken with the length of the path (excluding the start node)
  stepsTaken = totalPath.length - 1; // Subtract 1 to exclude the start node
  document.getElementById("steps-taken").innerText = stepsTaken;

  // Animate the path
  totalPath.forEach(({ x, y }, index) => {
    if (!(x === startRow && y === startCol)) {
      solveTimeouts.push(setTimeout(() => {
        maze[x][y] = 2; // Mark this cell as part of the path
        displayMaze();
      }, index * 200)); // Add a delay for animation effect
    }
  });
}





// Function to get the valid neighbors of a cell
function getNeighbors(x, y) {
  const neighbors = [];
  if (x > 0 && maze[x - 1][y] !== 1) neighbors.push({ x: x - 1, y });
  if (x < numRows - 1 && maze[x + 1][y] !== 1) neighbors.push({ x: x + 1, y });
  if (y > 0 && maze[x][y - 1] !== 1) neighbors.push({ x, y: y - 1 });
  if (y < numCols - 1 && maze[x][y + 1] !== 1) neighbors.push({ x, y: y + 1 });
  return neighbors;
}

// Initialize a random maze when the page loads
document.addEventListener("DOMContentLoaded", () => {
  generateRandomMaze();
  document.getElementById("steps-taken").innerText = stepsTaken;
  document.getElementById("nodes-explored").innerText = nodesExplored;
});
