document.addEventListener('DOMContentLoaded', () => {
  const folio = document.getElementById('folio');
  const addTextBtn = document.getElementById('addText');
  const addImageBtn = document.getElementById('addImage');
  const addTableBtn = document.getElementById('addTable');
  const dataFieldsContainer = document.getElementById('dataFields');
  const tabs = document.querySelectorAll('.tabs li');

  // Cambiar pestañas
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelector('.tabs li.active').classList.remove('active');
      document.querySelector('.tab-content.active').classList.remove('active');
      tab.classList.add('active');
      document.getElementById(tab.dataset.tab).classList.add('active');
    });
  });

  // Carga datos de ejemplo
  fetch('datosEjemplo.json')
    .then(res => res.json())
    .then(data => {
      fillDataFields(data);
    });

  function fillDataFields(data, prefix = '') {
    for (const key in data) {
      const value = data[key];
      if (typeof value === 'object') {
        fillDataFields(value, prefix + key + '.');
      } else {
        const div = document.createElement('div');
        div.textContent = prefix + key;
        div.draggable = true;
        div.addEventListener('dragstart', e => {
          e.dataTransfer.setData('text/plain', value);
        });
        dataFieldsContainer.appendChild(div);
      }
    }
  }

  addTextBtn.addEventListener('click', () => {
    const text = createDraggable('Texto');
    folio.appendChild(text);
  });

  addImageBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.addEventListener('change', () => {
      const file = input.files[0];
      if (file) {
        const img = createDraggable();
        const imageEl = document.createElement('img');
        imageEl.src = URL.createObjectURL(file);
        imageEl.style.maxWidth = '200px';
        img.appendChild(imageEl);
        folio.appendChild(img);
      }
    });
    input.click();
  });

  addTableBtn.addEventListener('click', () => {
    const table = createDraggable();
    table.innerHTML = '<table border="1"><tr><td>Celda</td><td>Celda</td></tr></table>';
    folio.appendChild(table);
  });

  function createDraggable(text = '') {
    const el = document.createElement('div');
    el.className = 'draggable';
    el.contentEditable = true;
    el.textContent = text;
    el.style.left = '50px';
    el.style.top = '50px';
    el.draggable = true;

    el.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', 'move');
      e.dataTransfer.setDragImage(new Image(), 0, 0);
      el.classList.add('dragging');
    });

    folio.addEventListener('dragover', e => {
      if (document.querySelector('.dragging')) {
        e.preventDefault();
      }
    });

    folio.addEventListener('drop', e => {
      const dragging = document.querySelector('.dragging');
      if (dragging) {
        e.preventDefault();
        dragging.style.left = e.offsetX + 'px';
        dragging.style.top = e.offsetY + 'px';
        dragging.classList.remove('dragging');
      }
    });

    el.addEventListener('dragend', () => {
      el.classList.remove('dragging');
    });
    return el;
  }
});
