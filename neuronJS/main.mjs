const debug = false;
const inhibProbThreshold = 0.66;
const N = 2 ** 7;
const initPotential = 40 * 1e-3;
const potentialThreshold = 56 * 1e-3;
const connectionProbThreshold = 0.25;  // probability threshold to form a connection between neurons
const lambda = 1 * 1e-3;

const canvasWidth = 1200;
const canvasHeight = 600;

const chartWidth = canvasWidth;
const chartHeight = 300;

const drawPlot = true;
const chartInterval = 10;
const distanceConvert = 0.00000357;

function convertPixelsToMeters(w, h) {

  return;
}


class Neuron {
  constructor(id, membranePotential, x, y, isInhib) {
    // this.tau = tau;
    this.id = id;
    this.membranePotential = membranePotential;
    this.activity = 0;
    this.isFiring = false;
    this.isInhib = isInhib;
    this.x = x || Math.random() * canvas.width;
    this.y = y || Math.random() * canvas.height;
    this.incomingConnections = [];
    this.outgoingConnections = [];
    this.molecules = [];
    this.outgoingSignals = [];
    this.signalSign = this.isInhib ? -1 : 1;
    this.signalStrength = 120 * 1e-3 * this.signalSign;
    this.time = 0;
    this.firingRateHistory = [];
    this.maxHistoryLength = 100;
    this.color = this.isInhib ? 'red' : 'blue';
    this.minThreshold = 25 * 1e-3;
    this.isRefractory = false;
    this.initRefractoryTime = 0.1 + Math.random() * 3;
    this.refractoryTime = 0;
    this.refractoryPotential = 35 * 1e-3;
  }

  triggerRefractory() {
    this.isRefractory = true;
    this.refractoryTime = this.initRefractoryTime;
  }

  updateRefractory() {
    if (this.isRefractory) {
      this.refractoryTime -= 1;
    }
    if (this.refractoryTime <= 0) {
      this.isRefractory = false;
      this.membranePotential = initPotential + (0.5 - Math.random()) / 1000;
    }
  }

  // Method to trigger signal propagation
  triggerSignal(targetNeuron) {
    const signal = new Signal(this.x, this.y, targetNeuron.x, targetNeuron.y, this.isInhib, targetNeuron, this.signalStrength);
    this.outgoingSignals.push(signal);
  }

  // Method to add an incoming connection from another neuron
  addIncomingConnection(sourceNeuron) {
    this.incomingConnections.push(sourceNeuron);
  }

  // Method to add an outgoing connection to another neuron
  addOutgoingConnection(targetNeuron) {
    this.outgoingConnections.push(targetNeuron);
  }

  // Method to update the firing rate history
  updateFiringRateHistory() {
    if (this.firingRateHistory.length >= this.maxHistoryLength) {
      this.firingRateHistory.shift(); // Remove the oldest data point
    }
    this.firingRateHistory.push(this.membranePotential);
  }

  // Method to propagate the signal to outgoing connections
  propagateSignal() {
    // reset membrane potential after giving a spike
    this.membranePotential = this.refractoryPotential;
  }

  // Method to receive a signal from an incoming connection
  receiveSignal(signalStrength) {
    // Modify the neuron's behavior based on the received signal
    // For example, you can adjust the firing rate or other properties here.

    if (debug) {
      console.log(`${this.id} Received signal with strength ${signalStrength}`);
    }

    // console.log(`${this.id} Received signal with strength ${signalStrength}, its potential from ${this.membranePotential}`);

    this.membranePotential += (signalStrength);

    // console.log(`${this.id} Received signal with strength ${signalStrength}, its potential to ${this.membranePotential}`);

    // reset if the value is too low or is to high
    // this.membranePotential = Math.max(this.minThreshold, this.membranePotential);

    // this.membranePotential = Math.min(this.maxThreshold, this.membranePotential);
  }

  // Method to toggle firing and trigger signal propagation
  toggleFiring() {
    this.isFiring = !this.isFiring;

    if (this.isFiring) {
      if (debug) {
        console.log(`${this.id} fires`);
      }
      // Neuron is firing, propagate the signal
      this.propagateSignal();
    }
  }
}

class Signal {
  constructor(startX, startY, endX, endY, isInhibitory, targetNeuron, initPower) {
    this.startX = startX;
    this.startY = startY;
    this.endX = endX;
    this.endY = endY;
    this.currentX = startX;
    this.currentY = startY;
    this.distancePassed = 0;
    this.progress = 1;
    this.isInhib = isInhibitory;
    this.initPower = initPower;
    this.distance = this.calcDistance();
    this.speed = 1000 / this.distance + Math.random() * 2; // Adjust as needed
    this.finished = 0;
    this.power;
    this.targetNeuron = targetNeuron;
  }

