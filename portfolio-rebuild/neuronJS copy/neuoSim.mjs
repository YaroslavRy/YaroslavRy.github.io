var t = 0;
var updatePeriod = 10;


// Simulation update function
function updateSimulation(neurons) {
    neurons.forEach((neuron) => {
        neuron.updateFiringRateHistory();

    });
    
    if (currentTime % 10 === 0) {
        updateChart(currentTime, null);
        // updateChartPlotly(currentTime, membranePotential);
    }
}


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
            neurons[i].addOutgoingConnection(neurons[j]);
            neurons[i].addIncomingConnection(neurons[j]);
        }
    }
}

var t = 0;
var updatePeriod = 10;

// Inside your simulation loop, check the simulation state before updating and rendering
setInterval(() => {
    if (isSimulationRunning) {
        updateSimulation(neurons);
        // updateVisualization(neurons);
        t += 1;
    }
    // Call the function to update the chart with the new data
}, updatePeriod);

// Add a variable to track the simulation state
let isSimulationRunning = true;

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

