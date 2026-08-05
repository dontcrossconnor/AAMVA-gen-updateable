import bwipjs from 'bwip-js';
import {
  DEFAULT_AAMVA_DATA,
  FIELD_GROUPS,
  US_STATES,
  AAMVA_VERSIONS,
  PRESETS,
  getStateActiveVersions,
  syncRemoteStateRules,
  buildAAMVAPayload
} from './aamva.js';

let currentData = { ...DEFAULT_AAMVA_DATA };
let activeTab = 'form';

// DOM Elements
const stateSelect = document.getElementById('stateSelect');
const headerVersionSelect = document.getElementById('headerVersionSelect');
const versionTooltipList = document.getElementById('versionTooltipList');
const syncRulesBtn = document.getElementById('syncRulesBtn');
const syncStatusBadge = document.getElementById('syncStatusBadge');
const endpointUrlInput = document.getElementById('endpointUrlInput');
const presetSelect = document.getElementById('presetSelect');
const resetBtn = document.getElementById('resetBtn');
const tabFormBtn = document.getElementById('tabFormBtn');
const tabRawBtn = document.getElementById('tabRawBtn');
const formTabContent = document.getElementById('formTabContent');
const rawTabContent = document.getElementById('rawTabContent');
const accordionContainer = document.getElementById('accordionContainer');
const rawPayloadText = document.getElementById('rawPayloadText');
const payloadByteCount = document.getElementById('payloadByteCount');
const barcodeCanvas = document.getElementById('barcodeCanvas');
const renderError = document.getElementById('renderError');
const eccLevel = document.getElementById('eccLevel');
const eccBadge = document.getElementById('eccBadge');
const scaleRange = document.getElementById('scaleRange');
const downloadPngBtn = document.getElementById('downloadPngBtn');
const downloadSvgBtn = document.getElementById('downloadSvgBtn');
const copyPayloadBtn = document.getElementById('copyPayloadBtn');
const validationBadge = document.getElementById('validationBadge');

function init() {
  const savedUrl = localStorage.getItem('aamva_custom_endpoint_url');
  if (savedUrl && endpointUrlInput) {
    endpointUrlInput.value = savedUrl;
  }

  populateStates();
  renderAccordionForm();
  updateVersionSelectorForState(currentData.DAJ || 'IL');
  populatePresets();
  bindEvents();
  updateAll();
}

function populateStates() {
  stateSelect.innerHTML = '';
  US_STATES.forEach(st => {
    const opt = document.createElement('option');
    opt.value = st.code;
    opt.textContent = `${st.name} (${st.code}) - IIN ${st.iin}`;
    if (st.code === (currentData.DAJ || 'IL')) opt.selected = true;
    stateSelect.appendChild(opt);
  });
}

/**
 * Dynamically populates and filters the AAMVA Version selector dropdown per selected state.
 * Only versions active in circulation for the state are available; obsolete/expired versions are filtered out.
 */
function updateVersionSelectorForState(stateCode) {
  const activeVersionCodes = getStateActiveVersions(stateCode);
  
  headerVersionSelect.innerHTML = '';
  versionTooltipList.innerHTML = '';

  // If currentData.aamvaVersion is not in active versions, set to default current version (e.g. '10')
  if (!activeVersionCodes.includes(currentData.aamvaVersion)) {
    currentData.aamvaVersion = activeVersionCodes[0] || '10';
  }

  // Filter AAMVA_VERSIONS list for this state
  AAMVA_VERSIONS.forEach(ver => {
    const isActiveForState = activeVersionCodes.includes(ver.code);
    
    if (isActiveForState) {
      const opt = document.createElement('option');
      opt.value = ver.code;
      opt.textContent = ver.label;
      if (ver.code === currentData.aamvaVersion) opt.selected = true;
      headerVersionSelect.appendChild(opt);

      const li = document.createElement('li');
      li.innerHTML = `<strong>v${ver.code} (${ver.year})</strong>: ${ver.hint}`;
      versionTooltipList.appendChild(li);
    }
  });

  // Also update form select element if rendered
  const formVersionSelect = accordionContainer.querySelector('[data-key="aamvaVersion"]');
  if (formVersionSelect) {
    formVersionSelect.innerHTML = '';
    AAMVA_VERSIONS.forEach(ver => {
      if (activeVersionCodes.includes(ver.code)) {
        const opt = document.createElement('option');
        opt.value = ver.code;
        opt.textContent = ver.label;
        if (ver.code === currentData.aamvaVersion) opt.selected = true;
        formVersionSelect.appendChild(opt);
      }
    });
  }
}