  // Update the signal's position
  update() {
    if (this.finished) {
      return;
    }
    let dx = this.startX - this.currentX;
    let dy = this.startY - this.currentY;

    this.distancePassed = Math.sqrt(dx * dx + dy * dy);

    this.progress = ((this.distancePassed) / (this.distance)) * 100;
    this.progress += this.speed;

    this.currentX = this.startX + (this.endX - this.startX) * (this.progress / 100);
    this.currentY = this.startY + (this.endY - this.startY) * (this.progress / 100);

    dx = this.startX - this.currentX;
    dy = this.startY - this.currentY;

    this.distancePassed = Math.sqrt(dx * dx + dy * dy);

    this.finished = this.isFinished();

    // this.power = this.initPower / Math.sqrt(this.distancePassed);
    this.power = this.initPower * Math.exp((-this.distancePassed * distanceConvert) / lambda);

  }

  calcDistance() {
    const dx = this.startX - this.endX;
    const dy = this.startY - this.endY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance
  }

  // Check if the signal has reached the end
  isFinished() {
    return this.progress >= 100;
  }
}

// CANVAS CREATE

function setupCanvas(canvas) {
  // Get the device pixel ratio, falling back to 1.
  var dpr = window.devicePixelRatio || 2;
  // Get the size of the canvas in CSS pixels.
  var rect = canvas.getBoundingClientRect();
  // Give the canvas pixel dimensions of their CSS
  // size * the device pixel ratio.
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  var ctx = canvas.getContext('2d');
  // Scale all drawing operations by the dpr, so you
  // don't have to worry about the difference.
  ctx.scale(dpr, dpr);
  return ctx;
}

const canvas = document.createElement("canvas");
// const ctx = canvas.getContext("2d");
var ctx = setupCanvas(canvas);

document.getElementById("visualization-container").appendChild(canvas);

// Set canvas dimensions
canvas.width = canvasWidth;
canvas.height = canvasHeight;


function getRGBaColor(color, alpha) {
  if (color === 'red') {
    return `rgba(207, 0, 0, ${alpha})`;
  } if (color === 'blue') {
    return `rgba(31, 66, 255, ${alpha})`;
  }
}

function sigmoid(x, a, h, slope, c) {
  return 1 / (1 + Math.exp(-(x - h) / slope)) * a + c
}

function getAlphaSigmoid(x, h = 0.5) {
  return sigmoid(x, 1, h, 0.12, 0.0);
}

// Function to draw neurons
function drawNeuron(neuron) {
  x = neuron.x;
  y = neuron.y;
  isFiring = neuron.isFiring;
  id = neuron.id;
  neuron.time += 1;

  let alpha = 0;

  if (isFiring) {
    alpha = 1;
  } else {
    // alpha = -0.6 + neuron.membranePotential / potentialThreshold;
    alpha = getAlphaSigmoid(neuron.membranePotential / potentialThreshold, h = 0.8)
  }

  let color = neuron.isInhib ? getRGBaColor('red', alpha) : getRGBaColor('blue', alpha);

  if (isFiring) {
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.closePath();
  } else {
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.closePath();
  }

  ctx.font = "20px Arial";
  ctx.fillStyle = "black";
  ctx.textAlign = "center";
  if (debug) {
    ctx.fillText(`${neuron.membranePotential.toFixed(2)}`, x, y);
  }

}

// Simulation update function
function updateSimulation(neurons) {
  let allSignals = [];
  neurons.forEach((neuron) => {
    neuron.updateFiringRateHistory();
    neuron.updateRefractory();

    // add noise
    // neuron.membranePotential += (((0.5 - Math.random()) / 100));
    neuron.membranePotential += gaussianRandom(1e-3, 3.6e-3);

    // Simulate firing with a probability based on average firing rate
    // Or the reaching of a membrane potential threshold
    if (potentialThreshold < neuron.membranePotential) {
      if (neuron.isRefractory) {
        return;
      }
      neuron.toggleFiring();
      neuron.outgoingConnections.forEach((targetNeuron) => {
        neuron.triggerSignal(targetNeuron);
      });
      neuron.toggleFiring();
      neuron.triggerRefractory()
    }

    neuron.outgoingSignals.forEach((signal) => {
      if (!signal.finished) {
        allSignals.push(signal);
      }
    });
  });

  allSignals.forEach((signal) => {
    signal.update();

    // if passed distance >= distance: call the receive() method
    if ((signal.distancePassed >= signal.distance)) {
      // console.log(`${targetNeuron.id} must receive a signal ${signalStrength} strength from ${neuron.id}`);
      signal.targetNeuron.receiveSignal(signal.power);
    }

  });

  // Inside your simulation loop, after updating the neurons:
  const currentTime = t  /* Get the current time (e.g., in seconds) */;
  // updateChart(currentTime, null);
}

