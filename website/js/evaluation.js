// IAML Post-Program Evaluation — participant-facing form controller.
// Renders whichever phase the server says is current. Supports:
//   - integer (NPS scale)
//   - enum (radio list)
//   - open_text (textarea with optional max_length)
//   - matrix (rows × 1–5 scale)
//
// Intra-phase conditionals (e.g. Q5 shows only when Q4 ∈ ['Partially met','Did not meet'])
// are evaluated client-side on every answer change; hidden questions don't count
// against required-field validation and aren't submitted. The server's own
// conditional evaluator (public.eval_conditional_applies) is the source of truth.

(function () {
  'use strict';

  const TOTAL_PHASES = 5;
  const BUILT_PHASES = 5; // all phases shipped

  const els = {
    loading: document.getElementById('evalLoading'),
    form: document.getElementById('evalForm'),
    placeholder: document.getElementById('evalPlaceholder'),
    complete: document.getElementById('evalComplete'),
    error: document.getElementById('evalError'),
    errorBody: document.getElementById('evalErrorBody'),
    programName: document.getElementById('evalProgramName'),
    instanceName: document.getElementById('evalInstanceName'),
    progressLabel: document.getElementById('evalProgressLabel'),
    progressFill: document.getElementById('evalProgressFill'),
    phaseTitle: document.getElementById('evalPhaseTitle'),
    phaseBlurb: document.getElementById('evalPhaseBlurb'),
    questions: document.getElementById('evalQuestions'),
    phaseForm: document.getElementById('evalPhaseForm'),
    submitBtn: document.getElementById('evalSubmitBtn'),
    inlineError: document.getElementById('evalInlineError')
  };

  const PHASE_META = {
    1: { title: 'Quick pulse',         blurb: 'Two quick questions to get started.' },
    2: { title: 'Program experience',  blurb: 'How the program landed for you.' },
    3: { title: 'Your work situation', blurb: 'What you&rsquo;re navigating back at work.' },
    4: { title: 'Future programs',     blurb: 'What&rsquo;s next for you and your team.' },
    5: { title: 'Final thoughts',      blurb: 'A few last things before we wrap up.' }
  };

  const state = {
    token: null,
    evaluationId: null,
    currentPhase: null,
    programName: null,
    questions: [],
    answers: {}
  };

  // ---------- view helpers -------------------------------------------------

  function showState(name) {
    ['loading', 'form', 'placeholder', 'complete', 'error'].forEach((k) => {
      if (els[k]) els[k].classList.toggle('eval-state-hidden', k !== name);
    });
  }

  function showInlineError(message) {
    if (!els.inlineError) return;
    els.inlineError.textContent = message;
    els.inlineError.classList.remove('eval-state-hidden');
  }

  function clearInlineError() {
    if (!els.inlineError) return;
    els.inlineError.classList.add('eval-state-hidden');
    els.inlineError.textContent = '';
  }

  function setProgress(phase) {
    const clamped = Math.max(1, Math.min(TOTAL_PHASES, phase));
    els.progressLabel.textContent = `Step ${clamped} of ${TOTAL_PHASES}`;
    els.progressFill.style.width = `${(clamped / TOTAL_PHASES) * 100}%`;
    const meta = PHASE_META[clamped];
    if (meta) {
      els.phaseTitle.innerHTML = meta.title;
      els.phaseBlurb.innerHTML = meta.blurb;
    }
  }

  // ---------- conditional evaluator (mirrors server-side logic) -----------

  function evaluateConditional(cond, answers) {
    if (!cond || typeof cond !== 'object') return true;
    const qid = cond.question_id;
    const op = cond.operator || 'eq';
    const val = cond.value;
    const ans = answers[qid];
    const hasAns = ans !== undefined && ans !== null && ans !== '';

    if (op === 'is_set') return hasAns;
    if (op === 'is_not_set') return !hasAns;
    if (!hasAns) return false;

    const ansStr = typeof ans === 'object' ? JSON.stringify(ans) : String(ans);
    if (op === 'eq') return ansStr === String(val);
    if (op === 'in') return Array.isArray(val) && val.map(String).includes(ansStr);
    if (op === 'not_in') return Array.isArray(val) && !val.map(String).includes(ansStr);
    return true;
  }

  function refreshConditionals() {
    let anyChange = false;
    state.questions.forEach((q) => {
      const node = els.questions.querySelector(`[data-qid="${q.question_id}"]`);
      if (!node) return;
      const visible = evaluateConditional(q.conditional_on, state.answers);
      const currentlyHidden = node.classList.contains('eval-question-hidden');
      if (visible && currentlyHidden) {
        node.classList.remove('eval-question-hidden');
      } else if (!visible && !currentlyHidden) {
        node.classList.add('eval-question-hidden');
        if (state.answers[q.question_id] !== undefined) {
          delete state.answers[q.question_id];
          anyChange = true;
        }
      }
    });
    return anyChange;
  }

  // ---------- question renderers ------------------------------------------

  function setAnswer(qid, value) {
    if (value === undefined || value === null || value === '') {
      delete state.answers[qid];
    } else {
      state.answers[qid] = value;
    }
    refreshConditionals();
    clearInlineError();
  }

  function renderInteger(q) {
    const opts = q.options || {};
    const min = Number.isFinite(opts.min) ? opts.min : 0;
    const max = Number.isFinite(opts.max) ? opts.max : 10;
    const lowLabel = opts.scale_labels && opts.scale_labels[String(min)];
    const highLabel = opts.scale_labels && opts.scale_labels[String(max)];

    const wrapper = document.createElement('div');
    wrapper.className = 'eval-question';
    wrapper.dataset.qid = q.question_id;
    wrapper.dataset.answerType = q.answer_type;
    wrapper.innerHTML = `
      ${questionHeader(q)}
      <div class="eval-nps-scale" role="radiogroup" aria-label="${escapeAttr(q.prompt)}"></div>
      ${(lowLabel || highLabel) ? `
        <div class="eval-nps-legend">
          <span>${escapeHtml(lowLabel || '')}</span>
          <span>${escapeHtml(highLabel || '')}</span>
        </div>` : ''}
    `;
    const scale = wrapper.querySelector('.eval-nps-scale');
    for (let n = min; n <= max; n++) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'eval-nps-btn';
      btn.textContent = String(n);
      btn.dataset.value = String(n);
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', 'false');
      btn.addEventListener('click', () => {
        scale.querySelectorAll('.eval-nps-btn').forEach((el) => {
          el.classList.remove('selected');
          el.setAttribute('aria-checked', 'false');
        });
        btn.classList.add('selected');
        btn.setAttribute('aria-checked', 'true');
        setAnswer(q.question_id, Number(btn.dataset.value));
      });
      scale.appendChild(btn);
    }
    return wrapper;
  }

  function renderEnum(q) {
    const choices = (q.options && Array.isArray(q.options.choices)) ? q.options.choices : [];

    const wrapper = document.createElement('div');
    wrapper.className = 'eval-question';
    wrapper.dataset.qid = q.question_id;
    wrapper.dataset.answerType = q.answer_type;
    wrapper.innerHTML = `
      ${questionHeader(q)}
      <div class="eval-enum-choices" role="radiogroup" aria-label="${escapeAttr(q.prompt)}"></div>
    `;
    const container = wrapper.querySelector('.eval-enum-choices');
    const groupName = `q-${q.question_id}`;

    choices.forEach((choice) => {
      const id = `${groupName}-${slug(choice)}`;
      const label = document.createElement('label');
      label.className = 'eval-enum-choice';
      label.setAttribute('for', id);
      label.innerHTML = `
        <input type="radio" name="${escapeAttr(groupName)}" id="${escapeAttr(id)}" value="${escapeAttr(choice)}">
        <span>${escapeHtml(choice)}</span>
      `;
      const input = label.querySelector('input');
      input.addEventListener('change', () => {
        container.querySelectorAll('.eval-enum-choice').forEach((el) => el.classList.remove('selected'));
        label.classList.add('selected');
        setAnswer(q.question_id, choice);
      });
      container.appendChild(label);
    });
    return wrapper;
  }

  function renderOpenText(q) {
    const opts = q.options || {};
    const placeholder = opts.placeholder || '';
    const maxLength = Number.isInteger(opts.max_length) ? opts.max_length : 2000;

    const wrapper = document.createElement('div');
    wrapper.className = 'eval-question';
    wrapper.dataset.qid = q.question_id;
    wrapper.dataset.answerType = q.answer_type;
    wrapper.innerHTML = `
      ${questionHeader(q)}
      <textarea class="eval-textarea"
                rows="4"
                maxlength="${maxLength}"
                placeholder="${escapeAttr(placeholder)}"></textarea>
      <div class="eval-textarea-counter" aria-hidden="true"><span class="eval-textarea-count">0</span> / ${maxLength}</div>
    `;
    const textarea = wrapper.querySelector('textarea');
    const counter = wrapper.querySelector('.eval-textarea-count');
    textarea.addEventListener('input', () => {
      const v = textarea.value;
      counter.textContent = String(v.length);
      setAnswer(q.question_id, v.trim() === '' ? null : v);
    });
    return wrapper;
  }

  function renderMatrix(q) {
    const opts = q.options || {};
    const rows = Array.isArray(opts.rows) ? opts.rows : [];

    // Columns can come from two shapes:
    //   options.columns = [{value, label}, ...]      — named (e.g. Q17 registration status)
    //   options.scale   = {min, max, labels: {...}}  — numeric (e.g. Q7, Q11, Q13)
    let columns;
    let valueCast;
    if (Array.isArray(opts.columns)) {
      columns = opts.columns.map((c) => ({
        value: c.value,
        numLabel: c.label || c.value,
        helperLabel: ''
      }));
      valueCast = (v) => v; // keep strings as-is
    } else {
      const scale = opts.scale || { min: 1, max: 5, labels: {} };
      const scaleMin = Number.isFinite(scale.min) ? scale.min : 1;
      const scaleMax = Number.isFinite(scale.max) ? scale.max : 5;
      columns = range(scaleMin, scaleMax).map((n) => ({
        value: n,
        numLabel: String(n),
        helperLabel: (scale.labels && scale.labels[String(n)]) || ''
      }));
      valueCast = (v) => Number(v);
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'eval-question';
    wrapper.dataset.qid = q.question_id;
    wrapper.dataset.answerType = q.answer_type;
    wrapper.style.setProperty('--eval-matrix-cols', String(columns.length));
    const matrixValues = {};

    const header = `
      <div class="eval-matrix-header">
        <div></div>
        ${columns.map((c) => `
          <div class="eval-matrix-col-label">
            <div class="eval-matrix-col-num">${escapeHtml(c.numLabel)}</div>
            ${c.helperLabel ? `<div class="eval-matrix-col-text">${escapeHtml(c.helperLabel)}</div>` : ''}
          </div>`).join('')}
      </div>
    `;

    const rowsHtml = rows.map((row) => {
      const radioName = `q-${q.question_id}-${row.row_id}`;
      return `
        <div class="eval-matrix-row" data-row-id="${escapeAttr(row.row_id)}">
          <div class="eval-matrix-row-label">${escapeHtml(row.label)}</div>
          ${columns.map((c) => `
            <label class="eval-matrix-cell">
              <input type="radio" name="${escapeAttr(radioName)}" value="${escapeAttr(String(c.value))}">
              <span class="eval-matrix-dot" aria-hidden="true"></span>
              <span class="eval-matrix-mobile-label">${escapeHtml(c.numLabel)}${c.helperLabel ? ' — ' + escapeHtml(c.helperLabel) : ''}</span>
            </label>`).join('')}
        </div>`;
    }).join('');

    wrapper.innerHTML = `
      ${questionHeader(q)}
      <div class="eval-matrix" role="group" aria-label="${escapeAttr(q.prompt)}">
        ${header}
        ${rowsHtml}
      </div>
    `;

    wrapper.querySelectorAll('.eval-matrix-row').forEach((rowEl) => {
      const rowId = rowEl.dataset.rowId;
      rowEl.querySelectorAll('input[type="radio"]').forEach((input) => {
        input.addEventListener('change', () => {
          matrixValues[rowId] = valueCast(input.value);
          rowEl.querySelectorAll('.eval-matrix-cell').forEach((c) => c.classList.remove('selected'));
          input.closest('.eval-matrix-cell').classList.add('selected');
          setAnswer(q.question_id, { ...matrixValues });
        });
      });
    });

    return wrapper;
  }

  function renderRepeatableBlock(q) {
    const opts = q.options || {};
    const fields = Array.isArray(opts.fields) ? opts.fields : [];
    const minEntries = Math.max(1, Number(opts.min_entries) || 1);
    const maxEntries = Math.max(minEntries, Number(opts.max_entries) || 10);
    const addLabel = opts.add_button_label || 'Add another';

    const wrapper = document.createElement('div');
    wrapper.className = 'eval-question';
    wrapper.dataset.qid = q.question_id;
    wrapper.dataset.answerType = q.answer_type;
    wrapper.innerHTML = `
      ${questionHeader(q)}
      <div class="eval-repeatable" role="group" aria-label="${escapeAttr(q.prompt)}"></div>
      <button type="button" class="eval-repeatable-add">+ ${escapeHtml(addLabel)}</button>
    `;

    const container = wrapper.querySelector('.eval-repeatable');
    const addBtn = wrapper.querySelector('.eval-repeatable-add');

    const commit = () => {
      const entryEls = container.querySelectorAll('.eval-repeatable-entry');
      const entries = [];
      entryEls.forEach((entryEl) => {
        const entry = {};
        entryEl.querySelectorAll('input[data-field-id]').forEach((input) => {
          const v = input.value.trim();
          if (v) entry[input.dataset.fieldId] = v;
        });
        if (Object.keys(entry).length > 0) entries.push(entry);
      });
      if (entries.length === 0) {
        setAnswer(q.question_id, null);
      } else {
        setAnswer(q.question_id, { entries });
      }
    };

    const addEntry = () => {
      if (container.children.length >= maxEntries) return;
      const entry = document.createElement('div');
      entry.className = 'eval-repeatable-entry';
      entry.innerHTML = `
        <div class="eval-repeatable-fields">
          ${fields.map((f) => `
            <label class="eval-repeatable-field">
              <span class="eval-repeatable-field-label">${escapeHtml(f.label || f.field_id)}</span>
              <input type="${escapeAttr(f.type === 'email' ? 'email' : 'text')}"
                     data-field-id="${escapeAttr(f.field_id)}"
                     placeholder="${escapeAttr(f.placeholder || '')}"
                     autocomplete="off">
            </label>`).join('')}
        </div>
        <button type="button" class="eval-repeatable-remove" aria-label="Remove">&times;</button>
      `;
      entry.querySelectorAll('input').forEach((inp) => inp.addEventListener('input', commit));
      entry.querySelector('.eval-repeatable-remove').addEventListener('click', () => {
        if (container.children.length <= minEntries) {
          // Clear fields instead of removing the card
          entry.querySelectorAll('input').forEach((inp) => { inp.value = ''; });
          commit();
          return;
        }
        entry.remove();
        updateAddButtonState();
        commit();
      });
      container.appendChild(entry);
      updateAddButtonState();
    };

    const updateAddButtonState = () => {
      addBtn.disabled = container.children.length >= maxEntries;
    };

    addBtn.addEventListener('click', () => { addEntry(); commit(); });

    for (let i = 0; i < minEntries; i++) addEntry();
    return wrapper;
  }

  function renderMultiEnum(q) {
    const opts = q.options || {};
    const rawChoices = Array.isArray(opts.choices) ? opts.choices : [];
    // Normalize choices — either string entries or {id, label, exclusive?, free_text?}
    const choices = rawChoices.map((c, i) => (
      typeof c === 'string'
        ? { id: slug(c) || `c${i}`, label: c }
        : { id: c.id || slug(c.label || '') || `c${i}`, label: c.label || c.id, exclusive: !!c.exclusive, free_text: !!c.free_text }
    ));

    const wrapper = document.createElement('div');
    wrapper.className = 'eval-question';
    wrapper.dataset.qid = q.question_id;
    wrapper.dataset.answerType = q.answer_type;

    const choicesHtml = choices.map((c) => {
      const cid = `${q.question_id}-${c.id}`;
      const flags = [];
      if (c.exclusive) flags.push('data-exclusive="1"');
      if (c.free_text) flags.push('data-free-text="1"');
      return `
        <label class="eval-multi-choice" data-id="${escapeAttr(c.id)}" ${flags.join(' ')}>
          <input type="checkbox" id="${escapeAttr(cid)}" value="${escapeAttr(c.id)}">
          <span class="eval-multi-checkbox" aria-hidden="true"></span>
          <span class="eval-multi-label">${escapeHtml(c.label)}</span>
          ${c.free_text ? `
            <input type="text" class="eval-multi-free-text"
                   placeholder="Tell us more"
                   maxlength="500"
                   aria-label="Free text for ${escapeAttr(c.label)}"
                   disabled>
          ` : ''}
        </label>`;
    }).join('');

    wrapper.innerHTML = `
      ${questionHeader(q)}
      <div class="eval-multi-choices" role="group" aria-label="${escapeAttr(q.prompt)}">
        ${choicesHtml}
      </div>
    `;

    const commit = () => {
      const labels = wrapper.querySelectorAll('.eval-multi-choice');
      const selected = [];
      let otherText = '';
      labels.forEach((lab) => {
        const cb = lab.querySelector('input[type="checkbox"]');
        const isOn = cb.checked;
        lab.classList.toggle('selected', isOn);
        if (isOn) selected.push(lab.dataset.id);
        const ftInput = lab.querySelector('.eval-multi-free-text');
        if (ftInput) {
          ftInput.disabled = !isOn;
          if (!isOn) ftInput.value = '';
          if (isOn && ftInput.value.trim()) otherText = ftInput.value.trim();
        }
      });
      if (selected.length === 0 && !otherText) {
        setAnswer(q.question_id, null);
        return;
      }
      const answer = { selected };
      if (otherText) answer.other_text = otherText;
      setAnswer(q.question_id, answer);
    };

    // Exclusive/non-exclusive mutual exclusion
    wrapper.querySelectorAll('.eval-multi-choice input[type="checkbox"]').forEach((cb) => {
      cb.addEventListener('change', () => {
        const label = cb.closest('.eval-multi-choice');
        const thisExclusive = label.dataset.exclusive === '1';
        if (cb.checked) {
          wrapper.querySelectorAll('.eval-multi-choice').forEach((other) => {
            if (other === label) return;
            const otherExclusive = other.dataset.exclusive === '1';
            if (thisExclusive || otherExclusive) {
              const otherCb = other.querySelector('input[type="checkbox"]');
              if (otherCb.checked) {
                otherCb.checked = false;
              }
            }
          });
        }
        commit();
      });
    });
    wrapper.querySelectorAll('.eval-multi-free-text').forEach((ft) => {
      ft.addEventListener('input', commit);
      // Prevent the surrounding label click from toggling the checkbox when the user focuses the input
      ft.addEventListener('click', (e) => e.stopPropagation());
    });

    return wrapper;
  }

  function renderUnsupported(q) {
    const wrapper = document.createElement('div');
    wrapper.className = 'eval-question';
    wrapper.dataset.qid = q.question_id;
    wrapper.innerHTML = `
      ${questionHeader(q)}
      <p class="eval-state-body" style="text-align: left; padding: 0;">
        This question type (<code>${escapeHtml(q.answer_type)}</code>) will render when the next phase ships.
      </p>
    `;
    return wrapper;
  }

  function questionHeader(q) {
    const req = q.is_required ? ' eval-question-required' : '';
    const helper = q.helper_text ? `<p class="eval-question-helper">${escapeHtml(q.helper_text)}</p>` : '';
    return `
      <p class="eval-question-prompt${req}">${escapeHtml(q.prompt)}</p>
      ${helper}
    `;
  }

  function renderQuestions(questions) {
    els.questions.innerHTML = '';
    state.answers = {};
    questions.forEach((q) => {
      let node;
      switch (q.answer_type) {
        case 'integer':          node = renderInteger(q); break;
        case 'enum':             node = renderEnum(q); break;
        case 'open_text':        node = renderOpenText(q); break;
        case 'matrix':           node = renderMatrix(q); break;
        case 'multi_enum':       node = renderMultiEnum(q); break;
        case 'repeatable_block': node = renderRepeatableBlock(q); break;
        default:                 node = renderUnsupported(q); break;
      }
      els.questions.appendChild(node);
    });
    refreshConditionals();
  }

  // ---------- data flow ---------------------------------------------------

  function getToken() {
    const params = new URLSearchParams(window.location.search);
    const token = (params.get('token') || '').trim();
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token) ? token : null;
  }

  async function load() {
    showState('loading');
    state.token = getToken();
    if (!state.token) {
      els.errorBody.innerHTML = 'This link is missing or invalid. Please contact <a href="mailto:info@iaml.com">info@iaml.com</a>.';
      showState('error');
      return;
    }

    try {
      const resp = await fetch(`/api/eval-load?token=${encodeURIComponent(state.token)}`);
      if (resp.status === 404) {
        els.errorBody.innerHTML = 'We couldn&rsquo;t find this evaluation. The link may have expired. Please contact <a href="mailto:info@iaml.com">info@iaml.com</a>.';
        showState('error');
        return;
      }
      if (!resp.ok) throw new Error(`Load failed: ${resp.status}`);
      const data = await resp.json();

      state.evaluationId = data.evaluation_id;
      state.currentPhase = data.current_phase;
      state.programName = data.program_name;
      state.questions = data.questions || [];

      els.programName.textContent = data.program_name || 'IAML Program';
      els.instanceName.textContent = data.instance_name || '';

      if (data.status === 'complete') {
        showState('complete');
        return;
      }

      if (state.currentPhase > BUILT_PHASES) {
        showState('placeholder');
        return;
      }

      setProgress(state.currentPhase);
      renderQuestions(state.questions);
      showState('form');
    } catch (err) {
      console.error('eval load failed', err);
      els.errorBody.innerHTML = 'Something went wrong loading your evaluation. Please try again in a moment.';
      showState('error');
    }
  }

  async function submit(e) {
    e.preventDefault();
    clearInlineError();

    // Only required the questions currently visible (conditional survivors).
    const missing = state.questions.filter((q) => {
      if (!q.is_required) return false;
      if (!evaluateConditional(q.conditional_on, state.answers)) return false;
      return !(q.question_id in state.answers);
    });
    if (missing.length > 0) {
      showInlineError('Please answer every visible question before continuing.');
      return;
    }

    els.submitBtn.disabled = true;
    els.submitBtn.textContent = 'Saving…';

    try {
      const resp = await fetch('/api/eval-phase-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: state.token,
          phase: state.currentPhase,
          answers: state.answers
        })
      });
      const body = await resp.json().catch(() => ({}));

      if (!resp.ok) {
        if (resp.status === 409 && body.expected_phase) {
          await load();
          return;
        }
        showInlineError(body.error || 'We couldn’t save your answers. Please try again.');
        return;
      }

      if (body.status === 'complete') {
        showState('complete');
      } else if (body.next_phase > BUILT_PHASES) {
        showState('placeholder');
      } else {
        // Reload to fetch the next phase's question set from the server
        await load();
      }
    } catch (err) {
      console.error('submit failed', err);
      showInlineError('Network error. Please check your connection and try again.');
    } finally {
      els.submitBtn.disabled = false;
      els.submitBtn.textContent = 'Next';
    }
  }

  // ---------- utils -------------------------------------------------------

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  function escapeAttr(s) { return escapeHtml(s); }
  function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function range(a, b) { const out = []; for (let i = a; i <= b; i++) out.push(i); return out; }

  document.addEventListener('DOMContentLoaded', () => {
    els.phaseForm.addEventListener('submit', submit);
    load();
  });
})();
