//cuman claude dan tuhan yang tahu ~~~ huhuhu


// Data
let tasks = JSON.parse(localStorage.getItem('schoolTasks')) || [];
let currentFilter = 'all';
let currentTimeFilter = 'all';
let currentEditingTaskId = null;
let confirmCallback = null;
let lastResetDate = localStorage.getItem('lastResetDate') || getTodayDate();

// === UTILITY FUNCTIONS ===

function getTodayDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

function checkAndResetDaily() {
    const today = getTodayDate();
    if (lastResetDate !== today) {
        // Reset semua tugas yang sudah completed menjadi incomplete
        tasks.forEach(task => {
            if (task.completed) {
                task.completed = false;
            }
        });
        lastResetDate = today;
        localStorage.setItem('lastResetDate',
            today);
        saveTasks();
        console.log('Progress direset untuk hari baru:',
            today);
    }
}

function resetProgress() {
    if (confirm('Apakah Anda yakin ingin mereset semua progress tugas yang sudah selesai?')) {
        tasks.forEach(task => {
            if (task.completed) {
                task.completed = false;
            }
        });
        lastResetDate = getTodayDate();
        localStorage.setItem('lastResetDate',
            lastResetDate);
        saveTasks();
        displayTasks();
        alert('Progress berhasil direset!');
    }
}

// === CORE FUNCTIONS ===

function saveTasks() {
    localStorage.setItem('schoolTasks',
        JSON.stringify(tasks));
}

function filterTasks(filter) {
    currentFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    displayTasks();
}

function filterByTime(timeFilter) {
    currentTimeFilter = timeFilter;
    document.querySelectorAll('.time-filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    displayTasks();
}

function getFilteredTasksByTime(tasksList) {
    const today = new Date();
    today.setHours(0,
        0,
        0,
        0);

    if (currentTimeFilter === 'today') {
        // Filter tugas dengan deadline hari ini
        return tasksList.filter(task => {
            const deadline = new Date(task.deadline);
            deadline.setHours(0, 0, 0, 0);
            return deadline.getTime() === today.getTime();
        });
    } else if (currentTimeFilter === 'thisMonth') {
        // Filter tugas dengan deadline bulan ini
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        return tasksList.filter(task => {
            const deadline = new Date(task.deadline);
            return deadline.getMonth() === currentMonth && deadline.getFullYear() === currentYear;
        });
    }
    return tasksList; // 'all'
}

function displayTasks() {
    const tasksList = document.getElementById('tasksList');

    let filteredTasks = tasks;

    // Filter berdasarkan status (completed/incomplete/all)
    if (currentFilter === 'incomplete') {
        filteredTasks = tasks.filter(task => !task.completed);
    } else if (currentFilter === 'completed') {
        filteredTasks = tasks.filter(task => task.completed);
    }

    // Filter berdasarkan waktu (today/thisMonth/all)
    filteredTasks = getFilteredTasksByTime(filteredTasks);

    // Update progress bar dan counter
    updateProgress();

    if (filteredTasks.length === 0) {
        let emptyMessage = 'Belum ada tugas. Tambahkan tugas pertamamu!';
        if (currentTimeFilter === 'today') {
            emptyMessage = currentFilter === 'completed'
            ? 'Tidak ada tugas yang selesai hari ini.': 'Tidak ada tugas untuk hari ini.';
        } else if (currentTimeFilter === 'thisMonth') {
            emptyMessage = currentFilter === 'completed'
            ? 'Tidak ada tugas yang selesai bulan ini.': 'Tidak ada tugas untuk bulan ini.';
        } else if (currentFilter === 'incomplete') {
            emptyMessage = 'Tidak ada tugas yang belum selesai. Hebat! 🎉';
        } else if (currentFilter === 'completed') {
            emptyMessage = 'Belum ada tugas yang selesai. Ayo semangat! 💪';
        }

        tasksList.innerHTML = `
        <div class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 6.878V6a2.25 2.25 0 0 1 2.25-2.25h7.5A2.25 2.25 0 0 1 18 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 0 0 4.5 9v.878m13.5-3A2.25 2.25 0 0 1 19.5 9v.878m0 0a2.246 2.246 0 0 0-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0 1 21 12v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6c0-.98.626-1.813 1.5-2.122" />
        </svg>

        <p>${emptyMessage}</p>
        </div>
        `;
        return;
    }

    const sortedTasks = [...filteredTasks].sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

    tasksList.innerHTML = sortedTasks.map(task => {
        const deadlineDate = new Date(task.deadline);
        const today = new Date();
        const diffDays = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));

        let deadlineText = deadlineDate.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        let urgentClass = '';
        if (diffDays < 0) {
            deadlineText += ' (Terlambat!)';
            urgentClass = 'urgent';
        } else if (diffDays === 0) {
            deadlineText += ' (Hari ini!)';
            urgentClass = 'urgent';
        } else if (diffDays === 1) {
            deadlineText += ' (Besok!)';
            urgentClass = 'urgent';
        } else if (diffDays <= 3) {
            deadlineText += ` (${diffDays} hari lagi)`;
        }

        return `
        <div class="task-card ${task.completed ? 'completed': ''}">
        <div class="task-header">
        <div class="task-name">${task.name}</div>
        <span class="task-subject">${task.subject}</span>
        </div>
        <div class="task-deadline ${urgentClass}">
        📅 ${deadlineText}
        </div>
        <div class="task-buttons">
        <button class="detail-btn" onclick="showDetail('${task.id}')">Detail</button>
        <button class="complete-btn" onclick="toggleTask('${task.id}')">${task.completed ? 'Batal': 'Selesai'}</button>
        <button class="delete-btn" onclick="deleteTask('${task.id}')">Hapus</button>
        </div>
        </div>
        `;
    }).join('');
}

