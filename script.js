        // Ambil data dari localStorage atau buat array kosong
        let tasks = JSON.parse(localStorage.getItem('schoolTasks')) || [];

        // Variabel untuk menyimpan callback konfirmasi
        let confirmCallback = null;

        // Fungsi untuk menampilkan konfirmasi custom
        function showConfirm(message, onConfirm) {
            document.getElementById('confirmMessage').textContent = message;
            document.getElementById('confirmModal').style.display = 'block';
            confirmCallback = onConfirm;
        }

        // Event listener untuk tombol Ya
        document.getElementById('confirmYes').addEventListener('click', function() {
            document.getElementById('confirmModal').style.display = 'none';
            if (confirmCallback) {
                confirmCallback();
                confirmCallback = null;
            }
        });

        // Event listener untuk tombol Tidak
        document.getElementById('confirmNo').addEventListener('click', function() {
            document.getElementById('confirmModal').style.display = 'none';
            confirmCallback = null;
        });

        // Tutup confirm modal jika klik di luar modal
        window.addEventListener('click', function(event) {
            const confirmModal = document.getElementById('confirmModal');
            if (event.target === confirmModal) {
                confirmModal.style.display = 'none';
                confirmCallback = null;
            }
        });

        // Fungsi untuk menyimpan ke localStorage
        function saveTasks() {
            localStorage.setItem('schoolTasks', JSON.stringify(tasks));
        }

        // Fungsi untuk menampilkan tugas
        function displayTasks() {
            const tasksList = document.getElementById('tasksList');
            
            // Jika tidak ada tugas
            if (tasks.length === 0) {
                tasksList.innerHTML = `
                    <div class="empty-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                        </svg>
                        <p>Belum ada tugas. Tambahkan tugas pertamamu!</p>
                    </div>
                `;
                return;
            }

            // Urutkan berdasarkan deadline terdekat
            const sortedTasks = [...tasks].sort((a, b) => {
                return new Date(a.deadline) - new Date(b.deadline);
            });

            // Buat HTML untuk setiap tugas
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

        // Fungsi untuk menampilkan detail tugas
        function showDetail(id) {
            const task = tasks.find(t => t.id === id);
            if (!task) return;

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
            
            // Tampilkan atau sembunyikan section catatan
            const notesSection = document.getElementById('notesSection');
            if (task.notes && task.notes.trim() !== '') {
                document.getElementById('modalNotes').textContent = task.notes;
                notesSection.style.display = 'block';
            } else {
                notesSection.style.display = 'none';
            }

            document.getElementById('taskModal').style.display = 'block';
        }

        // Fungsi untuk menutup modal
        function closeModal() {
            document.getElementById('taskModal').style.display = 'none';
        }

        // Tutup detail modal jika klik di luar modal (tidak mengganggu confirm modal)
        window.addEventListener('click', function(event) {
            const detailModal = document.getElementById('taskModal');
            if (event.target === detailModal) {
                detailModal.style.display = 'none';
            }
        });

        // Fungsi untuk menambah tugas
        document.getElementById('taskForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const taskName = document.getElementById('taskName').value;
            const taskSubject = document.getElementById('taskSubject').value;
            const taskDeadline = document.getElementById('taskDeadline').value;
            const taskDescription = document.getElementById('taskDescription').value;
            const taskNotes = document.getElementById('taskNotes').value;

            // Buat objek tugas baru
            const newTask = {
                id: Date.now().toString(),
                name: taskName,
                subject: taskSubject,
                deadline: taskDeadline,
                description: taskDescription,
                notes: taskNotes,
                completed: false
            };

            // Tambahkan ke array
            tasks.push(newTask);
            
            // Simpan ke localStorage
            saveTasks();
            
            // Tampilkan ulang
            displayTasks();
            
            // Reset form
            this.reset();
        });

        // Fungsi untuk toggle status selesai
        function toggleTask(id) {
            const task = tasks.find(t => t.id === id);
            if (task) {
                // Jika tugas belum selesai, minta konfirmasi
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
                    // Jika tugas sudah selesai, langsung batalkan tanpa konfirmasi
                    task.completed = false;
                    saveTasks();
                    displayTasks();
                }
            }
        }

        // Fungsi untuk menghapus tugas
        function deleteTask(id) {
            // Cari nama tugas untuk ditampilkan di konfirmasi
            const task = tasks.find(t => t.id === id);
            
            // Tampilkan dialog konfirmasi
            showConfirm(
                `Apakah Anda yakin ingin menghapus tugas "${task.name}"?`,
                function() {
                    tasks = tasks.filter(t => t.id !== id);
                    saveTasks();
                    displayTasks();
                }
            );
        }

        // Set minimum date untuk input deadline (hari ini)
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('taskDeadline').setAttribute('min', today);

        // Tampilkan tugas saat halaman dimuat
        displayTasks();