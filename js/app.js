document.addEventListener('DOMContentLoaded', () => {
  const page = document.getElementById('page');
  const addTextBtn = document.getElementById('addText');
  const addImageBtn = document.getElementById('addImage');
  const addTableBtn = document.getElementById('addTable');
  const saveBtn = document.getElementById('saveJson');
  const loadBtn = document.getElementById('loadJson');
  const dataContainer = document.getElementById('dataFields');
  const tabs = document.querySelectorAll('.tabs li');
  const modal = document.getElementById('modal');
  const modalCols = document.getElementById('modalCols');
  const modalRows = document.getElementById('modalRows');
  const modalOk = document.getElementById('modalOk');
  const modalCancel = document.getElementById('modalCancel');
  let modalCallback = null;

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

  modalOk.addEventListener('click', () => {
    modal.classList.remove('active');
    if (modalCallback) {
      modalCallback(parseInt(modalCols.value, 10), parseInt(modalRows.value, 10));
      modalCallback = null;
    }
  });
  modalCancel.addEventListener('click', () => {
    modal.classList.remove('active');
    modalCallback = null;
  });

  function openModal(cols, rows, cb) {
    modalCols.value = cols;
    modalRows.value = rows;
    modalCallback = cb;
    modal.classList.add('active');
  }

  function handleDrop(e) {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        const img = createImageElement(URL.createObjectURL(file));
        img.style.left = e.offsetX + 'px';
        img.style.top = e.offsetY + 'px';
        page.appendChild(img);
        return;
      }
    }
    const data = e.dataTransfer.getData('text/plain');
    if (!data) return;
    if (data === '__image__') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.addEventListener('change', () => {
        const file = input.files[0];
        if (file) {
          const img = createImageElement(URL.createObjectURL(file));
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
        const img = createImageElement(URL.createObjectURL(file));
        page.appendChild(img);
      }
    });
    input.click();
  });

  addTableBtn.addEventListener('click', () => {
    openModal(2, 1, (cols, rows) => {
      if (!cols || cols < 1) cols = 1;
      if (!rows || rows < 1) rows = 1;
      const el = createTableElement(cols, rows);
      page.appendChild(el);
    });
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
    const span = document.createElement('div');
    span.textContent = content;
    span.contentEditable = true;
    span.style.width = '100%';
    span.style.height = '100%';
    el.appendChild(span);
    return el;
  }

  function createImageElement(src) {
    const wrapper = createBaseElement('image');
    wrapper.style.width = '200px';
    wrapper.style.height = '200px';
    const img = document.createElement('img');
    img.src = src;
    img.style.width = '100%';
    img.style.height = '100%';
    img.draggable = false;
    wrapper.appendChild(img);

    const cfg = document.createElement('div');
    cfg.className = 'config-btn';
    cfg.textContent = '⚙';
    cfg.addEventListener('click', () => configureImage(wrapper));
    wrapper.appendChild(cfg);
    return wrapper;
  }

  function createTableElement(cols, rows) {
    const el = createBaseElement('table');
    const table = document.createElement('table');
    table.border = '1';
    table.style.width = '100%';

    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    for (let i = 0; i < cols; i++) {
      const th = document.createElement('th');
      th.textContent = 'Col ' + (i + 1);
      headRow.appendChild(th);
    }
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    for (let r = 0; r < rows; r++) {
      const row = document.createElement('tr');
      for (let c = 0; c < cols; c++) {
        const td = document.createElement('td');
        td.textContent = '';
        td.addEventListener('dragover', ev => ev.preventDefault());
        td.addEventListener('drop', handleDrop);
        row.appendChild(td);
      }
      tbody.appendChild(row);
    }
    table.appendChild(tbody);
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
    const headerRow = table.tHead ? table.tHead.rows[0] : null;
    const currentCols = headerRow ? headerRow.cells.length : 1;
    openModal(currentCols, 0, (newCols, addRows) => {
      if (newCols && newCols !== currentCols) {
        // update header
        while (headerRow.cells.length < newCols) {
          const th = document.createElement('th');
          th.textContent = 'Col ' + (headerRow.cells.length + 1);
          headerRow.appendChild(th);
        }
        while (headerRow.cells.length > newCols) {
          headerRow.deleteCell(headerRow.cells.length - 1);
        }
        // update body rows
        Array.from(table.tBodies[0].rows).forEach(row => {
          while (row.cells.length < newCols) {
            const td = row.insertCell();
            td.textContent = '';
            td.addEventListener('dragover', ev => ev.preventDefault());
            td.addEventListener('drop', handleDrop);
          }
          while (row.cells.length > newCols) {
            row.deleteCell(row.cells.length - 1);
          }
        });
      }
      if (addRows && addRows > 0) {
        const cols = newCols || currentCols;
        for (let r = 0; r < addRows; r++) {
          const row = table.tBodies[0].insertRow();
          for (let c = 0; c < cols; c++) {
            const td = row.insertCell();
            td.textContent = '';
            td.addEventListener('dragover', ev => ev.preventDefault());
            td.addEventListener('drop', handleDrop);
          }
        }
      }
    });
  }

  function configureImage(wrapper) {
    const img = wrapper.querySelector('img');
    if (!img) return;
    const w = prompt('Ancho (px)', parseInt(img.style.width) || img.naturalWidth);
    if (w) {
      img.style.width = w + 'px';
      wrapper.style.width = w + 'px';
    }
    const h = prompt('Alto (px)', parseInt(img.style.height) || img.naturalHeight);
    if (h) {
      img.style.height = h + 'px';
      wrapper.style.height = h + 'px';
    }
    const op = prompt('Opacidad (0-1)', img.style.opacity || '1');
    if (op !== null) {
      img.style.opacity = op;
    }
  }

  function addImageConfig(el) {
    const existing = el.querySelector('.config-btn');
    if (existing) existing.remove();
    const cfg = document.createElement('div');
    cfg.className = 'config-btn';
    cfg.textContent = '⚙';
    cfg.addEventListener('click', () => configureImage(el));
    el.appendChild(cfg);
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
      const newW = startW + (e.clientX - startX);
      const newH = startH + (e.clientY - startY);
      el.style.width = newW + 'px';
      el.style.height = newH + 'px';
      if (el.dataset.type === 'image') {
        const img = el.querySelector('img');
        if (img) {
          img.style.width = newW + 'px';
          img.style.height = newH + 'px';
        }
      }
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
        el.querySelectorAll('.delete-handle').forEach(d => d.remove());
        addDelete(el);
        el.contentEditable = true;
      } else if (item.type === 'image') {
        el = createBaseElement('image');
        el.innerHTML = item.html;
        el.querySelectorAll('.delete-handle').forEach(d => d.remove());
        el.querySelectorAll('.config-btn').forEach(c => c.remove());
        addImageConfig(el);
        addDelete(el);
        const img = el.querySelector('img');
        if (img) {
          img.style.width = '100%';
          img.style.height = '100%';
          img.draggable = false;
        }
      } else if (item.type === 'table') {
        el = createBaseElement('table');
        el.innerHTML = item.html;
        addDelete(el);
        const cfg = document.createElement('div');
        cfg.className = 'config-btn';
        cfg.textContent = '⚙';
        cfg.addEventListener('click', () => configureTable(el));
        el.appendChild(cfg);
        const table = el.querySelector('table');
        if (table) table.style.width = '100%';
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
