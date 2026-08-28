/*
  graph-data.js — real data, pulled from corvie.ai (your published digital
  garden). Structured as category hubs (larger nodes) linking out to real
  articles, plus a handful of cross-topic links between articles that share
  a theme. Click any article node to open it on the blog.

  To regenerate this automatically from the actual vault structure instead
  of this hand-built approximation, see the note on the graph page.
*/
const BASE = 'https://corvie.ai';

const GRAPH_DATA = {
  nodes: [
    // ---- category hubs ----
    { id: 'AI', group: 'hub' },
    { id: 'Neuroscience', group: 'hub' },
    { id: 'EEG', group: 'hub' },
    { id: 'BCI', group: 'hub' },
    { id: 'NLP', group: 'hub' },
    { id: 'Biosignals', group: 'hub' },
    { id: 'Personality Disorders', group: 'hub' },
    { id: 'ASD', group: 'hub' },

    // ---- AI ----
    { id: 'Automating the Search for Artificial Life with Foundation Models', group: 'ai', url: `${BASE}/ai/automating-the-search-for-artificial-life-with-foundation-models/` },
    { id: 'Learning long sequences in spiking neural networks', group: 'ai', url: `${BASE}/ai/learning-long-sequences-in-spiking-neural-networks/` },
    { id: 'Structural Embedding Alignment for Multimodal LLMs', group: 'ai', url: `${BASE}/ai/structural-embedding-alignment-for-multimodal-large-language-model/` },
    { id: 'Charting trajectories of human thought using LLMs', group: 'ai', url: `${BASE}/charting-trajectories-of-human-thought-using-large-language-models/` },
    { id: 'Human-like object concepts in multimodal LLMs', group: 'ai', url: `${BASE}/human-like-object-concept-representations-emerge-naturally-in-multimodal-large-language-models/` },

    // ---- Neuroscience: computational ----
    { id: 'Biologically-informed E/I ratio for robust SNN training', group: 'neuro', url: `${BASE}/neuroscience/computational/biologically-informed-excitatory-and-inhibitory-ratio-for-robust-spiking-neural-network-training/` },
    { id: 'Predictive learning shapes the geometry of the brain', group: 'neuro', url: `${BASE}/neuroscience/computational/predictive-learning-shapes-the-geometry-of-the-human-brain/` },
    { id: 'Topological Deep Learning for Neural Spike Decoding', group: 'neuro', url: `${BASE}/neuroscience/computational-neuro/a-topological-deep-learning-framework-for-neural-spike-decoding/` },
    { id: 'Dynamic population coding in prefrontal cortex', group: 'neuro', url: `${BASE}/neuroscience/computational-neuro/dynamic-population-coding-in-prefrontal-cortex/` },
    { id: 'Predictive coding', group: 'neuro', url: `${BASE}/neuroscience/computational-neuro/predictive-coding/` },
    { id: 'Predictive coding and Alpha rhythm', group: 'neuro', url: `${BASE}/predictive-coding-and-alpha-rhytm/` },
    { id: 'Is criticality a unified setpoint of brain function?', group: 'neuro', url: `${BASE}/neuroscience/is-criticality-a-unified-setpoint-of-brain-function/` },

    // ---- Neuroscience: cognitive ----
    { id: 'Cerebellum', group: 'neuro', url: `${BASE}/neuroscience/cognitive-neuroscience/cerebellum/` },
    { id: 'Go & Nogo tasks', group: 'neuro', url: `${BASE}/neuroscience/cognitive-neuroscience/go-and-nogo-tasks/` },
    { id: 'How the Brain Distinguishes Music from Speech', group: 'neuro', url: `${BASE}/neuroscience/cognitive-neuroscience/how-the-brain-distinguishes-music-from-speech/` },
    { id: 'Attentional control theory', group: 'neuro', url: `${BASE}/neuroscience/attentional-control-theory/` },
    { id: 'Nucleus accumbens', group: 'neuro', url: `${BASE}/neuroscience/nucleus-accumbens/` },
    { id: 'Striatum', group: 'neuro', url: `${BASE}/neuroscience/striatum/` },
    { id: 'The thalamus in cognitive control and flexibility', group: 'neuro', url: `${BASE}/neuroscience/the-thalamus-in-cognitive-control-and-flexibility/` },
    { id: 'Neuronal memory formation', group: 'neuro', url: `${BASE}/neuroscience/neuronal-memory-formation/` },
    { id: 'Reward vs. Action prediction error', group: 'neuro', url: `${BASE}/neuroscience/reward-prediction-errors-vs-action-prediction-error/` },
    { id: 'Prediction error drives episodic memory updating', group: 'neuro', url: `${BASE}/neuroscience/past-meets-present-prediction-error-drives-episodic-memory-updating/` },
    { id: 'Handwriting leads to widespread brain connectivity', group: 'neuro', url: `${BASE}/neuroscience/handwriting-but-not-typewriting-leads-to-widespread-brain-connectivity/` },
    { id: 'Perceptual Straightening Hypothesis', group: 'neuro', url: `${BASE}/perceptual-straightening-hypothesis-of-the-brain/` },
    { id: 'The Looking-Glass Self', group: 'neuro', url: `${BASE}/the-looking-glass-self/` },

    // ---- EEG ----
    { id: 'EEG', group: 'eeg', url: `${BASE}/eeg/eeg/` },
    { id: 'Difference between spectrogram and scalogram', group: 'eeg', url: `${BASE}/eeg/difference-between-spectrogram-and-scalogram/` },
    { id: 'Laplacian filter in EEG signal processing', group: 'eeg', url: `${BASE}/eeg/laplacian-filter/` },
    { id: 'EEG responses to Real vs Virtual faces', group: 'eeg', url: `${BASE}/neuroscience/eeg-responses-to-the-real-vs-virtual-faces/` },
    { id: 'Narcissus effect perceiving own face via EEG', group: 'eeg', url: `${BASE}/narcissus-effect-while-perceiving-own-face-via-eeg/` },

    // ---- BCI / Biosignals ----
    { id: 'BCI & Unity Masterclass', group: 'bci', url: `${BASE}/bci/masterclass-bci-and-unity/bci-and-unity-masterclass/` },
    { id: 'Transformer-Based Pose Estimation (RGB + IMU)', group: 'bio', url: `${BASE}/biosignals/transformer-based-full-body-pose-estimation-for-rehabilitation-via-rgb-camera-and-imu-fusion/` },
    { id: 'Datasets for Pose Estimation', group: 'bio', url: `${BASE}/pose-estimation/datasets-pose-estimaiton/` },
    { id: 'Tactile sensing in robotics', group: 'bio', url: `${BASE}/tactile-sensing-in-robotics/` },

    // ---- NLP ----
    { id: 'KG and RAG', group: 'nlp', url: `${BASE}/nlp/kg-and-rag/` },
    { id: 'Separating similar-sounding sequences, different meaning', group: 'nlp', url: `${BASE}/nlp/separate-similar-sounding-sequences-with-different-meaning/` },

    // ---- Personality disorders / ASD ----
    { id: 'PTSD vs Complex PTSD vs BPD (ESEM study)', group: 'pd', url: `${BASE}/personality-disorders/bpd/distinguishing-ptsd-complex-ptsd-and-borderline-personality-disorder-using-exploratory-structural-equation-modeling/` },
    { id: 'Narcissistic, Psychopathic, or Borderline Abuse?', group: 'pd', url: `${BASE}/personality-disorders/narcissistic-psychopathic-or-borderline-abuse/` },
    { id: 'Speech prosody differences in autism (ML study)', group: 'asd', url: `${BASE}/asd/cross-linguistic-patterns-of-speech-prosodic-differences-in-autism-a-machine-learning-study/` },

    // ---- misc / other computational topics ----
    { id: 'Structural Information Theory', group: 'misc', url: `${BASE}/structural-information-theory/` },
    { id: 'A lineage-based model of positional information in brain development', group: 'misc', url: `${BASE}/a-lineage-based-model-of-scalable-positional-information-in-vertebrate-brain-development/` },
    { id: 'Brains use different circuits for rigid objects vs substances', group: 'misc', url: `${BASE}/brains-uses-different-circuits-to-process-rigid-objects-and-substances/` },
  ],
  links: [
    // hubs -> articles
    { source: 'AI', target: 'Automating the Search for Artificial Life with Foundation Models' },
    { source: 'AI', target: 'Learning long sequences in spiking neural networks' },
    { source: 'AI', target: 'Structural Embedding Alignment for Multimodal LLMs' },
    { source: 'AI', target: 'Charting trajectories of human thought using LLMs' },
    { source: 'AI', target: 'Human-like object concepts in multimodal LLMs' },

    { source: 'Neuroscience', target: 'Biologically-informed E/I ratio for robust SNN training' },
    { source: 'Neuroscience', target: 'Predictive learning shapes the geometry of the brain' },
    { source: 'Neuroscience', target: 'Topological Deep Learning for Neural Spike Decoding' },
    { source: 'Neuroscience', target: 'Dynamic population coding in prefrontal cortex' },
    { source: 'Neuroscience', target: 'Predictive coding' },
    { source: 'Neuroscience', target: 'Predictive coding and Alpha rhythm' },
    { source: 'Neuroscience', target: 'Is criticality a unified setpoint of brain function?' },
    { source: 'Neuroscience', target: 'Cerebellum' },
    { source: 'Neuroscience', target: 'Go & Nogo tasks' },
    { source: 'Neuroscience', target: 'How the Brain Distinguishes Music from Speech' },
    { source: 'Neuroscience', target: 'Attentional control theory' },
    { source: 'Neuroscience', target: 'Nucleus accumbens' },
    { source: 'Neuroscience', target: 'Striatum' },
    { source: 'Neuroscience', target: 'The thalamus in cognitive control and flexibility' },
    { source: 'Neuroscience', target: 'Neuronal memory formation' },
    { source: 'Neuroscience', target: 'Reward vs. Action prediction error' },
    { source: 'Neuroscience', target: 'Prediction error drives episodic memory updating' },
    { source: 'Neuroscience', target: 'Handwriting leads to widespread brain connectivity' },
    { source: 'Neuroscience', target: 'Perceptual Straightening Hypothesis' },
    { source: 'Neuroscience', target: 'The Looking-Glass Self' },
    { source: 'Neuroscience', target: 'A lineage-based model of positional information in brain development' },
    { source: 'Neuroscience', target: 'Brains use different circuits for rigid objects vs substances' },

    { source: 'EEG', target: 'Difference between spectrogram and scalogram' },
    { source: 'EEG', target: 'Laplacian filter in EEG signal processing' },
    { source: 'EEG', target: 'EEG responses to Real vs Virtual faces' },
    { source: 'EEG', target: 'Narcissus effect perceiving own face via EEG' },

    { source: 'BCI', target: 'BCI & Unity Masterclass' },
    { source: 'Biosignals', target: 'Transformer-Based Pose Estimation (RGB + IMU)' },
    { source: 'Biosignals', target: 'Datasets for Pose Estimation' },
    { source: 'Biosignals', target: 'Tactile sensing in robotics' },

    { source: 'NLP', target: 'KG and RAG' },
    { source: 'NLP', target: 'Separating similar-sounding sequences, different meaning' },

    { source: 'Personality Disorders', target: 'PTSD vs Complex PTSD vs BPD (ESEM study)' },
    { source: 'Personality Disorders', target: 'Narcissistic, Psychopathic, or Borderline Abuse?' },
    { source: 'ASD', target: 'Speech prosody differences in autism (ML study)' },

    // thematic cross-links between articles in different hubs
    { source: 'Learning long sequences in spiking neural networks', target: 'Biologically-informed E/I ratio for robust SNN training' },
    { source: 'Predictive coding', target: 'Predictive coding and Alpha rhythm' },
    { source: 'Predictive coding', target: 'Predictive learning shapes the geometry of the brain' },
    { source: 'Topological Deep Learning for Neural Spike Decoding', target: 'Dynamic population coding in prefrontal cortex' },
    { source: 'EEG responses to Real vs Virtual faces', target: 'Narcissus effect perceiving own face via EEG' },
    { source: 'EEG responses to Real vs Virtual faces', target: 'The Looking-Glass Self' },
    { source: 'Structural Embedding Alignment for Multimodal LLMs', target: 'Human-like object concepts in multimodal LLMs' },
    { source: 'Charting trajectories of human thought using LLMs', target: 'KG and RAG' },
    { source: 'Reward vs. Action prediction error', target: 'Prediction error drives episodic memory updating' },
    { source: 'Structural Information Theory', target: 'Predictive coding' },
    { source: 'A lineage-based model of positional information in brain development', target: 'Brains use different circuits for rigid objects vs substances' },
  ],
};