// Function to draw a connection between two points
function drawConnection(fromX, fromY, toX, toY, color) {
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.strokeStyle = color;
  ctx.stroke();
  ctx.closePath();
}


function drawSignal(signal) {
  // Draw the signal at its current position
  const currentX = signal.currentX + Math.random() / 2;
  const currentY = signal.currentY + Math.random() / 2;


  let alpha = (signal.power / signal.initPower) + 0.2;
  // console.log(signal.finished);
  color = signal.isInhib ? `rgba(242, 82, 125, ${alpha})` : `rgba(23, 216, 216, ${alpha})`;
  if (alpha < 0.01) {
    return;
  }

  ctx.beginPath();
  ctx.arc(currentX, currentY, 1, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.closePath();
}

// LINES approach
function drawSignalLines(signal) {
  // Check if the signal has finished
  if (signal.finished) {
    console.log('shouldnt see that;');
    return; // Exit early if the signal has finished
  }

  // Draw the signal at its current position
  const startX = signal.startX + Math.random() / 1;
  const startY = signal.startY + Math.random() / 1;
  const currentX = signal.currentX;
  const currentY = signal.currentY;

  // Calculate the number of intermediate points
  const numSegments = 20;
  const dx = (currentX - startX) / numSegments;
  const dy = (currentY - startY) / numSegments;

  ctx.beginPath();
  ctx.moveTo(startX, startY);

  // Draw intermediate points
  for (let i = 1; i < numSegments; i++) {
    const x = startX + i * dx + Math.random() * 10 * 2; // Add some randomness
    const y = startY + i * dy + Math.random() * 10 * 2; // Add some randomness
    ctx.lineTo(x, y);
  }

  // Draw the final point
  ctx.lineTo(currentX, currentY);

  // Set color and opacity based on signal properties
  // let alpha = (signal.power / signal.initPower) + 0.00;
  let alpha = getAlphaSigmoid(signal.power, h = 0.120);
  let color = signal.isInhib ? getRGBaColor('red', alpha) : getRGBaColor('blue', alpha);
  ctx.strokeStyle = color;

  // Adjust line width based on signal properties
  ctx.lineWidth = 0.9;

  // Draw the signal
  ctx.stroke();
  ctx.closePath();

}

// Visualization update function
function updateVisualization(neurons) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // draw neurons
  let allSignals = [];
  neurons.forEach((neuron) => {
    drawNeuron(neuron);

    neuron.outgoingSignals.forEach((signal) => {
      if (!signal.finished) {
        allSignals.push(signal);
      }
    });
  });

  // Draw outgoing signals
  allSignals.forEach((signal) => {
    // drawSignal(signal);
    drawSignalLines(signal);
  });
}


// POPULATE N NEURONS
// N neurons to create

// Define and initialize the neurons array
var neurons = [];

for (let index = 0; index < N; index++) {
  let isInhib = Math.random() > inhibProbThreshold ? true : false;
  let potential = initPotential; // + (Math.random() / 1 * 1e-10);  // init start membrane potential
  neurons.push(new Neuron(index, potential, x = null, y = null, isInhib = isInhib));
}


// Create connections between neurons
for (let i = 0; i < neurons.length; i++) {
  for (let j = 0; j < neurons.length; j++) {
    if (i !== j) {
      if (Math.random() > connectionProbThreshold) {
        neurons[i].addOutgoingConnection(neurons[j]);
      }
      if (Math.random() > connectionProbThreshold) {
        neurons[i].addIncomingConnection(neurons[j]);
      }
    }
  }
}

