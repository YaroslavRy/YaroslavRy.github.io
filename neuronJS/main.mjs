const debug = false;
const inhibProbThreshold = 0.66;
const N = 2 ** 8;
const initPotential = 40 * 1e-3;
const potentialThreshold = 56 * 1e-3;

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
    this.maxHistoryLength = 200;
    this.color = this.isInhib ? 'red' : 'blue';
    this.minThreshold = 25 * 1e-3;
    this.isRefractory = false;
    this.initRefractoryTime = 1;
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

    this.membranePotential += (signalStrength);
    // reset if the value is too low or is to high
    this.membranePotential = Math.max(this.minThreshold, this.membranePotential);
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
    this.speed = 1; // Adjust as needed
    this.isInhib = isInhibitory;
    this.initPower = initPower;
    this.distance = this.calcDistance();
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

    this.power = this.initPower / Math.sqrt(this.distancePassed);

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
  var dpr = window.devicePixelRatio || 1;
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
canvas.width = 800;
canvas.height = 600;

// Function to draw neurons
function drawNeuron(neuron) {
  x = neuron.x;
  y = neuron.y;
  isFiring = neuron.isFiring;
  id = neuron.id;
  neuron.time += 1;

  let alpha = -0.2 + neuron.membranePotential / potentialThreshold;

  let color = neuron.isInhib ? `rgba(255, ${(25 * (alpha))}, 0, ${alpha})` : `rgba(${(55 * alpha)}, 0, 255, ${alpha})`;

  if (isFiring) {
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.closePath();
  } else {
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
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
    neuron.membranePotential += gaussianRandom(1e-3, 5e-3);

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

    // if (signal.finished) {
    //   // Check if the signal has reached the end, and remove it if needed
    //   signal.neuron.outgoingSignals.splice(signal.neuron.outgoingSignals.indexOf(signal), 1);
    // }

    // need to remove finished signals from the all neurons.outgoingSignals
    // signal.neuron.outgoingSignals = signal.neuron.outgoingSignals.filter(signal => !signal.finished);

  });

  // Inside your simulation loop, after updating the neurons:
  const currentTime = t  /* Get the current time (e.g., in seconds) */;
  // const membranePotential = totalFiringRate / neurons.length;

  updateChart(currentTime, null);
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


  let alpha = 0.5 - (signal.power / signal.initPower);
  // console.log(signal.finished);
  color = signal.isInhib ? `rgba(255, 0, 0, ${alpha})` : `rgba(0, 0, 255, ${alpha})`;
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
  const startX = signal.startX + Math.random() / 10;
  const startY = signal.startY + Math.random() / 10;
  const currentX = signal.currentX;
  const currentY = signal.currentY;

  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(currentX, currentY);

  // Set color and opacity based on signal properties
  let alpha = 0.2 - (signal.power / signal.initPower);
  let color = signal.isInhib ? `rgba(255, 0, 0, ${alpha})` : `rgba(0, 0, 255, ${alpha})`;
  ctx.strokeStyle = color;

  // Adjust line width based on signal properties
  ctx.lineWidth = 0.5;

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
    drawSignal(signal);
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
      if (Math.random() > 0.6) {
        neurons[i].addOutgoingConnection(neurons[j]);
      }
      if (Math.random() > 0.6) {
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
    opacity: 0.33,
    name: `Neuron ${neuron.id} Firing Rate`,
    y: neuron.firingRateHistory, // Initialize with an empty array
  }));

  var data = traces;

  var layout = {
    autosize: false,
    width: 600,
    height: 250,
    plot_bgcolor: "black",
    paper_bgcolor: "#1e0f29",
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

// Define a function for the simulation loop
function simulationLoop() {
  if (isSimulationRunning) {
    updateSimulation(neurons);
    updateVisualization(neurons);
    t += 1;
  }

  // Request the next animation frame
  requestAnimationFrame(simulationLoop);
}

// Start the simulation loop
simulationLoop();

// Function to toggle the simulation state
function toggleSimulation() {
  isSimulationRunning = !isSimulationRunning;
}

// Add an event listener to the button
const toggleSimulationBtn = document.getElementById("play");
toggleSimulationBtn.addEventListener("click", () => {
  toggleSimulation();
  toggleSimulationBtn.textContent = isSimulationRunning ? "Pause Simulation" : "Resume Simulation";
});


// Standard Normal variate using Box-Muller transform.
function gaussianRandom(mean = 0, stdev = 1) {
  const u = 1 - Math.random(); // Converting [0,1) to (0,1]
  const v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  // Transform to the desired mean and standard deviation:
  return z * stdev + mean;
}