function populatePresets() {
  PRESETS.forEach(preset => {
    const opt = document.createElement('option');
    opt.value = preset.id;
    opt.textContent = preset.name;
    presetSelect.appendChild(opt);
  });
}

function renderAccordionForm() {
  accordionContainer.innerHTML = '';

  FIELD_GROUPS.forEach((group) => {
    const sec = document.createElement('div');
    sec.className = 'accordion-section';

    const header = document.createElement('div');
    header.className = 'accordion-header';
    header.innerHTML = `
      <div>
        <div class="accordion-title">${group.title}</div>
        <div class="accordion-subtitle">${group.description}</div>
      </div>
      <span class="accordion-icon" style="font-size: 0.8rem; color: var(--text-dim); transition: transform 0.2s;">&#9660;</span>
    `;

    const content = document.createElement('div');
    content.className = 'accordion-content';

    header.addEventListener('click', () => {
      const isHidden = content.style.display === 'none';
      content.style.display = isHidden ? 'grid' : 'none';
      header.querySelector('.accordion-icon').style.transform = isHidden ? 'rotate(0deg)' : 'rotate(-90deg)';
    });

    group.fields.forEach(field => {
      const wrapper = document.createElement('div');
      wrapper.className = 'field-wrapper';

      const label = document.createElement('label');
      label.className = 'field-label';

      // Tooltip Icon HTML
      const tooltipHTML = field.tooltip ? `
        <div class="tooltip-wrapper">
          <span class="tooltip-icon">?</span>
          <div class="tooltip-popover">
            <strong>${field.name} (${field.key})</strong>
            <p>${field.tooltip}</p>
            ${field.patternError ? `<p style="color:var(--accent-amber); font-size:0.725rem;"><strong>Format:</strong> ${field.patternError}</p>` : ''}
          </div>
        </div>
      ` : '';

      label.innerHTML = `
        <div style="display:flex; align-items:center; gap:0.35rem;">
          <span>${field.name}</span>
          ${tooltipHTML}
        </div>
        <span class="field-code">${field.key}</span>
      `;

      let inputElem;

      if (field.type === 'select') {
        inputElem = document.createElement('select');
        inputElem.className = 'field-select';
        field.options.forEach(optVal => {
          const opt = document.createElement('option');
          if (typeof optVal === 'object') {
            opt.value = optVal.val;
            opt.textContent = optVal.label;
          } else {
            opt.value = optVal;
            opt.textContent = optVal;
          }
          inputElem.appendChild(opt);
        });
      } else {
        inputElem = document.createElement('input');
        inputElem.type = 'text';
        inputElem.className = 'field-input';
        if (field.placeholder) inputElem.placeholder = field.placeholder;
      }

      inputElem.dataset.key = field.key;
      inputElem.value = currentData[field.key] !== undefined ? currentData[field.key] : '';

      const errorMsg = document.createElement('div');
      errorMsg.className = 'field-error-msg';
      errorMsg.textContent = field.patternError || 'Invalid format';

      const validateInput = () => {
        const val = inputElem.value.trim();
        if (field.required && !val) {
          inputElem.classList.add('is-invalid');
          inputElem.classList.remove('is-valid');
          errorMsg.style.display = 'block';
          return false;
        } else if (val && field.pattern) {
          const regex = new RegExp(field.pattern);
          if (!regex.test(val)) {
            inputElem.classList.add('is-invalid');
            inputElem.classList.remove('is-valid');
            errorMsg.style.display = 'block';
            return false;
          }
        }
        inputElem.classList.remove('is-invalid');
        if (val) inputElem.classList.add('is-valid');
        errorMsg.style.display = 'none';
        return true;
      };

      inputElem.addEventListener('input', (e) => {
        currentData[field.key] = e.target.value;
        validateInput();
        
        if (field.key === 'DAJ') {
          syncStateFromCode(e.target.value);
        } else if (field.key === 'aamvaVersion') {
          headerVersionSelect.value = e.target.value;
        } else if (field.key === 'issuerId') {
          // If user edits IIN manually, check if state matches
          const stObj = US_STATES.find(s => s.iin === e.target.value);
          if (stObj) {
            currentData.DAJ = stObj.code;
            stateSelect.value = stObj.code;
            updateVersionSelectorForState(stObj.code);
          }
        }
        
        if (activeTab === 'form') updateBarcodeFromData();
      });

      inputElem.addEventListener('blur', validateInput);

      wrapper.appendChild(label);
      wrapper.appendChild(inputElem);
      wrapper.appendChild(errorMsg);
      content.appendChild(wrapper);
    });

    sec.appendChild(header);
    sec.appendChild(content);
    accordionContainer.appendChild(sec);
  });
}