// Function to update the chart with new data
function updateChart(time, membranePotential) {
  // timeLabels.push(time); // Add the current time to the labels

  // Update the chart
  // membranePotentialChart.update(); // TODO
  const traces = neurons.map((neuron) => ({
    marker: { color: neuron.isInhib ? "red" : "blue" },
    opacity: getAlphaSigmoid(neuron.membranePotential / potentialThreshold, h = 0.95),
    name: `Neuron ${neuron.id} membrane potential`,
    y: neuron.firingRateHistory, // Initialize with an empty array
  }));

  var data = traces;

  var layout = {
    shapes: [
      {
        type: 'line',
        xref: 'paper',
        x0: 0,
        y0: potentialThreshold,
        x1: 1,
        y1: potentialThreshold,
        line: {
          color: 'rgba(255, 0, 0, 0.2)',
          width: 2,
          dash: 'dot'
        }
      }
    ],
    autosize: true,
    width: chartWidth,
    height: chartHeight,
    plot_bgcolor: "black",
    paper_bgcolor: "#151740",
    showlegend: false,
    legend: {
      x: 1,
      xanchor: 'right',
      y: 1
    },
    xaxis: {
      type: 'linear',
      autorange: true
    },
    yaxis: {
      type: 'linear',
      autorange: true
    }
  };

  Plotly.newPlot('myDiv', data, layout);
}

// Add a variable to track the simulation state
let isSimulationRunning = true;

var t = 0;

// Define a variable to track the last time the chart was updated
let lastChartUpdateTime = performance.now();
let timeLabels = [];

// Define a function for the simulation loop
function simulationLoop() {
  if (isSimulationRunning) {
    updateSimulation(neurons);
    updateVisualization(neurons);
    t += 1;

    // chart
    const currentTime = performance.now(); // Get the current time
    if (drawPlot) {
      asyncUpdateChart(currentTime, null); // Call the chart update function
    }

    // Request the next animation frame
    requestAnimationFrame(simulationLoop);

    // Request the next animation frame to continue updating the chart asynchronously
    if (drawPlot) {
      requestAnimationFrame(asyncUpdateChart);
    }

  }

}

// Start the simulation loop
simulationLoop();

// Function to toggle the simulation state
function toggleSimulation() {
  isSimulationRunning = !isSimulationRunning;
}


// Standard Normal variate using Box-Muller transform.
function gaussianRandom(mean = 0, stdev = 1) {
  const u = 1 - Math.random(); // Converting [0,1) to (0,1]
  const v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  // Transform to the desired mean and standard deviation:
  return z * stdev + mean;
}

// Define a function to update the chart asynchronously
function asyncUpdateChart(time, membranePotential) {
  // Calculate the time elapsed since the last chart update
  const elapsedTime = time - lastChartUpdateTime;

  // Update the chart only if enough time has passed since the last update
  if (t % chartInterval === 0) { // Update chart every 100 milliseconds (adjust as needed)
    updateChart(t, membranePotential);
    lastChartUpdateTime = time;
  }
}

// Inside your simulation loop, after updating the simulation:
// const currentTime = performance.now(); // Get the current time
if (drawPlot) {
  asyncUpdateChart(t, null); // Call the chart update function asynchronously
}

// Function to update the chart with new data
// function updateChart(time, membranePotential) {
//   timeLabels.push(time);

//   // Update the chart data
//   const traces = neurons.map((neuron) => ({
//     // marker: { color: neuron.isInhib ? "red" : "blue" },
//     opacity: 0.12,
//     // name: `Neuron ${neuron.id} membrane potential`,
//     // x: timeLabels,
//     y: neuron.firingRateHistory, // Initialize with an empty array
//   }));

//   const data = traces;

//   // Update the chart layout if needed
//   // const layout = { ... }; // Update layout properties as needed
//   let layout = {
//     autosize: false,
//     width: chartWidth,
//     height: chartHeight,
//     plot_bgcolor: "black",
//     paper_bgcolor: "#1e0f29",
//     showlegend: false
//   }
//   // Plotly.react('myDiv', data, layout);
//   Plotly.react('myDiv', data, layout = layout); // Assuming layout doesn't change

//   // Optionally, update any other UI elements related to the chart
// }


// Define a function to resume the simulation loop
function resumeSimulation() {
  isSimulationRunning = true;
  simulationLoop(); // Restart the simulation loop
}

// Add an event listener to the button to resume the simulation
const resumeSimulationBtn = document.getElementById("play");
resumeSimulationBtn.addEventListener("click", () => {
  resumeSimulation();
  resumeSimulationBtn.textContent = "Pause Simulation";
});

// Define a function to pause the simulation loop
function pauseSimulation() {
  isSimulationRunning = false;
}

// Add an event listener to the button to toggle between pausing and resuming the simulation
const toggleSimulationBtn = document.getElementById("play");
toggleSimulationBtn.addEventListener("click", () => {
  if (isSimulationRunning) {
    pauseSimulation();
    toggleSimulationBtn.textContent = "Resume Simulation";
  } else {
    resumeSimulation();
    toggleSimulationBtn.textContent = "Pause Simulation";
  }
});