// === PROGRESS BAR & COUNTER ===

function updateProgress() {
    // Dapatkan tugas yang sudah difilter berdasarkan waktu
    let relevantTasks = getFilteredTasksByTime(tasks);

    const totalTasks = relevantTasks.length;
    const completedTasks = relevantTasks.filter(task => task.completed).length;
    const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100): 0;

    document.getElementById('totalCount').textContent = totalTasks;
    document.getElementById('completedCount').textContent = completedTasks;
    document.getElementById('progressPercentage').textContent = percentage + '%';
    document.getElementById('progressBar').style.width = percentage + '%';

    // Update info text berdasarkan filter waktu
    const resetInfo = document.getElementById('resetInfo');
    if (currentTimeFilter === 'today') {
        resetInfo.textContent = '📅 Menampilkan progress hari ini';
    } else if (currentTimeFilter === 'thisMonth') {
        const monthName = new Date().toLocaleDateString('id-ID', {
            month: 'long', year: 'numeric'
        });
        resetInfo.textContent = `📆 Menampilkan progress ${monthName}`;
    } else {
        resetInfo.textContent = '🔄 Progress direset otomatis setiap hari';
    }
}

// === EXPORT & IMPORT ===

function exportTasks() {
    if (tasks.length === 0) {
        alert('Tidak ada tugas untuk diekspor!');
        return;
    }

    const dataStr = JSON.stringify(tasks, null, 2);
    const blob = new Blob([dataStr], {
        type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    link.download = `tugasku-backup-${dateStr}.json`;
    link.href = url;
    link.click();

    URL.revokeObjectURL(url);
}

function importTasks(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedTasks = JSON.parse(e.target.result);

            if (!Array.isArray(importedTasks)) {
                alert('Format file tidak valid!');
                return;
            }

            showConfirm(
                `Apakah Anda yakin ingin mengimpor ${importedTasks.length} tugas? Data yang ada sekarang akan ditimpa.`,
                function() {
                    tasks = importedTasks;
                    saveTasks();
                    displayTasks();
                    alert(`Berhasil mengimpor ${importedTasks.length} tugas!`);
                }
            );
        } catch (error) {
            alert('Gagal membaca file. Pastikan file adalah backup TugasKu yang valid.');
        }
    };
    reader.readAsText(file);

    // Reset input agar bisa import file yang sama lagi
    event.target.value = '';
}

// === MODAL FUNCTIONS ===

