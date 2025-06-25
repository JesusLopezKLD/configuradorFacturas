document.addEventListener('DOMContentLoaded', () => {
  const page = document.getElementById('page');
  const addTextBtn = document.getElementById('addText');
  const addImageBtn = document.getElementById('addImage');
  const addTableBtn = document.getElementById('addTable');
  const saveBtn = document.getElementById('saveJson');
  const loadBtn = document.getElementById('loadJson');
  const dataContainer = document.getElementById('dataFields');
  const tabs = document.querySelectorAll('.tabs li');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelector('.tabs li.active').classList.remove('active');
      document.querySelector('.tab-content.active').classList.remove('active');
      tab.classList.add('active');
      document.getElementById(tab.dataset.tab).classList.add('active');
    });
  });

  fetch('datosEjemplo.json')
    .then(res => res.json())
    .then(data => renderDataFields(data));

  page.addEventListener('dragover', e => e.preventDefault());
  page.addEventListener('drop', e => {
    e.preventDefault();
    const text = e.dataTransfer.getData('text/plain');
    if (text) {
      const el = createTextElement(text);
      el.style.left = e.offsetX + 'px';
      el.style.top = e.offsetY + 'px';
      page.appendChild(el);
    }
  });

  addTextBtn.addEventListener('click', () => {
    page.appendChild(createTextElement('Texto'));
  });

  addImageBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.addEventListener('change', () => {
      const file = input.files[0];
      if (file) {
        const img = createBaseElement('image');
        const imageEl = document.createElement('img');
        imageEl.src = URL.createObjectURL(file);
        imageEl.style.maxWidth = '200px';
        img.appendChild(imageEl);
        page.appendChild(img);
      }
    });
    input.click();
  });

  addTableBtn.addEventListener('click', () => {
    const el = createBaseElement('table');
    el.innerHTML = '<table border="1" contenteditable="true"><tr><td>Celda</td><td>Celda</td></tr></table>';
    page.appendChild(el);
  });

  saveBtn.addEventListener('click', saveDesign);
  loadBtn.addEventListener('click', loadDesign);

  function renderDataFields(data) {
    for (const group in data) {
      const details = document.createElement('details');
      const summary = document.createElement('summary');
      summary.textContent = group;
      details.appendChild(summary);
      const fields = data[group];
      for (const key in fields) {
        const div = document.createElement('div');
        div.className = 'field';
        div.textContent = key + ': ' + fields[key];
        div.draggable = true;
        div.addEventListener('dragstart', e => {
          e.dataTransfer.setData('text/plain', fields[key]);
        });
        details.appendChild(div);
      }
      dataContainer.appendChild(details);
    }
  }

  function createTextElement(content) {
    const el = createBaseElement('text');
    el.textContent = content;
    el.contentEditable = true;
    return el;
  }

  function createBaseElement(type) {
    const el = document.createElement('div');
    el.className = 'element';
    el.dataset.type = type;
    el.style.left = '20px';
    el.style.top = '20px';
    addDrag(el);
    addResize(el);
    addRotate(el);
    return el;
  }

  function addDrag(el) {
    let startX, startY;
    el.addEventListener('pointerdown', startDrag);
    function startDrag(e) {
      if (e.target.classList.contains('resize-handle') || e.target.classList.contains('rotate-handle')) return;
      startX = e.clientX - el.offsetLeft;
      startY = e.clientY - el.offsetTop;
      document.addEventListener('pointermove', move);
      document.addEventListener('pointerup', stop);
    }
    function move(e) {
      el.style.left = e.clientX - startX + 'px';
      el.style.top = e.clientY - startY + 'px';
    }
    function stop() {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', stop);
    }
  }

  function addResize(el) {
    const handle = document.createElement('div');
    handle.className = 'resize-handle';
    el.appendChild(handle);
    let startX, startY, startW, startH;
    handle.addEventListener('pointerdown', e => {
      e.stopPropagation();
      startX = e.clientX;
      startY = e.clientY;
      startW = el.offsetWidth;
      startH = el.offsetHeight;
      document.addEventListener('pointermove', resize);
      document.addEventListener('pointerup', stop);
    });
    function resize(e) {
      el.style.width = startW + (e.clientX - startX) + 'px';
      el.style.height = startH + (e.clientY - startY) + 'px';
    }
    function stop() {
      document.removeEventListener('pointermove', resize);
      document.removeEventListener('pointerup', stop);
    }
  }

  function addRotate(el) {
    const handle = document.createElement('div');
    handle.className = 'rotate-handle';
    el.appendChild(handle);
    let startAngle = 0;
    let centerX, centerY;
    handle.addEventListener('pointerdown', e => {
      e.stopPropagation();
      const rect = el.getBoundingClientRect();
      centerX = rect.left + rect.width / 2;
      centerY = rect.top + rect.height / 2;
      startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) - (parseFloat(el.dataset.rotation) || 0);
      document.addEventListener('pointermove', rotate);
      document.addEventListener('pointerup', stop);
    });
    function rotate(e) {
      const ang = Math.atan2(e.clientY - centerY, e.clientX - centerX) - startAngle;
      el.style.transform = 'rotate(' + ang + 'rad)';
      el.dataset.rotation = ang;
    }
    function stop() {
      document.removeEventListener('pointermove', rotate);
      document.removeEventListener('pointerup', stop);
    }
  }

  function saveDesign() {
    const data = [];
    page.querySelectorAll('.element').forEach(el => {
      data.push({
        type: el.dataset.type,
        html: el.innerHTML,
        x: el.style.left,
        y: el.style.top,
        w: el.style.width,
        h: el.style.height,
        rotation: el.dataset.rotation || '0'
      });
    });
    localStorage.setItem('invoiceDesign', JSON.stringify(data));
    alert('Guardado en localStorage');
  }

  function loadDesign() {
    const data = JSON.parse(localStorage.getItem('invoiceDesign') || 'null');
    if (!data) return;
    page.innerHTML = '';
    data.forEach(item => {
      let el;
      if (item.type === 'text') {
        el = createTextElement('');
        el.innerHTML = item.html;
      } else if (item.type === 'image') {
        el = createBaseElement('image');
        el.innerHTML = item.html;
      } else if (item.type === 'table') {
        el = createBaseElement('table');
        el.innerHTML = item.html;
      }
      el.style.left = item.x;
      el.style.top = item.y;
      el.style.width = item.w;
      el.style.height = item.h;
      el.style.transform = 'rotate(' + item.rotation + ')';
      el.dataset.rotation = item.rotation;
      page.appendChild(el);
    });
  }
});
