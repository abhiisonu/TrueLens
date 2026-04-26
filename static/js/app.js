document.addEventListener('DOMContentLoaded', () => {

    // --- Elements ---
    const fileInput = document.getElementById('file-input');
    const uploadPanel = document.getElementById('upload-panel');
    const previewPanel = document.getElementById('preview-panel');
    
    // Preview
    const fileNameDisplay = document.getElementById('file-name');
    const previewImage = document.getElementById('preview-image');
    const resetBtn = document.getElementById('reset-btn');
    const imageViewport = document.getElementById('image-viewport');
    const blurBackdrop = document.getElementById('blur-backdrop');
    
    // Buttons & Progress
    const analyzeBtn = document.getElementById('analyze-btn');
    const newScanBtn = document.getElementById('new-scan-btn');
    const progressContainer = document.getElementById('progress-container');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const scanningFx = document.getElementById('scanning-fx');
    const resultFx = document.getElementById('result-fx');

    // Telemetry Panel
    const logIdle = document.getElementById('log-idle');
    const logActive = document.getElementById('log-active');
    const logSteps = [
        document.getElementById('step-meta'),
        document.getElementById('step-freq'),
        document.getElementById('step-noise'),
        document.getElementById('step-vit'),
        document.getElementById('step-agg')
    ];

    // Info Panels
    const infoDisplays = document.getElementById('info-displays');
    const resultsDisplay = document.getElementById('results-display');

    // Results Data
    const resultCard = document.getElementById('result-card');
    const verdictTitle = document.getElementById('final-verdict-title');
    const verdictExplanation = document.getElementById('verdict-explanation');
    const circleFg = document.getElementById('circle-fg');
    const chartPct = document.getElementById('chart-pct');

    // Stats
    const valDf = document.getElementById('val-df');
    const barDf = document.getElementById('bar-df');
    const valDct = document.getElementById('val-dct');
    const barDct = document.getElementById('bar-dct');
    const valNoise = document.getElementById('val-noise');
    const barNoise = document.getElementById('bar-noise');
    const valEdge = document.getElementById('val-edge');
    const barEdge = document.getElementById('bar-edge');

    let selectedFile = null;
    let analysisInProgress = false;

    // --- Drag & Drop ---
    uploadPanel.addEventListener('click', () => fileInput.click());

    uploadPanel.addEventListener('dragover', e => {
        e.preventDefault();
        uploadPanel.classList.add('dragover');
    });

    uploadPanel.addEventListener('dragleave', () => {
        uploadPanel.classList.remove('dragover');
    });

    uploadPanel.addEventListener('drop', e => {
        e.preventDefault();
        uploadPanel.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) setFile(e.dataTransfer.files[0]);
    });

    fileInput.addEventListener('change', e => {
        if (e.target.files.length > 0) setFile(e.target.files[0]);
    });

    resetBtn.addEventListener('click', resetSystem);
    newScanBtn.addEventListener('click', resetSystem);
    analyzeBtn.addEventListener('click', runAnalysis);

    // --- Core Logic ---
    function setFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('Invalid format. Image files only.');
            return;
        }
        if (file.size > 20 * 1024 * 1024) {
            alert('File exceeds 20MB limit.');
            return;
        }

        selectedFile = file;
        fileNameDisplay.textContent = file.name;

        const reader = new FileReader();
        reader.onload = e => {
            const url = e.target.result;
            previewImage.src = url;
            blurBackdrop.style.backgroundImage = `url(${url})`;
            
            uploadPanel.classList.add('hidden');
            previewPanel.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }

    async function runAnalysis() {
        if (!selectedFile || analysisInProgress) return;
        analysisInProgress = true;

        // UI State -> Analyzing
        analyzeBtn.classList.add('hidden');
        progressContainer.classList.remove('hidden');
        scanningFx.classList.remove('hidden');
        imageViewport.classList.add('analyzing');
        
        infoDisplays.classList.add('hidden');
        resultsDisplay.classList.add('hidden');

        logIdle.classList.add('hidden');
        logActive.classList.remove('hidden');

        // Reset steps
        logSteps.forEach(s => {
            s.className = 'log-step';
            s.querySelector('.step-icon').innerHTML = '<div class="dot-pending"></div>';
        });

        // Backend Request
        const formData = new FormData();
        formData.append('file', selectedFile);

        let data = null;
        let fetchError = null;

        const fetchPromise = fetch('/predict', { method: 'POST', body: formData })
            .then(r => {
                if (!r.ok) throw new Error(`HTTP Error ${r.status}`);
                return r.json();
            })
            .then(resData => { data = resData; })
            .catch(e => { fetchError = e; });

        // Fake cinematic progression
        const totalDuration = 4500;
        const stepDuration = totalDuration / logSteps.length;
        
        let p = 0;
        progressBar.style.width = '0%';
        progressText.textContent = '0%';
        
        const progressInterval = setInterval(() => {
            p += Math.random() * 2 + 0.5;
            if (p > 99) p = 99;
            progressBar.style.width = p + '%';
            progressText.textContent = Math.floor(p) + '%';
        }, 100);

        let stepIndex = 0;
        const stepInterval = setInterval(() => {
            if (stepIndex > 0) {
                // Mark previous as done
                const prev = logSteps[stepIndex-1];
                prev.className = 'log-step done';
                prev.querySelector('.step-icon').innerHTML = '<i data-lucide="check-circle-2" class="icon-done"></i>';
                lucide.createIcons();
            }
            if (stepIndex < logSteps.length) {
                const curr = logSteps[stepIndex];
                curr.className = 'log-step active';
                curr.querySelector('.step-icon').innerHTML = '<div class="dot-pulse"></div><div class="dot-active"></div>';
            }
            stepIndex++;
        }, stepDuration);

        // Wait for both fetch AND cinematic time
        await Promise.all([
            fetchPromise,
            new Promise(r => setTimeout(r, totalDuration))
        ]);

        clearInterval(progressInterval);
        clearInterval(stepInterval);
        analysisInProgress = false;

        // Finish progress
        progressBar.style.width = '100%';
        progressText.textContent = '100%';
        
        // Finish final step
        const lastStep = logSteps[logSteps.length-1];
        lastStep.className = 'log-step done';
        lastStep.querySelector('.step-icon').innerHTML = '<i data-lucide="check-circle-2" class="icon-done"></i>';
        lucide.createIcons();

        if (fetchError) {
            alert("Analysis failed: " + fetchError.message);
            resetSystem();
            return;
        }

        setTimeout(() => displayResults(data), 500);
    }

    function displayResults(data) {
        progressContainer.classList.add('hidden');
        scanningFx.classList.add('hidden');
        newScanBtn.classList.remove('hidden');
        imageViewport.classList.remove('analyzing');

        resultsDisplay.classList.remove('hidden');
        resultsDisplay.classList.add('animate-in', 'slide-in-from-right-8', 'duration-700'); // generic tailwind-like util if css handles it
        
        // Determine state
        let isFake = false;
        let isUncertain = false;
        if (data.label === 'Fake') isFake = true;
        else if (data.label === 'Uncertain') isUncertain = true;

        // Styles
        resultCard.className = 'glass-panel result-panel h-full flex flex-col relative overflow-hidden';
        if (isFake) {
            resultCard.classList.add('fake');
            verdictTitle.innerHTML = '<i data-lucide="shield-alert"></i> SYNTHETIC';
            circleFg.setAttribute('stroke', 'url(#roseGradient)');
            resultFx.className = 'result-fx result-fake-bg';
        } else if (isUncertain) {
            resultCard.classList.add('uncertain');
            verdictTitle.innerHTML = '<i data-lucide="shield-alert"></i> AMBIGUOUS';
            circleFg.setAttribute('stroke', 'url(#amberGradient)');
            resultFx.className = 'result-fx';
        } else {
            resultCard.classList.add('real');
            verdictTitle.innerHTML = '<i data-lucide="shield-check"></i> AUTHENTIC';
            circleFg.setAttribute('stroke', 'url(#emeraldGradient)');
            resultFx.className = 'result-fx result-real-bg';
        }
        lucide.createIcons();
        resultFx.classList.remove('hidden');

        verdictExplanation.textContent = data.explanation || "Integrity verification complete.";

        // Circle Chart
        const conf = data.confidence || 0;
        const offset = 264 - (264 * conf);
        circleFg.style.strokeDashoffset = offset;
        animateNumber(chartPct, 0, conf * 100, 1500);

        // Metric Bars
        const d = data.detail || {};
        const n = d.neural || {};
        const f = d.forensics || {};

        setMetric(valDf, barDf, n['Deepfake Probability'] !== undefined ? n['Deepfake Probability'] * 100 : 0);
        // Inverse format for these, let's just render them as percentages relative to thresholds
        setMetric(valDct, barDct, f.dct_score !== undefined ? (1 - f.dct_score) * 100 : 0); 
        setMetric(valNoise, barNoise, f.noise_score !== undefined ? f.noise_score * 100 : 0);
        setMetric(valEdge, barEdge, f.edge_score !== undefined ? f.edge_score * 100 : 0);
    }

    function setMetric(valEl, barEl, numVal) {
        numVal = Math.min(Math.max(numVal, 0), 100);
        valEl.textContent = numVal.toFixed(1) + '%';
        
        let colorClass = 'bg-emerald-500';
        if (numVal > 60) colorClass = 'bg-rose-500';
        else if (numVal > 40) colorClass = 'bg-amber-500';

        barEl.className = 'metric-fill ' + colorClass;
        barEl.style.width = '0%';
        setTimeout(() => { barEl.style.width = numVal + '%'; }, 300);
        
        if (numVal > 60) valEl.classList.add('text-rose-400');
        else valEl.classList.add('text-emerald-400');
    }

    function resetSystem() {
        if (analysisInProgress) return;
        selectedFile = null;
        fileInput.value = '';
        
        previewPanel.classList.add('hidden');
        uploadPanel.classList.remove('hidden');
        
        analyzeBtn.classList.remove('hidden');
        newScanBtn.classList.add('hidden');
        progressContainer.classList.add('hidden');
        scanningFx.classList.add('hidden');
        resultFx.classList.add('hidden');
        imageViewport.classList.remove('analyzing');
        
        circleFg.style.strokeDashoffset = 264;
        
        logIdle.classList.remove('hidden');
        logActive.classList.add('hidden');
        
        infoDisplays.classList.remove('hidden');
        resultsDisplay.classList.add('hidden');
    }

    function animateNumber(el, start, end, duration) {
        let startTime = null;
        const step = (ts) => {
            if (!startTime) startTime = ts;
            const progress = Math.min((ts - startTime) / duration, 1);
            el.textContent = Math.round(progress * (end - start) + start);
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }
});