function showDetail(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    currentEditingTaskId = id;

    const deadlineDate = new Date(task.deadline);
    const deadlineText = deadlineDate.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    document.getElementById('modalTitle').textContent = task.name;
    document.getElementById('modalSubject').textContent = task.subject;
    document.getElementById('modalDeadline').textContent = deadlineText;
    document.getElementById('modalStatus').textContent = task.completed ? '✅ Selesai': '⏳ Belum Selesai';
    document.getElementById('modalDescription').textContent = task.description || 'Tidak ada deskripsi';

    const notesSection = document.getElementById('notesSection');
    if (task.notes && task.notes.trim() !== '') {
        document.getElementById('modalNotes').textContent = task.notes;
        notesSection.style.display = 'block';
    } else {
        notesSection.style.display = 'none';
    }

    document.getElementById('detailView').style.display = 'block';
    document.getElementById('editView').style.display = 'none';
    document.getElementById('taskModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('taskModal').style.display = 'none';
    document.getElementById('detailView').style.display = 'block';
    document.getElementById('editView').style.display = 'none';
}

function showEditForm() {
    const task = tasks.find(t => t.id === currentEditingTaskId);
    if (!task) return;

    document.getElementById('editTaskName').value = task.name;
    document.getElementById('editTaskSubject').value = task.subject;
    document.getElementById('editTaskDeadline').value = task.deadline;
    document.getElementById('editTaskDescription').value = task.description || '';
    document.getElementById('editTaskNotes').value = task.notes || '';

    document.getElementById('detailView').style.display = 'none';
    document.getElementById('editView').style.display = 'block';
}

function cancelEdit() {
    document.getElementById('detailView').style.display = 'block';
    document.getElementById('editView').style.display = 'none';
}

// === CONFIRM MODAL ===

function showConfirm(message, onConfirm) {
    document.getElementById('confirmMessage').textContent = message;
    document.getElementById('confirmModal').style.display = 'block';
    confirmCallback = onConfirm;
}

document.getElementById('confirmYes').addEventListener('click', function() {
    document.getElementById('confirmModal').style.display = 'none';
    if (confirmCallback) {
        confirmCallback();
        confirmCallback = null;
    }
});

document.getElementById('confirmNo').addEventListener('click', function() {
    document.getElementById('confirmModal').style.display = 'none';
    confirmCallback = null;
});

// === TASK ACTIONS ===

function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        if (!task.completed) {
            showConfirm(
                `Apakah Anda yakin sudah menyelesaikan tugas "${task.name}"?`,
                function() {
                    task.completed = true;
                    saveTasks();
                    displayTasks();
                }
            );
        } else {
            task.completed = false;
            saveTasks();
            displayTasks();
        }
    }
}

function deleteTask(id) {
    const task = tasks.find(t => t.id === id);
    showConfirm(
        `Apakah Anda yakin ingin menghapus tugas "${task.name}"?`,
        function() {
            tasks = tasks.filter(t => t.id !== id);
            saveTasks();
            displayTasks();
        }
    );
}

// === FORM SUBMISSIONS ===

document.getElementById('taskForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const newTask = {
        id: Date.now().toString(),
        name: document.getElementById('taskName').value,
        subject: document.getElementById('taskSubject').value,
        deadline: document.getElementById('taskDeadline').value,
        description: document.getElementById('taskDescription').value,
        notes: document.getElementById('taskNotes').value,
        completed: false
    };

    tasks.push(newTask);
    saveTasks();
    displayTasks();
    this.reset();
});

document.getElementById('editTaskForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const task = tasks.find(t => t.id === currentEditingTaskId);
    if (!task) return;

    task.name = document.getElementById('editTaskName').value;
    task.subject = document.getElementById('editTaskSubject').value;
    task.deadline = document.getElementById('editTaskDeadline').value;
    task.description = document.getElementById('editTaskDescription').value;
    task.notes = document.getElementById('editTaskNotes').value;

    saveTasks();
    displayTasks();
    closeModal();
});

// === NOTIFICATION ===

function requestNotificationPermission() {
    if (!("Notification" in window)) {
        alert("Browser Anda tidak mendukung notifikasi desktop");
        return;
    }

    if (Notification.permission === "granted") {
        checkUpcomingTasks();
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(function (permission) {
            if (permission === "granted") {
                checkUpcomingTasks();
            }
        });
    } else {
        alert("Izin notifikasi telah ditolak. Silakan aktifkan dari pengaturan browser.");
    }
}

function checkUpcomingTasks() {
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const urgentTasks = tasks.filter(task => {
        if (task.completed) return false;
        const deadline = new Date(task.deadline);
        deadline.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 1;
    });

    try {
        if (urgentTasks.length > 0) {
            urgentTasks.forEach(task => {
                const deadline = new Date(task.deadline);
                const diffDays = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
                let notifBody = diffDays === 0 ? `Deadline HARI INI! - ${task.subject}`: `Deadline BESOK! - ${task.subject}`;
                new Notification(task.name, {
                    body: notifBody, tag: task.id
                });
            });
        } else {
            new Notification('TugasKu', {
                body: 'Tidak ada tugas mendesak saat ini. Tetap semangat!',
                tag: 'no-urgent-tasks'
            });
        }
    } catch (error) {
        console.error('Notification error:', error);
    }
}

// === INITIALIZATION ===

// Check dan reset progress otomatis setiap kali halaman dibuka
checkAndResetDaily();

const today = new Date().toISOString().split('T')[0];
document.getElementById('taskDeadline').setAttribute('min', today);
document.getElementById('editTaskDeadline').setAttribute('min', today);

displayTasks();

window.addEventListener('click', function(event) {
    const detailModal = document.getElementById('taskModal');
    const confirmModal = document.getElementById('confirmModal');
    if (event.target === detailModal) {
        closeModal();
    }
    if (event.target === confirmModal) {
        confirmModal.style.display = 'none';
        confirmCallback = null;
    }
});