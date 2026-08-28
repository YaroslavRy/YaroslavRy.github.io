/*
  sim.js — scalable spiking neuron simulation
  Renders via raw WebGL (gl.POINTS, one draw call) so it stays smooth from
  tens of neurons up to several thousand. Replaces the old Plotly-based
  version, which redrew a full chart every frame and choked past ~50 neurons.

  Two connectivity modes, switchable at runtime, so you can compare dynamics:

  - "distance"  Neurons connect to nearby neurons with probability that
                decays with distance (closer = stronger/more likely), plus a
                propagation delay proportional to that distance — this is
                the realistic mode and the point of the whole simulation.
                Made scalable with a spatial hash grid: each neuron only
                checks neurons in its own + adjacent grid cells, not the
                whole population, so it stays close to O(N) instead of O(N²).
  - "random"    Each neuron connects to a fixed number of uniformly random
                targets anywhere in the population, instant delivery. No
                spatial structure at all — useful as a control/comparison
                condition, not a replacement for the real thing.
*/

(function () {
  const COLORS = {
    idleExcit: [0.553, 0.165, 0.380], // #8D2A61
    idleInhib: [0.369, 0.176, 0.420], // #5E2D6B
    hot:       [0.929, 0.890, 0.925], // #EDE3EC
    bg:        [0.141, 0.082, 0.192], // #241531
    accent:    [0.761, 0.294, 0.525], // #C24B86
  };

  // ---------- Simulation state ----------
  let N = 400;
  let targetDegree = 12;
  let noise = 0.0015;
  let running = true;
  let mode = 'distance'; // 'distance' | 'random'

  const K_MAX = 24;           // hard cap on per-neuron edges (array sizing)
  const DELAY_BUFFER = 26;    // ring buffer length for propagation delay — must exceed MAX_LONG_DELAY_STEPS
  const MAX_DELAY_STEPS = 8;       // local (within-radius) connections
  const MAX_LONG_DELAY_STEPS = 22; // long-range connections travel farther, so take longer
  const LONG_RANGE_FRACTION = 0.18; // ~18% of a neuron's edges ignore the local radius entirely
  const REST = 0, THRESHOLD = 1, SPIKE_VALUE = 1.2, DECAY = 0.06, REFRACTORY_STEPS = 6;

  let potential, glow, refractory, type, positions;
  let edgeTarget, edgeWeight, edgeDelay; // flattened [N * K_MAX]
  let pendingKicks; // [DELAY_BUFFER * N]
  let stepCount = 0;
  let lastSpikeIndices = [];
  let spikedFlags; // Uint8Array(N) — O(1) "did neuron i spike this step" lookup

  // In-flight signals, tracked separately from the delivery mechanism so
  // they can be drawn as traveling pulses along their edge. Capped so a
  // burst of activity at high neuron counts can't blow up the render cost —
  // the underlying simulation still delivers every signal correctly via
  // pendingKicks regardless of this cap; this only bounds what's drawn.
  const MAX_RENDER_PULSES = 2000;
  let pulses = []; // { i, j, start, delay }

  function spawnPulse(i, j, delay) {
    if (pulses.length >= MAX_RENDER_PULSES) return;
    pulses.push({ i, j, start: stepCount, delay });
  }

  function rand(min, max) { return Math.random() * (max - min) + min; }

  function buildPositions(n) {
    const positions = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) {
      const r = Math.sqrt(Math.random()) * 0.47;
      const theta = Math.random() * Math.PI * 2;
      positions[i * 2] = 0.5 + r * Math.cos(theta);
      positions[i * 2 + 1] = 0.5 + r * Math.sin(theta) * 0.78;
    }
    return positions;
  }

  // ---------- Connectivity: distance-based (spatial-grid accelerated) ----------
  function buildDistanceConnectivity(n, positions, avgDegree) {
    const area = 0.54; // approx area covered by buildPositions' disk
    const desiredCandidates = avgDegree * 3;
    let radius = Math.sqrt((desiredCandidates * area) / (n * Math.PI));
    radius = Math.max(0.02, Math.min(0.35, radius));
    const lambda = radius * 0.5;

    // Spatial hash grid: cell size = radius, so any neighbor within radius
    // is guaranteed to be in the same or an adjacent cell.
    const cell = radius;
    const gridDim = Math.max(1, Math.ceil(1 / cell));
    const buckets = new Map();
    function bucketKey(cx, cy) { return cx * gridDim + cy; }
    for (let i = 0; i < n; i++) {
      const cx = Math.min(gridDim - 1, Math.floor(positions[i * 2] / cell));
      const cy = Math.min(gridDim - 1, Math.floor(positions[i * 2 + 1] / cell));
      const key = bucketKey(cx, cy);
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(i);
    }

    const edgeTarget = new Int32Array(n * K_MAX).fill(-1);
    const edgeWeight = new Float32Array(n * K_MAX);
    const edgeDelay = new Uint8Array(n * K_MAX);

    // Reserve a slice of each neuron's edge budget for long-range links —
    // real cortex isn't purely local wiring, it's local wiring plus a sparse
    // set of long-distance projections (small-world topology). Without
    // these, a signal could only ever ripple outward through immediate
    // neighbors and would never reach the far side of the network.
    const longRangeSlots = Math.max(1, Math.round(K_MAX * LONG_RANGE_FRACTION));
    const localSlots = K_MAX - longRangeSlots;

    for (let i = 0; i < n; i++) {
      const xi = positions[i * 2], yi = positions[i * 2 + 1];
      const cx = Math.min(gridDim - 1, Math.floor(xi / cell));
      const cy = Math.min(gridDim - 1, Math.floor(yi / cell));

      const candidates = [];
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const ncx = cx + dx, ncy = cy + dy;
          if (ncx < 0 || ncy < 0 || ncx >= gridDim || ncy >= gridDim) continue;
          const bucket = buckets.get(bucketKey(ncx, ncy));
          if (!bucket) continue;
          for (const j of bucket) {
            if (j === i) continue;
            const ddx = positions[j * 2] - xi;
            const ddy = positions[j * 2 + 1] - yi;
            const dist = Math.sqrt(ddx * ddx + ddy * ddy);
            if (dist <= radius) candidates.push([j, dist]);
          }
        }
      }
      candidates.sort((a, b) => a[1] - b[1]);

      let count = 0;
      for (let c = 0; c < candidates.length && count < localSlots; c++) {
        const [j, dist] = candidates[c];
        const prob = Math.exp(-dist / lambda);
        if (Math.random() > prob) continue;
        const slot = i * K_MAX + count;
        edgeTarget[slot] = j;
        const decay = Math.exp(-dist / lambda);
        const base = type[i] > 0 ? 0.55 : -0.8;
        edgeWeight[slot] = base * decay;
        edgeDelay[slot] = Math.min(MAX_DELAY_STEPS, Math.round((dist / radius) * MAX_DELAY_STEPS));
        count++;
      }

      // Long-range: pick targets from anywhere in the population, no
      // radius restriction. Weight still decays with true distance (just
      // more gently — a wide lambda), and delay scales with true distance
      // too, up to the larger long-range cap.
      const wideLambda = radius * 4;
      for (let e = 0; e < longRangeSlots; e++) {
        let j = Math.floor(Math.random() * n);
        if (j === i) j = (j + 1) % n;
        const ddx = positions[j * 2] - xi, ddy = positions[j * 2 + 1] - yi;
        const dist = Math.sqrt(ddx * ddx + ddy * ddy);
        const slot = i * K_MAX + localSlots + e;
        edgeTarget[slot] = j;
        const base = type[i] > 0 ? 0.5 : -0.75;
        edgeWeight[slot] = base * Math.exp(-dist / wideLambda);
        edgeDelay[slot] = Math.max(1, Math.min(MAX_LONG_DELAY_STEPS, Math.round((dist / radius) * MAX_DELAY_STEPS)));
      }
    }
    return { edgeTarget, edgeWeight, edgeDelay };
  }

  // ---------- Connectivity: random (control condition) ----------
  function buildRandomConnectivity(n, degree) {
    const edgeTarget = new Int32Array(n * K_MAX).fill(-1);
    const edgeWeight = new Float32Array(n * K_MAX);
    const edgeDelay = new Uint8Array(n * K_MAX); // all zero — instant delivery

    const k = Math.min(K_MAX, degree);
    for (let i = 0; i < n; i++) {
      const base = type[i] > 0 ? 0.5 : -0.7;
      for (let e = 0; e < k; e++) {
        let j = Math.floor(Math.random() * n);
        if (j === i) j = (j + 1) % n;
        const slot = i * K_MAX + e;
        edgeTarget[slot] = j;
        edgeWeight[slot] = base;
        edgeDelay[slot] = 0;
      }
    }
    return { edgeTarget, edgeWeight, edgeDelay };
  }

  function buildPopulation(n) {
    N = n;
    potential = new Float32Array(N);
    glow = new Float32Array(N);
    refractory = new Uint8Array(N);
    type = new Float32Array(N);
    positions = buildPositions(N);
    for (let i = 0; i < N; i++) type[i] = Math.random() > 0.66 ? -1 : 1;

    const built = mode === 'distance'
      ? buildDistanceConnectivity(N, positions, targetDegree)
      : buildRandomConnectivity(N, targetDegree);
    edgeTarget = built.edgeTarget;
    edgeWeight = built.edgeWeight;
    edgeDelay = built.edgeDelay;

    pendingKicks = new Float32Array(DELAY_BUFFER * N);
    spikedFlags = new Uint8Array(N);
    pulses = [];
    stepCount = 0;
  }

  function seedSpikes(count) {
    for (let s = 0; s < count; s++) {
      const i = Math.floor(Math.random() * N);
      potential[i] = SPIKE_VALUE;
    }
  }

  function step() {
    // clear last frame's spike flags (only touches the sparse set that were set)
    for (let s = 0; s < lastSpikeIndices.length; s++) spikedFlags[lastSpikeIndices[s]] = 0;
    lastSpikeIndices = [];
    const slot = stepCount % DELAY_BUFFER;
    const slotBase = slot * N;

    for (let i = 0; i < N; i++) {
      // deliver anything scheduled to arrive this step
      if (pendingKicks[slotBase + i] !== 0) {
        potential[i] += pendingKicks[slotBase + i];
        pendingKicks[slotBase + i] = 0;
      }

      if (refractory[i] > 0) {
        refractory[i]--;
        potential[i] = REST;
        glow[i] *= 0.85;
        continue;
      }
      potential[i] += (REST - potential[i]) * DECAY;
      if (Math.random() < noise) potential[i] += 0.6;

      if (potential[i] >= THRESHOLD) {
        lastSpikeIndices.push(i);
        spikedFlags[i] = 1;
        glow[i] = 1;
        refractory[i] = REFRACTORY_STEPS;
        potential[i] = REST;
      } else {
        glow[i] *= 0.9;
      }
    }

    for (let s = 0; s < lastSpikeIndices.length; s++) {
      const i = lastSpikeIndices[s];
      const base = i * K_MAX;
      for (let e = 0; e < K_MAX; e++) {
        const j = edgeTarget[base + e];
        if (j < 0) break;
        const w = edgeWeight[base + e];
        const d = edgeDelay[base + e];
        if (d === 0) {
          if (refractory[j] === 0) potential[j] += w;
        } else {
          const targetSlot = ((stepCount + d) % DELAY_BUFFER) * N + j;
          pendingKicks[targetSlot] += w;
          spawnPulse(i, j, d);
        }
      }
    }
    stepCount++;
  }

  // ---------- WebGL renderer ----------
  let gl, program, posBuffer, glowBuffer, typeBuffer, canvas;

  const VERT_SRC = `
    attribute vec2 a_position;
    attribute float a_glow;
    attribute float a_type;
    varying float v_glow;
    varying float v_type;
    void main() {
      vec2 clip = a_position * 2.0 - 1.0;
      clip.y *= -1.0;
      gl_Position = vec4(clip, 0.0, 1.0);
      gl_PointSize = 2.0 + a_glow * 7.0;
      v_glow = a_glow;
      v_type = a_type;
    }
  `;
  const FRAG_SRC = `
    precision mediump float;
    varying float v_glow;
    varying float v_type;
    void main() {
      vec2 uv = gl_PointCoord - vec2(0.5);
      float d = length(uv);
      if (d > 0.5) discard;
      float alpha = smoothstep(0.5, 0.0, d) * (0.55 + 0.45 * v_glow);
      vec3 idleExcit = vec3(0.553, 0.165, 0.380);
      vec3 idleInhib = vec3(0.369, 0.176, 0.420);
      vec3 hot = vec3(0.929, 0.890, 0.925);
      vec3 idle = mix(idleInhib, idleExcit, (v_type + 1.0) / 2.0);
      vec3 col = mix(idle, hot, v_glow);
      gl_FragColor = vec4(col, alpha);
    }
  `;

  function compile(gl, type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s));
    return s;
  }

  // ---------- Pulse renderer (visible signal propagation) ----------
  const PULSE_VERT_SRC = `
    attribute vec2 a_position;
    void main() {
      vec2 clip = a_position * 2.0 - 1.0;
      clip.y *= -1.0;
      gl_Position = vec4(clip, 0.0, 1.0);
      gl_PointSize = 4.0;
    }
  `;
  const PULSE_FRAG_SRC = `
    precision mediump float;
    uniform vec4 u_color;
    uniform float u_isPoint;
    void main() {
      if (u_isPoint > 0.5) {
        vec2 uv = gl_PointCoord - vec2(0.5);
        if (length(uv) > 0.5) discard;
      }
      gl_FragColor = u_color;
    }
  `;

  let pulseProgram, pulseLineBuf, pulseDotBuf, pulseColorLoc, pulseIsPointLoc;
  let pulseLineData, pulseDotData; // preallocated, reused every frame — avoids per-frame GC churn

  function initPulseRenderer() {
    const vs = compile(gl, gl.VERTEX_SHADER, PULSE_VERT_SRC);
    const fs = compile(gl, gl.FRAGMENT_SHADER, PULSE_FRAG_SRC);
    pulseProgram = gl.createProgram();
    gl.attachShader(pulseProgram, vs);
    gl.attachShader(pulseProgram, fs);
    gl.linkProgram(pulseProgram);
    pulseColorLoc = gl.getUniformLocation(pulseProgram, 'u_color');
    pulseIsPointLoc = gl.getUniformLocation(pulseProgram, 'u_isPoint');
    pulseLineBuf = gl.createBuffer();
    pulseDotBuf = gl.createBuffer();
    pulseLineData = new Float32Array(MAX_RENDER_PULSES * 4);
    pulseDotData = new Float32Array(MAX_RENDER_PULSES * 2);
  }

  function renderPulses() {
    let count = 0;
    for (let p = pulses.length - 1; p >= 0; p--) {
      const pulse = pulses[p];
      const progress = (stepCount - pulse.start) / pulse.delay;
      if (progress >= 1) {
        // O(1) removal — order doesn't matter for rendering
        pulses[p] = pulses[pulses.length - 1];
        pulses.pop();
        continue;
      }
      const sx = positions[pulse.i * 2], sy = positions[pulse.i * 2 + 1];
      const tx = positions[pulse.j * 2], ty = positions[pulse.j * 2 + 1];
      pulseLineData[count * 4] = sx;
      pulseLineData[count * 4 + 1] = sy;
      pulseLineData[count * 4 + 2] = tx;
      pulseLineData[count * 4 + 3] = ty;
      pulseDotData[count * 2] = sx + (tx - sx) * progress;
      pulseDotData[count * 2 + 1] = sy + (ty - sy) * progress;
      count++;
    }
    if (count === 0) return;

    gl.useProgram(pulseProgram);
    const aPos = gl.getAttribLocation(pulseProgram, 'a_position');
    gl.enableVertexAttribArray(aPos);

    // faint connection lines
    gl.bindBuffer(gl.ARRAY_BUFFER, pulseLineBuf);
    gl.bufferData(gl.ARRAY_BUFFER, pulseLineData.subarray(0, count * 4), gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    gl.uniform4f(pulseColorLoc, 0.761, 0.294, 0.525, 0.18);
    gl.uniform1f(pulseIsPointLoc, 0.0);
    gl.drawArrays(gl.LINES, 0, count * 2);

    // bright traveling markers, on top
    gl.bindBuffer(gl.ARRAY_BUFFER, pulseDotBuf);
    gl.bufferData(gl.ARRAY_BUFFER, pulseDotData.subarray(0, count * 2), gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    gl.uniform4f(pulseColorLoc, 0.929, 0.890, 0.925, 0.95);
    gl.uniform1f(pulseIsPointLoc, 1.0);
    gl.drawArrays(gl.POINTS, 0, count);

    gl.useProgram(program); // hand control back to the main neuron program
  }

  function initGL(c) {
    canvas = c;
    gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return false;
    const vs = compile(gl, gl.VERTEX_SHADER, VERT_SRC);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG_SRC);
    program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);
    posBuffer = gl.createBuffer();
    glowBuffer = gl.createBuffer();
    typeBuffer = gl.createBuffer();
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(...COLORS.bg, 1);
    initPulseRenderer();
    return true;
  }

  function resizeGL() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  function renderGL() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
    const aPos = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, glowBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, glow, gl.DYNAMIC_DRAW);
    const aGlow = gl.getAttribLocation(program, 'a_glow');
    gl.enableVertexAttribArray(aGlow);
    gl.vertexAttribPointer(aGlow, 1, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, typeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, type, gl.DYNAMIC_DRAW);
    const aType = gl.getAttribLocation(program, 'a_type');
    gl.enableVertexAttribArray(aType);
    gl.vertexAttribPointer(aType, 1, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.POINTS, 0, N);
    renderPulses();
  }

  // ---------- Heatmap ----------
  let heatCanvas, heatCtx, heatCols = 48, heatRows = 26, heatBins;

  function initHeatmap(c) {
    heatCanvas = c;
    heatCtx = heatCanvas.getContext('2d');
    heatCanvas.width = heatCols;
    heatCanvas.height = heatRows;
    heatBins = new Float32Array(heatCols * heatRows);
  }

  function updateHeatmap() {
    for (let s = 0; s < lastSpikeIndices.length; s++) {
      const i = lastSpikeIndices[s];
      const cx = Math.min(heatCols - 1, Math.floor(positions[i * 2] * heatCols));
      const cy = Math.min(heatRows - 1, Math.floor(positions[i * 2 + 1] * heatRows));
      heatBins[cy * heatCols + cx] += 1;
    }
    const img = heatCtx.createImageData(heatCols, heatRows);
    for (let b = 0; b < heatBins.length; b++) {
      heatBins[b] *= 0.92;
      const v = Math.min(1, heatBins[b] / 3);
      const idle = COLORS.bg, hot = COLORS.hot;
      img.data[b * 4] = (idle[0] + (hot[0] - idle[0]) * v) * 255;
      img.data[b * 4 + 1] = (idle[1] + (hot[1] - idle[1]) * v) * 255;
      img.data[b * 4 + 2] = (idle[2] + (hot[2] - idle[2]) * v) * 255;
      img.data[b * 4 + 3] = 255;
    }
    heatCtx.putImageData(img, 0, 0);
  }

  // ---------- Spike raster ----------
  let rasterCanvas, rasterCtx, rasterSample = [];

  function initRaster(c) {
    rasterCanvas = c;
    rasterCtx = rasterCanvas.getContext('2d');
    rasterCtx.fillStyle = '#241531';
    rasterCtx.fillRect(0, 0, rasterCanvas.width, rasterCanvas.height);
    buildRasterSample();
  }

  function buildRasterSample() {
    const maxRows = Math.min(160, N);
    const stride = Math.max(1, Math.floor(N / maxRows));
    rasterSample = [];
    for (let i = 0; i < N; i += stride) rasterSample.push(i);
  }

  function updateRaster() {
    const w = rasterCanvas.width, h = rasterCanvas.height;
    rasterCtx.drawImage(rasterCanvas, -1, 0);
    rasterCtx.fillStyle = '#241531';
    rasterCtx.fillRect(w - 1, 0, 1, h);
    const rowH = h / rasterSample.length;
    rasterCtx.fillStyle = '#C24B86';
    for (let r = 0; r < rasterSample.length; r++) {
      if (spikedFlags[rasterSample[r]]) rasterCtx.fillRect(w - 1, r * rowH, 1, Math.max(1, rowH));
    }
  }

  // ---------- Phase portrait: population activity vs its rate of change ----------
  let phaseCanvas, phaseCtx, prevActivity = 0;

  function initPhasePortrait(c) {
    phaseCanvas = c;
    phaseCtx = phaseCanvas.getContext('2d');
    phaseCtx.fillStyle = '#241531';
    phaseCtx.fillRect(0, 0, phaseCanvas.width, phaseCanvas.height);
  }

  function updatePhasePortrait() {
    const w = phaseCanvas.width, h = phaseCanvas.height;
    const activity = lastSpikeIndices.length / N;
    const dActivity = activity - prevActivity;
    prevActivity = activity;

    // fade the trail instead of clearing, so trajectories are visible
    phaseCtx.fillStyle = 'rgba(36, 21, 49, 0.06)';
    phaseCtx.fillRect(0, 0, w, h);

    const x = activity * w * 6;         // scaled — activity is usually small
    const y = h / 2 - dActivity * h * 30;
    phaseCtx.beginPath();
    phaseCtx.fillStyle = '#C24B86';
    phaseCtx.arc(Math.min(w - 2, x), Math.max(2, Math.min(h - 2, y)), 1.6, 0, Math.PI * 2);
    phaseCtx.fill();
  }

  // ---------- Public API ----------
  function setNeuronCount(n) {
    buildPopulation(n);
    seedSpikes(Math.max(3, Math.floor(n * 0.02)));
    buildRasterSample();
    if (rasterCtx) { rasterCtx.fillStyle = '#241531'; rasterCtx.fillRect(0, 0, rasterCanvas.width, rasterCanvas.height); }
    if (phaseCtx) { phaseCtx.fillStyle = '#241531'; phaseCtx.fillRect(0, 0, phaseCanvas.width, phaseCanvas.height); }
  }

  function tick() {
    if (running) step();
    if (gl) renderGL();
    if (heatCtx) updateHeatmap();
    if (rasterCtx) updateRaster();
    if (phaseCtx) updatePhasePortrait();
    requestAnimationFrame(tick);
  }

  function init(opts) {
    const mainCanvas = document.querySelector(opts.main);
    if (!initGL(mainCanvas)) {
      mainCanvas.parentElement.innerHTML =
        '<p style="padding:2rem; font-family:monospace; color:var(--text-faint);">WebGL isn\'t available in this browser — the neuron sim needs it.</p>';
      return;
    }
    resizeGL();
    window.addEventListener('resize', resizeGL);

    initHeatmap(document.querySelector(opts.heatmap));
    initRaster(document.querySelector(opts.raster));
    initPhasePortrait(document.querySelector(opts.phase));

    setNeuronCount(N);
    tick();

    window.NeuronSim = {
      setCount(n) { setNeuronCount(Math.max(10, Math.min(12000, Math.round(n)))); },
      setNoise(v) { noise = v; },
      setDegree(k) { targetDegree = Math.max(2, Math.min(30, Math.round(k))); setNeuronCount(N); },
      setMode(m) { mode = m === 'random' ? 'random' : 'distance'; setNeuronCount(N); },
      getMode() { return mode; },
      togglePlay() { running = !running; return running; },
      reset() { setNeuronCount(N); },
      isRunning() { return running; },
      getCount() { return N; },
    };
  }

  window.initNeuronSim = init;
})();
