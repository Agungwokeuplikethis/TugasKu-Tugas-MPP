        // Data
        let tasks = JSON.parse(localStorage.getItem('schoolTasks')) || [];
        let currentFilter = 'all';
        let currentEditingTaskId = null;
        let confirmCallback = null;

        // === CORE FUNCTIONS ===
        
        function saveTasks() {
            localStorage.setItem('schoolTasks', JSON.stringify(tasks));
        }

        function filterTasks(filter) {
            currentFilter = filter;
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');
            displayTasks();
        }

        function displayTasks() {
            const tasksList = document.getElementById('tasksList');
            
            let filteredTasks = tasks;
            if (currentFilter === 'incomplete') {
                filteredTasks = tasks.filter(task => !task.completed);
            } else if (currentFilter === 'completed') {
                filteredTasks = tasks.filter(task => task.completed);
            }
            
            if (filteredTasks.length === 0) {
                let emptyMessage = 'Belum ada tugas. Tambahkan tugas pertamamu!';
                if (currentFilter === 'incomplete') emptyMessage = 'Tidak ada tugas yang belum selesai. Hebat! 🎉';
                else if (currentFilter === 'completed') emptyMessage = 'Belum ada tugas yang selesai. Ayo semangat! 💪';
                
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
                    <div class="task-card ${task.completed ? 'completed' : ''}">
                        <div class="task-header">
                            <div class="task-name">${task.name}</div>
                            <span class="task-subject">${task.subject}</span>
                        </div>
                        <div class="task-deadline ${urgentClass}">
                            📅 ${deadlineText}
                        </div>
                        <div class="task-buttons">
                            <button class="detail-btn" onclick="showDetail('${task.id}')">Detail</button>
                            <button class="complete-btn" onclick="toggleTask('${task.id}')">${task.completed ? 'Batal' : 'Selesai'}</button>
                            <button class="delete-btn" onclick="deleteTask('${task.id}')">Hapus</button>
                        </div>
                    </div>
                `;
            }).join('');
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
            document.getElementById('modalStatus').textContent = task.completed ? '✅ Selesai' : '⏳ Belum Selesai';
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
                        let notifBody = diffDays === 0 ? `Deadline HARI INI! - ${task.subject}` : `Deadline BESOK! - ${task.subject}`;
                        new Notification(task.name, { body: notifBody, tag: task.id });
                    });
                } else {
                    new Notification('School Task Planner', { 
                        body: 'Tidak ada tugas mendesak saat ini. Tetap semangat!',
                        tag: 'no-urgent-tasks'
                    });
                }
            } catch (error) {
                console.error('Notification error:', error);
            }
        }

        // === INITIALIZATION ===
        
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