function updateHeaderSelectsFromData() {
  if (currentData.DAJ) {
    stateSelect.value = currentData.DAJ;
  }
  if (currentData.aamvaVersion) {
    headerVersionSelect.value = currentData.aamvaVersion;
  }
}

function bindEvents() {
  stateSelect.addEventListener('change', (e) => {
    const selectedStateCode = e.target.value;
    const stObj = US_STATES.find(s => s.code === selectedStateCode);
    if (stObj) {
      currentData.DAJ = stObj.code;
      currentData.issuerId = stObj.iin;
      updateVersionSelectorForState(stObj.code);
      updateFormInputsFromData();
      updateHeaderSelectsFromData();
      updateAll();
    }
  });

  headerVersionSelect.addEventListener('change', (e) => {
    currentData.aamvaVersion = e.target.value;
    updateFormInputsFromData();
    updateHeaderSelectsFromData();
    updateAll();
  });

  syncRulesBtn.addEventListener('click', async () => {
    syncStatusBadge.textContent = 'Syncing State Rules...';
    syncStatusBadge.style.color = 'var(--accent-amber)';
    syncRulesBtn.disabled = true;
    
    const customUrl = endpointUrlInput ? endpointUrlInput.value.trim() : '';
    const result = await syncRemoteStateRules(customUrl);
    
    if (result && result.success) {
      syncStatusBadge.textContent = `Rules: Synced (${result.source || 'Live'})`;
      syncStatusBadge.style.color = 'var(--accent-emerald)';
      updateVersionSelectorForState(currentData.DAJ || 'IL');
      updateAll();
    }
    setTimeout(() => {
      syncRulesBtn.disabled = false;
    }, 1000);
  });

  presetSelect.addEventListener('change', (e) => {
    const preset = PRESETS.find(p => p.id === e.target.value);
    if (preset) {
      currentData = { ...preset.data };
      syncStateFromCode(currentData.DAJ);
      updateVersionSelectorForState(currentData.DAJ);
      updateFormInputsFromData();
      updateHeaderSelectsFromData();
      updateAll();
    }
  });

  resetBtn.addEventListener('click', () => {
    currentData = { ...DEFAULT_AAMVA_DATA };
    presetSelect.value = '';
    stateSelect.value = 'IL';
    updateVersionSelectorForState('IL');
    updateFormInputsFromData();
    updateHeaderSelectsFromData();
    updateAll();
  });

  tabFormBtn.addEventListener('click', () => switchTab('form'));
  tabRawBtn.addEventListener('click', () => switchTab('raw'));

  rawPayloadText.addEventListener('input', () => {
    if (activeTab === 'raw') {
      const rawVal = rawPayloadText.value;
      payloadByteCount.textContent = `${rawVal.length} bytes`;
      renderBarcode(rawVal);
    }
  });

  eccLevel.addEventListener('change', (e) => {
    eccBadge.textContent = `ECC Level ${e.target.value}`;
    updateAll();
  });

  scaleRange.addEventListener('input', updateAll);

  downloadPngBtn.addEventListener('click', downloadPNG);
  downloadSvgBtn.addEventListener('click', downloadSVG);
  copyPayloadBtn.addEventListener('click', copyRawPayload);
}

function syncStateFromCode(stateCode) {
  const stObj = US_STATES.find(s => s.code === String(stateCode).toUpperCase());
  if (stObj) {
    stateSelect.value = stObj.code;
    currentData.issuerId = stObj.iin;
    updateVersionSelectorForState(stObj.code);
  }
}

