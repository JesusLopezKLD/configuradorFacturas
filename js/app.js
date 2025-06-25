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
  page.addEventListener('drop', handleDrop);

  function handleDrop(e) {
    e.preventDefault();
    const data = e.dataTransfer.getData('text/plain');
    if (!data) return;
    if (data === '__image__') {
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
          img.style.left = e.offsetX + 'px';
          img.style.top = e.offsetY + 'px';
          page.appendChild(img);
        }
      });
      input.click();
      return;
    }

    if (e.target.tagName === 'TD') {
      e.target.textContent += data;
    } else if (e.target.classList.contains('element') && e.target.dataset.type === 'text') {
      e.target.textContent += data;
    } else {
      const el = createTextElement(data);
      el.style.left = e.offsetX + 'px';
      el.style.top = e.offsetY + 'px';
      page.appendChild(el);
    }
  }

  addTextBtn.addEventListener('click', () => {
    page.appendChild(createTextElement('Texto'));
  });

  addImageBtn.draggable = true;
  addImageBtn.addEventListener('dragstart', e => {
    e.dataTransfer.setData('text/plain', '__image__');
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
    let cols = parseInt(prompt('Número de columnas', '2'), 10);
    if (!cols || cols < 1) cols = 2;
    const el = createTableElement(cols);
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

  function createTableElement(cols) {
    const el = createBaseElement('table');
    const table = document.createElement('table');
    table.border = '1';
    const row = document.createElement('tr');
    for (let i = 0; i < cols; i++) {
      const td = document.createElement('td');
      td.textContent = 'Celda';
      td.addEventListener('dragover', ev => ev.preventDefault());
      td.addEventListener('drop', handleDrop);
      row.appendChild(td);
    }
    table.appendChild(row);
    el.appendChild(table);

    const cfg = document.createElement('div');
    cfg.className = 'config-btn';
    cfg.textContent = '⚙';
    cfg.addEventListener('click', () => configureTable(el));
    el.appendChild(cfg);

    return el;
  }

  function configureTable(wrapper) {
    const table = wrapper.querySelector('table');
    if (!table) return;
    let cols = table.rows[0] ? table.rows[0].cells.length : 1;
    const newCols = parseInt(prompt('Número de columnas', cols), 10);
    if (newCols && newCols !== cols) {
      Array.from(table.rows).forEach(row => {
        while (row.cells.length < newCols) {
          const td = row.insertCell();
          td.textContent = 'Celda';
          td.addEventListener('dragover', ev => ev.preventDefault());
          td.addEventListener('drop', handleDrop);
        }
        while (row.cells.length > newCols) {
          row.deleteCell(row.cells.length - 1);
        }
      });
      cols = newCols;
    }
    const addRows = parseInt(prompt('Añadir filas', '0'), 10);
    if (addRows && addRows > 0) {
      for (let r = 0; r < addRows; r++) {
        const row = table.insertRow();
        for (let c = 0; c < cols; c++) {
          const td = row.insertCell();
          td.textContent = 'Celda';
          td.addEventListener('dragover', ev => ev.preventDefault());
          td.addEventListener('drop', handleDrop);
        }
      }
    }
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
    addDelete(el);
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

  function addDelete(el) {
    const del = document.createElement('div');
    del.className = 'delete-handle';
    del.textContent = '✖';
    del.addEventListener('click', e => {
      e.stopPropagation();
      el.remove();
    });
    el.appendChild(del);
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
        addDelete(el);
      } else if (item.type === 'image') {
        el = createBaseElement('image');
        el.innerHTML = item.html;
        addDelete(el);
      } else if (item.type === 'table') {
        el = createBaseElement('table');
        el.innerHTML = item.html;
        addDelete(el);
        const cfg = document.createElement('div');
        cfg.className = 'config-btn';
        cfg.textContent = '⚙';
        cfg.addEventListener('click', () => configureTable(el));
        el.appendChild(cfg);
        el.querySelectorAll('td').forEach(td => {
          td.addEventListener('dragover', ev => ev.preventDefault());
          td.addEventListener('drop', handleDrop);
        });
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
