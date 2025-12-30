document.addEventListener('DOMContentLoaded', () => {
  loadData();
});

const columns = document.querySelectorAll('.kanban-column');
const saveTaskBtn = document.getElementById('saveTaskBtn');
const addTaskBtn = document.querySelector('button[data-bs-target="#exampleModal"]');

let cardBeingEdited = null;

if (addTaskBtn) {
  addTaskBtn.addEventListener('click', () => {
    cardBeingEdited = null;
    document.getElementById('addTaskForm').reset();
    document.getElementById('exampleModalLabel').innerText = 'Add New Task';
    document.getElementById('saveTaskBtn').innerText = 'Save Task';
  });
}

if (saveTaskBtn) {
  saveTaskBtn.addEventListener('click', () => {
    const title = document.getElementById('taskTitle').value;
    const desc = document.getElementById('taskDesc').value;
    const assignedTo = document.getElementById('taskAssigned').value;
    const status = document.getElementById('taskStatus').value;

    if (title === "") {
      alert('Please enter a Title');
      return;
    }

    if (cardBeingEdited) {
      updateCard(cardBeingEdited, title, desc, assignedTo, status);
    } else {
      createCard(title, desc, assignedTo, status);
    }

    saveData();
    const modal = bootstrap.Modal.getInstance(document.getElementById('exampleModal'));
    modal.hide();
    document.getElementById('addTaskForm').reset();
    cardBeingEdited = null;
  });
}

function createCard(title, desc, assigned, status) {
  const newCard = document.createElement('div');
  newCard.className = 'card m-2 draggable';
  newCard.draggable = true;

  newCard.innerHTML = `
        <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <h6 class="card-title mb-0 fw-bold">${title}</h6>
                <div class="d-flex align-items-center gap-2">
                <select class="form-select form-select-sm w-auto py-0 border-secondary-subtle select-compact">
                <option value="inprogress" ${status === 'inprogress' ? 'selected' : ''}>Pending</option>
                <option value="done" ${status === 'done' ? 'selected' : ''}>Done</option>
                <option value="qa" ${status === 'qa' ? 'selected' : ''}>QA</option>
                <option value="deploy" ${status === 'deploy' ? 'selected' : ''}>Deploy</option>
                </select>
                <button class="btn btn-sm btn-link text-decoration-none p-0 edit-btn">Edit</button>
                </div>
            </div>
            <p class="card-text small text-secondary mb-3 description-text">${desc}</p>
            <div class="d-flex justify-content-between">
                <small class="text-muted">Assigned to: </small>
                <span><h6 class="assigned-text mb-0">${assigned}</h6></span>
            </div>
        </div>
    `;

  addDragEvents(newCard);
  addEditEvent(newCard);

  const targetColumn = document.getElementById(status);
  if (targetColumn) {
    targetColumn.appendChild(newCard);
  }
}

function updateCard(card, title, desc, assigned, status) {

  card.querySelector('.card-title').innerText = title;
  card.querySelector('.description-text').innerText = desc;
  card.querySelector('.assigned-text').innerText = assigned;
  card.querySelector('select').value = status;

  const currentColumnId = card.parentElement.id;
  if (currentColumnId !== status) {
    const targetColumn = document.getElementById(status);
    if (targetColumn) {
      targetColumn.appendChild(card);
    }
  }
}

function addEditEvent(card) {
  const editBtn = card.querySelector('.edit-btn');
  editBtn.addEventListener('click', (e) => {
    e.stopPropagation();

    cardBeingEdited = card;

    document.getElementById('taskTitle').value = card.querySelector('.card-title').innerText;
    document.getElementById('taskDesc').value = card.querySelector('.description-text').innerText;
    document.getElementById('taskAssigned').value = card.querySelector('.assigned-text').innerText;
    document.getElementById('taskStatus').value = card.closest('.kanban-column').id;

    document.getElementById('exampleModalLabel').innerText = 'Edit Task';
    document.getElementById('saveTaskBtn').innerText = 'Update Task';

    const modal = new bootstrap.Modal(document.getElementById('exampleModal'));
    modal.show();
  });
}

function addDragEvents(card) {

  card.addEventListener('dragstart', () => {
    card.classList.add('dragging');
  });

  card.addEventListener('dragend', () => {
    card.classList.remove('dragging');
    saveData();
  });

  const select = card.querySelector('select');
  if (select) {
    select.addEventListener('mousedown', (e) => e.stopPropagation());

    select.addEventListener('change', (e) => {
      const targetId = e.target.value;
      const targetColumn = document.getElementById(targetId);
      if (targetColumn) {
        targetColumn.appendChild(card);
        saveData(); // Save new column
      }
    });
  }
}

columns.forEach(column => {
  column.addEventListener('dragover', (e) => {
    e.preventDefault();
    const afterElement = getAfterElement(column, e.clientY);
    const draggable = document.querySelector('.dragging');

    if (afterElement == null) {
      column.appendChild(draggable);
    } else {
      column.insertBefore(draggable, afterElement);
    }
  });

  column.addEventListener('drop', () => {
    const draggable = document.querySelector('.dragging');
    if (draggable) {
      const select = draggable.querySelector('select');
      if (select) select.value = column.id;
    }
    saveData();
  });
});

function getAfterElement(column, y) {
  const draggableElements = [...column.querySelectorAll('.draggable:not(.dragging)')];

  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}



function saveData() {
  const data = [];
  const colIds = ['inprogress', 'done', 'qa', 'deploy'];

  colIds.forEach(colId => {
    const column = document.getElementById(colId);
    const cards = column.querySelectorAll('.card.draggable');

    cards.forEach(card => {
      data.push({
        title: card.getElementsByClassName('.card-title').innerText,
        desc: card.getElementsByClassName('.description-text').innerText,
        assigned: card.getElementsByClassName('.assigned-text').innerText,
        status: colId
      });
    });
  });

  localStorage.setItem('kanbanData', JSON.stringify(data));
}

function loadData() {
  const data = localStorage.getItem('kanbanData');
  if (data) {
    const tasks = JSON.parse(data);

    document.querySelectorAll('.kanban-column').forEach(col => {
      const draggables = col.querySelectorAll('.draggable');
      draggables.forEach(d => d.remove());
    });

    tasks.forEach(task => {
      createCard(task.title, task.desc, task.assigned, task.status);
    });
  }
}
