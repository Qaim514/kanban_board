const draggables = document.querySelectorAll('.draggable');
const columns = document.querySelectorAll('.kanban-column');

// Initialize drag events
draggables.forEach(draggable => {
  draggable.addEventListener('dragstart', () => {
    draggable.classList.add('dragging');
  });

  draggable.addEventListener('dragend', () => {
    draggable.classList.remove('dragging');
  });

  const select = draggable.querySelector('select');
  if (select) {
    select.addEventListener('mousedown', (e) => e.stopPropagation());

    select.addEventListener('change', (e) => {
      const targetId = e.target.value;
      const targetColumn = document.getElementById(targetId);
      if (targetColumn) {
        targetColumn.appendChild(draggable);
      }
    });
  }
});

// Initialize drop zones
columns.forEach(column => {
  column.addEventListener('dragover', (e) => {
    e.preventDefault();
    const afterElement = getDragAfterElement(column, e.clientY);
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
  });
});

// Helper for sorting
function getDragAfterElement(column, y) {
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