function switchTab(tab) {
  activeTab = tab;
  if (tab === 'form') {
    tabFormBtn.classList.add('active');
    tabRawBtn.classList.remove('active');
    formTabContent.style.display = 'block';
    rawTabContent.style.display = 'none';
    updateBarcodeFromData();
  } else {
    tabRawBtn.classList.add('active');
    tabFormBtn.classList.remove('active');
    formTabContent.style.display = 'none';
    rawTabContent.style.display = 'block';
    const raw = buildAAMVAPayload(currentData);
    rawPayloadText.value = raw;
    payloadByteCount.textContent = `${raw.length} bytes`;
    renderBarcode(raw);
  }
}

function updateFormInputsFromData() {
  const inputs = accordionContainer.querySelectorAll('[data-key]');

  inputs.forEach(input => {
    const key = input.dataset.key;
    if (key && currentData[key] !== undefined) {
      input.value = currentData[key];
    }
  });

  validateAllFields();
}

function validateAllFields() {
  let allValid = true;

  FIELD_GROUPS.forEach(group => {
    group.fields.forEach(field => {
      const input = accordionContainer.querySelector(`[data-key="${field.key}"]`);
      if (input) {
        const val = input.value.trim();
        if (field.required && !val) {
          allValid = false;
        } else if (val && field.pattern) {
          const regex = new RegExp(field.pattern);
          if (!regex.test(val)) allValid = false;
        }
      }
    });
  });

  if (allValid) {
    validationBadge.textContent = 'Validation: Pass';
    validationBadge.style.background = 'rgba(16, 185, 129, 0.15)';
    validationBadge.style.color = 'var(--accent-emerald)';
    validationBadge.style.borderColor = 'rgba(16, 185, 129, 0.3)';
  } else {
    validationBadge.textContent = 'Validation: Issues Detected';
    validationBadge.style.background = 'rgba(244, 63, 94, 0.15)';
    validationBadge.style.color = 'var(--accent-rose)';
    validationBadge.style.borderColor = 'rgba(244, 63, 94, 0.3)';
  }
}

function updateAll() {
  if (activeTab === 'form') {
    updateBarcodeFromData();
  } else {
    renderBarcode(rawPayloadText.value);
  }
}

function updateBarcodeFromData() {
  validateAllFields();
  const payload = buildAAMVAPayload(currentData);
  rawPayloadText.value = payload;
  payloadByteCount.textContent = `${payload.length} bytes`;
  renderBarcode(payload);
}

function renderBarcode(text) {
  renderError.style.display = 'none';
  try {
    bwipjs.toCanvas(barcodeCanvas, {
      bcid: 'pdf417',
      text: text,
      scale: parseInt(scaleRange.value, 10) || 3,
      eclevel: parseInt(eccLevel.value, 10) || 4,
      columns: 13,
    });
  } catch (err) {
    console.error(err);
    renderError.textContent = `Rendering error: ${err.message || err}`;
    renderError.style.display = 'block';
  }
}

function downloadPNG() {
  const link = document.createElement('a');
  link.download = `aamva_${currentData.DAJ || 'DL'}_v${currentData.aamvaVersion || '10'}_pdf417.png`;
  link.href = barcodeCanvas.toDataURL('image/png');
  link.click();
}

function downloadSVG() {
  try {
    const payload = activeTab === 'form' ? buildAAMVAPayload(currentData) : rawPayloadText.value;
    const svgStr = bwipjs.toSVG({
      bcid: 'pdf417',
      text: payload,
      scale: parseInt(scaleRange.value, 10) || 3,
      eclevel: parseInt(eccLevel.value, 10) || 4,
      columns: 13,
    });
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `aamva_${currentData.DAJ || 'DL'}_v${currentData.aamvaVersion || '10'}_pdf417.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    alert(`SVG export error: ${err.message || err}`);
  }
}

function copyRawPayload() {
  const text = activeTab === 'form' ? buildAAMVAPayload(currentData) : rawPayloadText.value;
  navigator.clipboard.writeText(text).then(() => {
    const origText = copyPayloadBtn.textContent;
    copyPayloadBtn.textContent = 'Copied!';
    setTimeout(() => {
      copyPayloadBtn.textContent = origText;
    }, 2000);
  });
}

init();
