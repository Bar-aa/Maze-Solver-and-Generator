let maze = [];
let numRows = 9;
let numCols = 9;
let startRow = numRows - 1;
let startCol = numCols - 1;
let goals = [];
let settingGoal = false;
let settingStart = false;
let solving = false;
let solveTimeouts = [];
let stepsTaken = 0;
let nodesExplored = 0;

function generateRandomMaze() {
  maze = [];
  for (let i = 0; i < numRows; i++) {
    maze.push([]);
    for (let j = 0; j < numCols; j++) {
      if (Math.random() > 0.7){
        maze[i].push(1);
      }
      else{
        maze[i].push(0);
      }
    }
  }
  maze[startRow][startCol] = 0;
  for (let i = 0; i < goals.length; i++) {
    let goal = goals[i];
    maze[goal.row][goal.col] = 0;
    
  }
  displayMaze();
}

function enableGoalSetting() {
  settingGoal = true;
  document.getElementById("goal-button").disabled = true;
}

function setGoal(row, col) {
  if (settingGoal) {
    if (goals.length >= 2) {
      const oldGoal = goals.shift();
      maze[oldGoal.row][oldGoal.col] = 0;
    }

    goals.push({ row, col });
    maze[row][col] = 0;

    displayMaze();
    settingGoal = false;
    document.getElementById("goal-button").disabled = false;
  }
}

function enableStartSetting() {
  settingStart = true;
  document.getElementById("start-button").disabled = true;
}

function setStart(row, col) {
  if (settingStart) {
    maze[startRow][startCol] = 0;

    startRow = row;
    startCol = col;
    maze[startRow][startCol] = 0;

    displayMaze();
    settingStart = false;
    document.getElementById("start-button").disabled = false;
  }
}

function displayMaze() {
  let mazeContainer = document.getElementById("maze-grid");
  mazeContainer.innerHTML = "";

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
        cell.classList.add("path", "red");
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

function toggleCellState(row, col) {
  maze[row][col] = maze[row][col] === 1 ? 0 : 1;
  displayMaze();
}

function resetMaze() {
  solveTimeouts.forEach(clearTimeout);
  solving = false;
  solveTimeouts = [];

  for (let i = 0; i < numRows; i++) {
    for (let j = 0; j < numCols; j++) {
      if (maze[i][j] === 2) {
        maze[i][j] = 0;
      }
    }
  }

  stepsTaken = 0;
  nodesExplored = 0;
  document.getElementById("steps-taken").innerText = stepsTaken;
  document.getElementById("nodes-explored").innerText = nodesExplored;

  displayMaze();
}

function calculateHeuristic(heuristicType, pointA, pointB) {
  switch (heuristicType) {
    case "manhattan":
      return manhattanDistance(pointA, pointB);
    case "euclidean":
      return euclideanDistance(pointA, pointB);
  }
}

function manhattanDistance(pointA, pointB) {
  const distance = Math.abs(pointA[0] - pointB[0]) + Math.abs(pointA[1] - pointB[1]);
  return distance;
}

function euclideanDistance(pointA, pointB) {
  const distance = Math.sqrt(
    Math.pow(pointA[0] - pointB[0], 2) + Math.pow(pointA[1] - pointB[1], 2)
  );
  return distance;
}

function solveMaze() {
  const algorithm = document.getElementById("algorithm").value;
  const heuristicType = document.getElementById("heuristic").value;

  if (algorithm === "astar") {
    aStarSearch(heuristicType);
  } else if (algorithm === "ucs") {
    uniformCostSearch();
  }
  else if (algorithm === "bestfirst") {
    bestFirstSearch(heuristicType);
  }
}

async function aStarSearch(heuristicType) {
  if (solving) return; 
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

  do {
    if (openList.length === 0) {
      solving = false;
      return;
    }

    const current = openList.reduce((acc, node) => (node.f < acc.f ? node : acc), openList[0]);

    const currentIndex = openList.indexOf(current);
    openList.splice(currentIndex, 1);
    closedList.add(`${current.x},${current.y}`);

    
    if (goals.some(goal => goal.row === current.x && goal.col === current.y)) {
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

    await new Promise(resolve => solveTimeouts.push(setTimeout(resolve, 100))); 
  } while (openList.length > 0);

  solving = false;
}



async function uniformCostSearch() {
  if (solving) return; 
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

  do {
    if (openList.length === 0) {
      solving = false;
      return;
    }

    const current = openList.reduce((acc, node) => (node.g < acc.g ? node : acc), openList[0]);

    const currentIndex = openList.indexOf(current);
    openList.splice(currentIndex, 1);
    closedList.add(`${current.x},${current.y}`);

    if (goals.some(goal => goal.row === current.x && goal.col === current.y)) {
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
        }
      }
    }

    stepsTaken++;
    document.getElementById("steps-taken").innerText = stepsTaken;
    document.getElementById("nodes-explored").innerText = nodesExplored;

    await new Promise(resolve => solveTimeouts.push(setTimeout(resolve, 100))); 
    } while (openList.length > 0);

  solving = false;
}


async function bestFirstSearch(heuristicType) {
  if (solving) return;
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
  do {
    if (openList.length === 0) {
      solving = false;
      return;
    }

    const current = openList.reduce((acc, node) => (node.h < acc.h ? node : acc), openList[0]);

    const currentIndex = openList.indexOf(current);
    openList.splice(currentIndex, 1);
    closedList.add(`${current.x},${current.y}`);

    if (goals.some(goal => goal.row === current.x && goal.col === current.y)) {
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
      }
    }
    stepsTaken++;
    document.getElementById("steps-taken").innerText = stepsTaken;
    document.getElementById("nodes-explored").innerText = nodesExplored;

    await new Promise(resolve => solveTimeouts.push(setTimeout(resolve, 100))); 
  } while (openList.length > 0);

  solving = false;
}




function reconstructPath(cameFrom, current) {
  const totalPath = [current];
  while (`${current.x},${current.y}` in cameFrom) {
    current = cameFrom[`${current.x},${current.y}`];
    totalPath.unshift(current);
  }

  stepsTaken = totalPath.length - 1; 
  document.getElementById("steps-taken").innerText = stepsTaken;

  
  totalPath.forEach(({ x, y }, index) => {
    if (!(x === startRow && y === startCol)) {
      solveTimeouts.push(setTimeout(() => {
        maze[x][y] = 2; 
        displayMaze();
      }, index * 200)); 
    }
  });
}


function getNeighbors(x, y) {
  const neighbors = [];
  if (x > 0 && maze[x - 1][y] !== 1) neighbors.push({ x: x - 1, y });
  if (x < numRows - 1 && maze[x + 1][y] !== 1) neighbors.push({ x: x + 1, y });
  if (y > 0 && maze[x][y - 1] !== 1) neighbors.push({ x, y: y - 1 });
  if (y < numCols - 1 && maze[x][y + 1] !== 1) neighbors.push({ x, y: y + 1 });
  return neighbors;
}


document.addEventListener("DOMContentLoaded", () => {
  generateRandomMaze();
  document.getElementById("steps-taken").innerText = stepsTaken;
  document.getElementById("nodes-explored").innerText = nodesExplored;
});
