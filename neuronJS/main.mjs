const debug = false;
const inhibProbThreshold = 0.7;
const N = 2 ** 7;
const initPotential = 40 * 1e-3;
const potentialThreshold = 60 * 1e-3;

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
    this.minThreshold = 0.05;
    this.maxThreshold = 0.122;  // 0.067
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
    this.membranePotential = initPotential;

    // this.outgoingConnections.forEach((targetNeuron) => {
    //   // Calculate the distance between neurons
    //   const dx = targetNeuron.x - this.x;
    //   const dy = targetNeuron.y - this.y;
    //   const distance = Math.sqrt(dx * dx + dy * dy);

    //   // Calculate the signal strength based on distance (you can adjust the factor)
    //   const signalStrength = this.signalStrength / Math.sqrt(distance); // Adjust the factor as needed

    //   // // if passed distance >= distance: call the receive() method
    //   // // this is a neuron class but I need a signal instance to so!

    //   // // Only RECEIVE the signal if it's strong enough
    //   if ((Math.abs(signalStrength) > 0.00001)) {
    //     targetNeuron.receiveSignal(signalStrength);
    //     console.log(`${targetNeuron.id} must receive a signal  ${signalStrength}`);
    //   }
    // });
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
    this.speed = 2; // Adjust as needed
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
canvas.width = 600;
canvas.height = 400;

// Function to draw neurons
function drawNeuron(neuron) {
  x = neuron.x;
  y = neuron.y;
  isFiring = neuron.isFiring;
  id = neuron.id;
  neuron.time += 1;

  let alpha = -0.2 + neuron.membranePotential / potentialThreshold;
  let color = neuron.isInhib ? `rgba(255, ${(100 * (alpha))}, 0, ${alpha})` : `rgba(0, ${(25 * alpha)}, 255, ${alpha})`;

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
  neurons.forEach((neuron) => {
    neuron.updateFiringRateHistory();

    // add noise
    neuron.membranePotential += ((Math.random() / 100) * ((0.5 - Math.random()) / 5));

    // Simulate firing with a probability based on average firing rate
    // Or the reaching of a membrane potential threshold
    if (potentialThreshold < neuron.membranePotential) {
      neuron.toggleFiring();
      neuron.outgoingConnections.forEach((targetNeuron) => {
        neuron.triggerSignal(targetNeuron);
      });
      neuron.toggleFiring();
    }
  });

  // Inside your simulation loop, after updating the neurons:
  const currentTime = t  /* Get the current time (e.g., in seconds) */;
  // const membranePotential = totalFiringRate / neurons.length;

  if (currentTime % 10 === 0) {
    updateChart(currentTime, null);
    // updateChartPlotly(currentTime, membranePotential);
  }
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

function drawSignal(neuron, signal) {
  // Draw the signal at its current position
  const currentX = signal.currentX;
  const currentY = signal.currentY;

  // // let alpha = Math.abs(neuron.signalStrength) / (Math.abs(neuron.signalStrength) / Math.sqrt(signal.distance));
  // let alpha = 0.5 - (signal.progress / 100);
  // // console.log(signal.finished);
  // color = neuron.isInhib ? `rgba(255 0, 0, ${alpha})` : `rgba(0, 0, 255, ${alpha})`;
  // drawConnection(signal.startX, signal.startY, signal.endX, signal.endY, color);

  ctx.beginPath();
  ctx.arc(currentX, currentY, 1, 0, Math.PI * 2);

  // let alpha = Math.abs(neuron.signalStrength) / (Math.abs(neuron.signalStrength) / Math.sqrt(signal.distance));
  let alpha = 0.75 - (signal.progress / 100);
  // console.log(signal.finished);
  color = neuron.isInhib ? `rgba(255, ${neuron.id / 100}, 0, ${alpha})` : `rgba(0, ${neuron.id / 100}, 255, ${alpha})`;
  ctx.fillStyle = color;
  ctx.fill();
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
      signal.neuron = neuron;
      allSignals.push(signal);
    });
  });

  // Draw outgoing signals
  allSignals.forEach((signal) => {
    signal.update();

    if (parseInt(signal.progress) % 3 === 0) {
      drawSignal(signal.neuron, signal);
    }

    // if passed distance >= distance: call the receive() method
    if ((signal.distancePassed >= signal.distance)) {
      // console.log(`${targetNeuron.id} must receive a signal ${signalStrength} strength from ${neuron.id}`);
      signal.targetNeuron.receiveSignal(signal.power);
    }

    if (signal.finished) {
      // Check if the signal has reached the end, and remove it if needed
      signal.neuron.outgoingSignals.splice(signal.neuron.outgoingSignals.indexOf(signal), 1);
    }

    signal.neuron.outgoingSignals = signal.neuron.outgoingSignals.filter(signal => !signal.finished);
  });
}


// POPULATE N NEURONS
// N neurons to create

// Define and initialize the neurons array
var neurons = [];

for (let index = 0; index < N; index++) {
  let isInhib = Math.random() > inhibProbThreshold ? true : false;
  let potential = initPotential + Math.random() / 100;  // init start membrane potential
  neurons.push(new Neuron(index, potential, x = null, y = null, isInhib = isInhib));
}


// Create connections between neurons
for (let i = 0; i < neurons.length; i++) {
  for (let j = 0; j < neurons.length; j++) {
    if (i !== j) {
      if (Math.random() > 0.65) {
        neurons[i].addOutgoingConnection(neurons[j]);
      }
      if (Math.random() > 0.65) {
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

  // Call the function to update the chart with the new data
  updateChart(t, null);

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
