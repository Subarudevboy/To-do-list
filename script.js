class TodoApp {
    constructor() {
        this.tasks = this.loadTasks();
        this.currentFilter = 'all';
        this.taskIdCounter = this.getNextId();
        
        this.initializeElements();
        this.bindEvents();
        this.initializeTheme();
        this.render();
    }

    initializeElements() {
        // Input elements
        this.taskInput = document.getElementById('taskInput');
        this.addBtn = document.getElementById('addBtn');
        
        // Display elements
        this.tasksList = document.getElementById('tasksList');
        this.emptyState = document.getElementById('emptyState');
        
        // Stats elements
        this.totalTasksEl = document.getElementById('totalTasks');
        this.completedTasksEl = document.getElementById('completedTasks');
        this.activeTasksEl = document.getElementById('activeTasks');
        
        // Filter elements
        this.filterBtns = document.querySelectorAll('.filter-btn');
        this.clearCompletedBtn = document.getElementById('clearCompleted');
        
        // Theme toggle
        this.themeToggle = document.getElementById('themeToggle');
    }

    bindEvents() {
        // Add task events
        this.addBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });
        
        // Filter events
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });
        
        // Clear completed tasks
        this.clearCompletedBtn.addEventListener('click', () => this.clearCompleted());
        
        // Theme toggle
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // Task list events (using event delegation)
        this.tasksList.addEventListener('click', (e) => this.handleTaskClick(e));
    }

    addTask() {
        const text = this.taskInput.value.trim();
        if (!text) return;

        const task = {
            id: this.taskIdCounter++,
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.unshift(task);
        this.taskInput.value = '';
        this.saveTasks();
        this.render();
        
        // Add subtle animation feedback
        this.taskInput.style.transform = 'scale(0.98)';
        setTimeout(() => {
            this.taskInput.style.transform = 'scale(1)';
        }, 100);
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.render();
        }
    }

    deleteTask(id) {
        const taskElement = document.querySelector(`[data-task-id="${id}"]`);
        if (taskElement) {
            taskElement.classList.add('removing');
            setTimeout(() => {
                this.tasks = this.tasks.filter(t => t.id !== id);
                this.saveTasks();
                this.render();
            }, 300);
        }
    }

    clearCompleted() {
        const completedTasks = document.querySelectorAll('.task-item.completed');
        completedTasks.forEach((task, index) => {
            setTimeout(() => {
                task.classList.add('removing');
            }, index * 50);
        });
        
        setTimeout(() => {
            this.tasks = this.tasks.filter(t => !t.completed);
            this.saveTasks();
            this.render();
        }, completedTasks.length * 50 + 300);
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active filter button
        this.filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        
        this.render();
    }

    getFilteredTasks() {
        switch (this.currentFilter) {
            case 'active':
                return this.tasks.filter(t => !t.completed);
            case 'completed':
                return this.tasks.filter(t => t.completed);
            default:
                return this.tasks;
        }
    }

    handleTaskClick(e) {
        const taskItem = e.target.closest('.task-item');
        if (!taskItem) return;
        
        const taskId = parseInt(taskItem.dataset.taskId);
        
        if (e.target.classList.contains('task-checkbox')) {
            this.toggleTask(taskId);
        } else if (e.target.classList.contains('delete-btn')) {
            this.deleteTask(taskId);
        }
    }

    render() {
        this.renderTasks();
        this.renderStats();
        this.renderEmptyState();
    }

    renderTasks() {
        const filteredTasks = this.getFilteredTasks();
        
        this.tasksList.innerHTML = filteredTasks.map(task => `
            <li class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
                <div class="task-checkbox ${task.completed ? 'checked' : ''}"></div>
                <span class="task-text">${this.escapeHtml(task.text)}</span>
                <div class="task-actions">
                    <button class="delete-btn" title="Delete task">×</button>
                </div>
            </li>
        `).join('');
    }

    renderStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const active = total - completed;
        
        this.totalTasksEl.textContent = total;
        this.completedTasksEl.textContent = completed;
        this.activeTasksEl.textContent = active;
        
        // Update clear completed button visibility
        this.clearCompletedBtn.style.opacity = completed > 0 ? '1' : '0.5';
        this.clearCompletedBtn.disabled = completed === 0;
    }

    renderEmptyState() {
        const filteredTasks = this.getFilteredTasks();
        const isEmpty = filteredTasks.length === 0;
        
        this.emptyState.classList.toggle('hidden', !isEmpty);
        
        if (isEmpty) {
            let message = '';
            switch (this.currentFilter) {
                case 'active':
                    message = this.tasks.length > 0 ? 
                        'All tasks completed! 🎉' : 
                        'No active tasks';
                    break;
                case 'completed':
                    message = 'No completed tasks yet';
                    break;
                default:
                    message = 'No tasks yet';
            }
            
            this.emptyState.querySelector('h3').textContent = message;
        }
    }

    // Theme Management
    initializeTheme() {
        const savedTheme = localStorage.getItem('todoapp-theme') || 'light';
        this.setTheme(savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('todoapp-theme', theme);
        
        // Update theme toggle icon
        const themeIcon = this.themeToggle.querySelector('.theme-icon');
        themeIcon.textContent = theme === 'light' ? '🌙' : '☀️';
    }

    // Data Persistence
    saveTasks() {
        localStorage.setItem('todoapp-tasks', JSON.stringify(this.tasks));
        localStorage.setItem('todoapp-counter', this.taskIdCounter.toString());
    }

    loadTasks() {
        const saved = localStorage.getItem('todoapp-tasks');
        return saved ? JSON.parse(saved) : [];
    }

    getNextId() {
        const saved = localStorage.getItem('todoapp-counter');
        return saved ? parseInt(saved) : 1;
    }

    // Utility Methods
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
});

// Add some keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Focus input with Ctrl/Cmd + /
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        document.getElementById('taskInput').focus();
    }
    
    // Clear completed with Ctrl/Cmd + Shift + C
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        const clearBtn = document.getElementById('clearCompleted');
        if (!clearBtn.disabled) {
            clearBtn.click();
        }
    }
});