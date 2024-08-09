// Define maze variables
let maze = []; // 2D array representing the maze
let numRows = 5; // Number of rows in the maze
let numCols = 5; // Number of columns in the maze
let startRow = numRows - 1; // Start position row index (bottom-right corner)
let startCol = numCols - 1; // Start position column index (bottom-right corner)
let endRow = 0; // End position row index (top-left corner)
let endCol = 0; // End position column index (top-left corner)
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
  maze[endRow][endCol] = 0; // Ensure end position is a path

  displayMaze();
}

// Function to enable goal setting mode
function enableGoalSetting() {
  settingGoal = true;
  document.getElementById("goal-button").disabled = true; // Disable the button while setting the goal
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
    document.getElementById("goal-button").disabled = false; // Enable the button after setting the goal
  }
}

// Function to enable start setting mode
function enableStartSetting() {
  settingStart = true;
  document.getElementById("start-button").disabled = true; // Disable the button while setting the start
}

// Function to set the start position
function setStart(row, col) {
  if (settingStart) {
    maze[startRow][startCol] = 0; // Clear the previous start cell

    startRow = row;
    startCol = col;
    maze[startRow][startCol] = 0; // Set the new start cell

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
      } else if (i === endRow && j === endCol) {
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
  return Math.abs(pointA[0] - pointB[0]) + Math.abs(pointA[1] - pointB[1]);
}

// Function to calculate Euclidean Distance
function euclideanDistance(pointA, pointB) {
  return Math.sqrt(
      Math.pow(pointA[0] - pointB[0], 2) + Math.pow(pointA[1] - pointB[1], 2)
  );
}

// Main function to solve the maze based on selected algorithm and heuristic
function solveMaze() {
  const algorithm = document.getElementById("algorithm").value;
  const heuristicType = document.getElementById("heuristic").value;

  if (algorithm === "astar") {
      aStarSearch(heuristicType);
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
  const gScore = Array(numRows)
      .fill(null)
      .map(() => Array(numCols).fill(Infinity));
  const fScore = Array(numRows)
      .fill(null)
      .map(() => Array(numCols).fill(Infinity));
  const cameFrom = {};

  const startNode = {
      x: startRow,
      y: startCol,
      g: 0,
      h: calculateHeuristic(heuristicType, [startRow, startCol], [endRow, endCol]),
      f: 0
  };
  openList.push(startNode);
  gScore[startRow][startCol] = 0;
  fScore[startRow][startCol] = startNode.h;

  console.log("A* Search started");
  console.log(`Start Node: (${startRow}, ${startCol})`);
  console.log(`Goal Node: (${endRow}, ${endCol})`);

  while (openList.length > 0) {
      // Sort openList to get the node with the least f value and apply tie-breaking
      openList.sort((a, b) => {
          if (a.f === b.f) {
              return (a.x + a.y) - (b.x + b.y);
          }
          return a.f - b.f;
      });

      const currentNode = openList.shift();
      const { x: currentX, y: currentY, g, h, f } = currentNode;

      // Print the current node details
      console.log(`Exploring Node: (${currentX}, ${currentY}) - g: ${g}, h: ${h}, f: ${f}`);

      // Color the current node as explored (yellow)
      await colorExploredNode([currentX, currentY]);

      if (currentX === endRow && currentY === endCol) {
          console.log(`Goal reached at (${currentX}, ${currentY})`);
          reconstructPath(cameFrom, currentNode);
          solving = false;
          return;
      }

      closedList.add(`${currentX}_${currentY}`);
      nodesExplored++;
      document.getElementById("nodes-explored").innerText = nodesExplored;

      for (const movement of [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
      ]) {
          const neighborX = currentX + movement[0];
          const neighborY = currentY + movement[1];

          if (
              neighborX < 0 ||
              neighborX >= numRows ||
              neighborY < 0 ||
              neighborY >= numCols ||
              maze[neighborX][neighborY] === 1 ||
              closedList.has(`${neighborX}_${neighborY}`)
          ) {
              continue;
          }

          const g = currentNode.g + 1;
          const h = calculateHeuristic(heuristicType, [neighborX, neighborY], [endRow, endCol]);
          const f = g + h;
          const neighborKey = `${neighborX}_${neighborY}`;
          const neighborNode = { x: neighborX, y: neighborY, g, h, f };

          const existingNodeIndex = openList.findIndex(node => node.x === neighborX && node.y === neighborY);

          if (existingNodeIndex !== -1) {
              if (g >= gScore[neighborX][neighborY]) {
                  continue;
              }
              openList[existingNodeIndex] = neighborNode;
          } else {
              openList.push(neighborNode);
          }

          cameFrom[neighborKey] = currentNode;
          gScore[neighborX][neighborY] = g;
          fScore[neighborX][neighborY] = f;

          // Print details about each neighbor
          console.log(`  Neighbor: (${neighborX}, ${neighborY}) - g: ${g}, h: ${h}, f: ${f}`);
      }
  }

  console.log("No path found");
  solving = false; // Set solving to false if no path is found
}



// Function to reconstruct the path and update the final steps taken
function reconstructPath(cameFrom, currentNode) {
  let path = [];
  while (currentNode) {
      path.push(currentNode);
      currentNode = cameFrom[`${currentNode.x}_${currentNode.y}`];
  }

  // Display the path in red
  path.reverse(); // Reverse to get path from start to end
  path.forEach(node => {
      document
          .querySelector(`#maze-grid tr:nth-child(${node.x + 1}) td:nth-child(${node.y + 1})`)
          .classList.add("red");
  });

  // Update steps taken to represent the final path length
  stepsTaken = path.length;
  document.getElementById("steps-taken").innerText = stepsTaken;

  console.log(`Final path length (steps taken): ${stepsTaken}`);
}


// Function to color a node as explored (yellow) with a delay
function colorExploredNode(node) {
  return new Promise((resolve) => {
    const [x, y] = node;

    // Check if the node is the start or goal, skip coloring if so
    if ((x === startRow && y === startCol) || (x === endRow && y === endCol)) {
      setTimeout(resolve, 500); // Just delay without changing color
    } else {
      const timeout = setTimeout(() => {
        document
          .querySelector(`#maze-grid tr:nth-child(${x + 1}) td:nth-child(${y + 1})`)
          .classList.add("explored");
        resolve();
      }, 500); // Wait for 0.5 seconds before resolving
      solveTimeouts.push(timeout);
    }
  });
}

// Add event listeners for the buttons
document
  .getElementById("goal-button")
  .addEventListener("click", enableGoalSetting);
document
  .getElementById("start-button")
  .addEventListener("click", enableStartSetting);
document
  //.getElementById("reset-button")
  //.addEventListener("click", resetMaze); // Added event listener for reset button

// Initial maze generation
generateRandomMaze();
