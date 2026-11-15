/* PRAISE ABIDOYE — shared site interactions */

document.addEventListener("DOMContentLoaded", () => {
  // Keep the copyright year current.
  document.querySelectorAll(".current-year").forEach((element) => {
    element.textContent = new Date().getFullYear();
  });

  // Mobile navigation.
  const menuToggle = document.querySelector(".menu-toggle");
  const navMenu = document.querySelector(".nav-menu");

  if (menuToggle && navMenu) {
    menuToggle.addEventListener("click", () => {
      const isOpen = navMenu.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
      menuToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
    });

    navMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navMenu.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Open navigation");
      });
    });
  }

  initializePlanner();
  initializeContactForm();
});


// ===============================================
// ACADEMIC PLANNER
// ===============================================

function initializePlanner() {
  const taskForm = document.getElementById("task-form");
  const taskList = document.getElementById("task-list");

  // The planner code runs only on planner.html.
  if (!taskForm || !taskList) return;

  const titleInput = document.getElementById("task-title");
  const dateInput = document.getElementById("task-date");
  const priorityInput = document.getElementById("task-priority");
  const filterButtons = document.querySelectorAll(".filter-button");

  const STORAGE_KEY = "praiseAcademicTasks";
  let tasks = loadTasks();
  let currentFilter = "all";

  function loadTasks() {
    try {
      const savedTasks = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return Array.isArray(savedTasks) ? savedTasks : [];
    } catch (error) {
      console.error("Could not read saved tasks:", error);
      return [];
    }
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
      alert("Your browser could not save the tasks. Check your storage settings.");
      console.error("Could not save tasks:", error);
    }
  }

  function renderTasks() {
    taskList.innerHTML = "";

    const visibleTasks = tasks.filter((task) => {
      if (currentFilter === "active") return !task.completed;
      if (currentFilter === "completed") return task.completed;
      return true;
    });

    if (visibleTasks.length === 0) {
      const emptyMessage = document.createElement("p");
      emptyMessage.className = "empty-state";
      emptyMessage.textContent = currentFilter === "all"
        ? "No tasks yet. Add your first academic task above."
        : `There are no ${currentFilter} tasks.`;
      taskList.appendChild(emptyMessage);
    }

    visibleTasks.forEach((task) => {
      const item = document.createElement("article");
      item.className = `task-item${task.completed ? " is-complete" : ""}`;

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "task-check";
      checkbox.checked = task.completed;
      checkbox.setAttribute("aria-label", `Mark ${task.title} as ${task.completed ? "pending" : "completed"}`);
      checkbox.addEventListener("change", () => toggleTask(task.id));

      const content = document.createElement("div");
      content.className = "task-content";

      const taskName = document.createElement("p");
      taskName.className = "task-name";
      taskName.textContent = task.title;

      const details = document.createElement("div");
      details.className = "task-details";

      const priority = document.createElement("span");
      const priorityClass = task.priority.toLowerCase();
      priority.className = `priority priority-${priorityClass}`;
      priority.textContent = `${task.priority} priority`;
      details.appendChild(priority);

      if (task.dueDate) {
        const dueDate = document.createElement("span");
        dueDate.textContent = `Due: ${formatDate(task.dueDate)}`;
        details.appendChild(dueDate);
      }

      content.append(taskName, details);

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "delete-task";
      deleteButton.textContent = "Delete";
      deleteButton.setAttribute("aria-label", `Delete task: ${task.title}`);
      deleteButton.addEventListener("click", () => deleteTask(task.id));

      item.append(checkbox, content, deleteButton);
      taskList.appendChild(item);
    });

    updateProgress();
  }

  function formatDate(dateString) {
    const date = new Date(`${dateString}T00:00:00`);
    return date.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  }

  function addTask(title, dueDate, priority) {
    const newTask = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title,
      dueDate,
      priority,
      completed: false
    };

    tasks.unshift(newTask);
    saveTasks();
    renderTasks();
  }

  function toggleTask(taskId) {
    tasks = tasks.map((task) => task.id === taskId
      ? { ...task, completed: !task.completed }
      : task
    );
    saveTasks();
    renderTasks();
  }

  function deleteTask(taskId) {
    const taskToDelete = tasks.find((task) => task.id === taskId);
    if (!taskToDelete) return;

    const confirmed = window.confirm(`Delete "${taskToDelete.title}"?`);
    if (!confirmed) return;

    tasks = tasks.filter((task) => task.id !== taskId);
    saveTasks();
    renderTasks();
  }

  function updateProgress() {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.completed).length;
    const pending = total - completed;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

    document.getElementById("task-count").textContent =
      `${total} ${total === 1 ? "task" : "tasks"}`;
    document.getElementById("completed-count").textContent = completed;
    document.getElementById("pending-count").textContent = pending;
    document.getElementById("progress-percent").textContent = `${percentage}%`;
    document.getElementById("progress-bar").style.width = `${percentage}%`;
  }

  taskForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const title = titleInput.value.trim();
    const dueDate = dateInput.value;
    const priority = priorityInput.value;

    if (!title) {
      titleInput.focus();
      titleInput.setCustomValidity("Please enter a task description.");
      titleInput.reportValidity();
      titleInput.setCustomValidity("");
      return;
    }

    addTask(title, dueDate, priority);
    taskForm.reset();
    titleInput.focus();
  });

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      currentFilter = button.dataset.filter;

      filterButtons.forEach((filterButton) => {
        const isActive = filterButton === button;
        filterButton.classList.toggle("active", isActive);
        filterButton.setAttribute("aria-pressed", String(isActive));
      });

      renderTasks();
    });
  });

  renderTasks();
}


// ===============================================
// CONTACT FORM VALIDATION
// ===============================================

function initializeContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;

  const fields = {
    name: document.getElementById("contact-name"),
    email: document.getElementById("contact-email"),
    phone: document.getElementById("contact-phone"),
    message: document.getElementById("contact-message")
  };

  const status = document.getElementById("form-status");

  const patterns = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^[0-9]+$/
  };

  function showError(fieldName, message) {
    const field = fields[fieldName];
    const error = document.getElementById(`${fieldName}-error`);

    field.classList.toggle("input-error", Boolean(message));
    field.setAttribute("aria-invalid", String(Boolean(message)));
    error.textContent = message;
  }

  function validateForm() {
    let isValid = true;

    Object.entries(fields).forEach(([name, field]) => {
      if (!field.value.trim()) {
        showError(name, "This field is required.");
        isValid = false;
      } else {
        showError(name, "");
      }
    });

    if (fields.email.value.trim() && !patterns.email.test(fields.email.value.trim())) {
      showError("email", "Enter a valid email address.");
      isValid = false;
    }

    if (fields.phone.value.trim() && !patterns.phone.test(fields.phone.value.trim())) {
      showError("phone", "Phone number must contain digits only.");
      isValid = false;
    }

    return isValid;
  }

  // Clear a field's error as the user corrects it.
  Object.entries(fields).forEach(([name, field]) => {
    field.addEventListener("input", () => {
      if (field.value.trim()) showError(name, "");
      status.textContent = "";
      status.className = "form-status";
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    status.textContent = "";
    status.className = "form-status";

    if (!validateForm()) {
      status.textContent = "Please correct the highlighted fields.";
      status.classList.add("error");
      const firstInvalid = form.querySelector(".input-error");
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    status.textContent = "All fields are valid. Your message passed the form checks.";
    status.classList.add("success");
    form.reset();

    Object.keys(fields).forEach((name) => showError(name, ""));
  });
}
