// ==================== NAVIGATION ==================== 
function goHome() {
    window.location.href = '/';
}

function goToHost() {
    window.location.href = '/host';
}

function goToPeserta() {
    window.location.href = '/peserta';
}

// ==================== LOCAL STORAGE MANAGEMENT ==================== 
// Simulate a database using localStorage

function generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

function getAllRooms() {
    const rooms = localStorage.getItem('ttx_rooms');
    return rooms ? JSON.parse(rooms) : {};
}

function saveRooms(rooms) {
    localStorage.setItem('ttx_rooms', JSON.stringify(rooms));
}

function createNewRoom(roomName) {
    const rooms = getAllRooms();
    const roomCode = generateRoomCode();
    
    // Ensure unique room code
    while (rooms[roomCode]) {
        roomCode = generateRoomCode();
    }
    
    rooms[roomCode] = {
        code: roomCode,
        name: roomName,
        createdAt: new Date().toISOString(),
        participants: [],
        status: 'waiting',
        game_status: 'setup',
        questions: [],
        current_question_id: null,
        player_scores: {}
    };
    
    saveRooms(rooms);
    localStorage.setItem('ttx_currentHostRoom', roomCode);
    
    return roomCode;
}

function getRoom(roomCode) {
    const rooms = getAllRooms();
    return rooms[roomCode] || null;
}

function deleteRoom(roomCode) {
    const rooms = getAllRooms();
    delete rooms[roomCode];
    saveRooms(rooms);
    localStorage.removeItem('ttx_currentHostRoom');
}

function addParticipantToRoom(roomCode, playerName) {
    const rooms = getAllRooms();
    const room = rooms[roomCode];
    
    if (room) {
        if (!room.participants.includes(playerName)) {
            room.participants.push(playerName);
            saveRooms(rooms);
        }
        return true;
    }
    return false;
}

function removeParticipantFromRoom(roomCode, playerName) {
    const rooms = getAllRooms();
    const room = rooms[roomCode];
    
    if (room) {
        room.participants = room.participants.filter(p => p !== playerName);
        saveRooms(rooms);
    }
}

// ==================== HOST PAGE LOGIC ==================== 
function initHostPage() {
    let currentHostRoom = localStorage.getItem('ttx_currentHostRoom');

    // If host hasn't created a room yet, create one immediately and go to game page
    if (!currentHostRoom) {
        const autoName = 'Ruangan Host';
        const roomCode = createNewRoom(autoName);
        currentHostRoom = roomCode;
    }

    const room = getRoom(currentHostRoom);
    if (!room) return;

    // Immediately show game page for host. Questions will be created in-game.
    showGamePage();
    displayExistingRoom(room);
    displayQuestionsList();
    populatePlayerDropdown();
    loadScores();
}

function showGamePage() {
    const hostGame = document.getElementById('hostGamePage');
    if (hostGame) hostGame.style.display = 'block';
}

function endGame() {
    // Return to main page
    goHome();
}

function switchGameTab(tabName) {
    // Hide all tabs in game page
    const tabs = document.querySelectorAll('#hostGamePage .tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // Deactivate all tab buttons in game page
    const tabBtns = document.querySelectorAll('#hostGamePage .tab-btn');
    tabBtns.forEach(btn => btn.classList.remove('active'));
    
    // Show selected tab
    const selectedTab = document.getElementById(tabName + 'Tab');
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Activate corresponding button
    Array.from(tabBtns).forEach(btn => {
        if (btn.getAttribute('onclick')?.includes(tabName)) {
            btn.classList.add('active');
        }
    });
    
    // Load data for specific tabs
    if (tabName === 'daftarSoal') {
        displayGameQuestionsList();
    }
}
function createRoom() {
    const roomNameInput = document.getElementById('roomName');
    const roomName = roomNameInput.value.trim();
    
    if (!roomName) {
        showError('Silakan masukkan nama ruangan');
        return;
    }
    
    const roomCode = createNewRoom(roomName);
    const room = getRoom(roomCode);
    
    // Display room info
    displayExistingRoom(room);
    displayQuestionsList();
    
    // Clear form
    roomNameInput.value = '';
    
    // Switch to Buat Soal tab automatically
    switchHostTab('game');
    
    showSuccess('Ruangan berhasil dibuat! Mulai membuat soal.');
}

function displayExistingRoom(room) {
    // We intentionally do not use a separate "status ruangan" UI here per new flow
    const roomStatus = document.getElementById('roomStatus');
    if (roomStatus) {
        roomStatus.style.display = 'none';
    }
    
    // Show room info section
    const roomInfoSection = document.getElementById('roomInfoSection');
    if (roomInfoSection) {
        roomInfoSection.style.display = 'block';
    }
    
    // Update room info in Setup tab
    const displayRoomName = document.getElementById('displayRoomName');
    if (displayRoomName) {
        displayRoomName.textContent = room.name;
    }
    
    const roomCode = document.getElementById('roomCode');
    if (roomCode) {
        roomCode.value = room.code;
    }
    
    const participantCount = document.getElementById('participantCount');
    if (participantCount) {
        const count = room.participants.length;
        participantCount.textContent = count + (count === 1 ? ' peserta terhubung' : ' peserta terhubung');
    }
    
    updateParticipantsList(room.participants);
    
    const displayRoomNameInGame = document.getElementById('displayRoomNameInGame');
    if (displayRoomNameInGame) {
        displayRoomNameInGame.textContent = room.name;
    }
    
    const displayRoomCodeInGame = document.getElementById('displayRoomCodeInGame');
    if (displayRoomCodeInGame) {
        displayRoomCodeInGame.textContent = room.code;
    }
    
    const participantCountInGame = document.getElementById('participantCountInGame');
    if (participantCountInGame) {
        const count = room.participants.length;
        participantCountInGame.textContent = count + (count === 1 ? ' peserta' : ' peserta');
    }
    
    updateParticipantsListInGame(room.participants);
    
    // Show/hide no-questions notice and question box depending on questions
    try {
        const noQuestionsNotice = document.getElementById('noQuestionsNotice');
        const questionBox = document.getElementById('questionBox');
        if (room.questions && room.questions.length > 0) {
            if (noQuestionsNotice) noQuestionsNotice.style.display = 'none';
            if (questionBox) questionBox.style.display = 'block';
        } else {
            if (noQuestionsNotice) noQuestionsNotice.style.display = 'block';
            if (questionBox) questionBox.style.display = 'none';
        }
    } catch (e) {
        // ignore DOM errors
    }

    // Update start game button visibility
    const startGameBtn = document.getElementById('startGameBtn');
    const gameStatusMessage = document.getElementById('gameStatusMessage');
    const startGameBtnInGame = document.getElementById('startGameBtnInGame');
    const gameStatusMessageInGame = document.getElementById('gameStatusMessageInGame');
    
    if (room.game_status === 'playing') {
        if (startGameBtn) startGameBtn.style.display = 'none';
        if (gameStatusMessage) gameStatusMessage.style.display = 'block';
        if (startGameBtnInGame) startGameBtnInGame.style.display = 'none';
        if (gameStatusMessageInGame) gameStatusMessageInGame.style.display = 'block';
    } else {
        if (startGameBtn) startGameBtn.style.display = 'inline-block';
        if (gameStatusMessage) gameStatusMessage.style.display = 'none';
        if (startGameBtnInGame) startGameBtnInGame.style.display = 'inline-block';
        if (gameStatusMessageInGame) gameStatusMessageInGame.style.display = 'none';
    }
}

function updateParticipantsList(participants) {
    const participantsList = document.getElementById('participantsList');
    if (!participantsList) return;
    
    if (participants.length === 0) {
        participantsList.innerHTML = '<p class="empty-message">Belum ada peserta yang bergabung</p>';
    } else {
        participantsList.innerHTML = participants.map(name => 
            `<div class="participant-item">👤 ${name}</div>`
        ).join('');
    }
}

function updateParticipantsListInGame(participants) {
    const participantsList = document.getElementById('participantsListInGame');
    if (!participantsList) return;
    
    if (participants.length === 0) {
        participantsList.innerHTML = '<p class="empty-message">Belum ada peserta yang bergabung</p>';
    } else {
        participantsList.innerHTML = participants.map(name => 
            `<div class="participant-item">👤 ${name}</div>`
        ).join('');
    }
}

function copyRoomCode() {
    const roomCode = document.getElementById('roomCode');
    const copyText = document.getElementById('copyText');
    
    if (roomCode) {
        roomCode.select();
        document.execCommand('copy');
        
        const originalText = copyText.textContent;
        copyText.textContent = 'Tersalin! ✓';
        
        setTimeout(() => {
            copyText.textContent = originalText;
        }, 2000);
    }
}

function deleteRoom() {
    const currentHostRoom = localStorage.getItem('ttx_currentHostRoom');
    
    if (currentHostRoom && confirm('Apakah Anda yakin ingin menghapus ruangan ini?')) {
        deleteRoom(currentHostRoom);
        
        const roomStatus = document.getElementById('roomStatus');
        if (roomStatus) {
            roomStatus.innerHTML = '<p>Belum ada ruangan yang dibuat</p>';
            roomStatus.classList.add('inactive');
            roomStatus.classList.remove('active');
        }
        
        const roomInfoSection = document.getElementById('roomInfoSection');
        if (roomInfoSection) {
            roomInfoSection.style.display = 'none';
        }
        
        showSuccess('Ruangan berhasil dihapus');
    }
}

// Host leaves and ends the room: delete room and return to home
function leaveRoomAsHost() {
    const currentHostRoom = localStorage.getItem('ttx_currentHostRoom');
    if (!currentHostRoom) {
        goHome();
        return;
    }

    if (!confirm('Akhiri permainan ini dan keluarkan semua peserta?')) {
        return;
    }

    const rooms = getAllRooms();
    if (rooms && rooms[currentHostRoom]) {
        delete rooms[currentHostRoom];
        saveRooms(rooms);
    }

    // Remove host marker so revisiting /host will create a new room
    localStorage.removeItem('ttx_currentHostRoom');

    showSuccess('Permainan diakhiri. Kembali ke beranda.');
    goHome();
}

// ==================== PESERTA PAGE LOGIC ==================== 
function initPesertaPage() {
    const playerName = localStorage.getItem('ttx_playerName');
    const roomCode = localStorage.getItem('ttx_playerRoomCode');
    
    if (playerName && roomCode) {
        const room = getRoom(roomCode);
        if (room) {
            // Hide join section and always show game play (peserta langsung main)
            document.querySelector('.join-room-section').style.display = 'none';
            document.getElementById('waitingRoomSection').style.display = 'none';
            document.getElementById('gamePlaySection').style.display = 'block';
            updateGameDisplay();
        }
    }
}

function joinRoom() {
    const playerNameInput = document.getElementById('playerName');
    const roomCodeInput = document.getElementById('roomCodeInput');
    const errorMessage = document.getElementById('joinError');
    
    const room = getRoom(roomCode);
    if (!room) {
        showErrorMessage(errorMessage, 'Kode ruangan tidak ditemukan!');
        return;
    }
    
    // Check if player name already exists in this room
    if (room.participants.includes(playerName)) {
        showErrorMessage(errorMessage, 'Nama ini sudah digunakan di ruangan ini');
        return;
    }
    
    // Add participant to room
    addParticipantToRoom(roomCode, playerName);
    
    // Save to localStorage
    localStorage.setItem('ttx_playerName', playerName);
    localStorage.setItem('ttx_playerRoomCode', roomCode);
    
    // Clear join form
    playerNameInput.value = '';
    roomCodeInput.value = '';
    errorMessage.style.display = 'none';
    
    // Hide join section and show game play directly (peserta langsung main)
    document.querySelector('.join-room-section').style.display = 'none';
    document.getElementById('waitingRoomSection').style.display = 'none';
    document.getElementById('gamePlaySection').style.display = 'block';
    updateGameDisplay();
    
    showSuccess('Berhasil bergabung! Silakan mulai bermain.');
}

function displayWaitingRoom(playerName, room) {
    // Hide join room section
    const joinRoomSection = document.querySelector('.join-room-section');
    if (joinRoomSection) {
        joinRoomSection.style.display = 'none';
    }
    
    // Show waiting room section
    const waitingRoomSection = document.getElementById('waitingRoomSection');
    if (waitingRoomSection) {
        waitingRoomSection.style.display = 'block';
    }
    
    // Update display
    const displayRoomNamePeserta = document.getElementById('displayRoomNamePeserta');
    if (displayRoomNamePeserta) {
        displayRoomNamePeserta.textContent = room.name;
    }
    
    const displayPlayerName = document.getElementById('displayPlayerName');
    if (displayPlayerName) {
        displayPlayerName.textContent = playerName;
    }
    
    const displayRoomCodePeserta = document.getElementById('displayRoomCodePeserta');
    if (displayRoomCodePeserta) {
        displayRoomCodePeserta.textContent = room.code;
    }
    
    // Update other participants
    const otherParticipants = room.participants.filter(p => p !== playerName);
    updateOtherParticipantsList(otherParticipants);
}

function updateOtherParticipantsList(participants) {
    const otherParticipantsList = document.getElementById('otherParticipantsList');
    if (!otherParticipantsList) return;
    
    if (participants.length === 0) {
        otherParticipantsList.innerHTML = '<p class="empty-message">Anda adalah peserta pertama</p>';
    } else {
        otherParticipantsList.innerHTML = participants.map(name => 
            `<div class="participant-item">👤 ${name}</div>`
        ).join('');
    }
}

function leaveRoom() {
    const playerName = localStorage.getItem('ttx_playerName');
    const roomCode = localStorage.getItem('ttx_playerRoomCode');
    
    if (playerName && roomCode) {
        removeParticipantFromRoom(roomCode, playerName);
    }
    
    localStorage.removeItem('ttx_playerName');
    localStorage.removeItem('ttx_playerRoomCode');
    
    // Hide waiting room section
    const waitingRoomSection = document.getElementById('waitingRoomSection');
    if (waitingRoomSection) {
        waitingRoomSection.style.display = 'none';
    }
    
    // Show join room section
    const joinRoomSection = document.querySelector('.join-room-section');
    if (joinRoomSection) {
        joinRoomSection.style.display = 'block';
    }
    
    showSuccess('Anda telah keluar dari ruangan');
}

function leaveRoomAsHost() {
    const currentHostRoom = localStorage.getItem('ttx_currentHostRoom');
    
    if (currentHostRoom && confirm('Apakah Anda yakin ingin meninggalkan ruangan ini?')) {
        deleteRoom(currentHostRoom);
        localStorage.removeItem('ttx_currentHostRoom');
        window.location.href = '/';
    }
}

// ==================== UTILITY FUNCTIONS ==================== 
function showError(message) {
    alert(message);
}

function showErrorMessage(element, message) {
    if (element) {
        element.textContent = message;
        element.style.display = 'block';
    } else {
        showError(message);
    }
}

function showSuccess(message) {
    // Show in console and as alert
    console.log('✓ ' + message);
    const errorDiv = document.getElementById('gameCreationError');
    if (errorDiv) {
        errorDiv.textContent = '✓ ' + message;
        errorDiv.style.color = '#00aa00';
        errorDiv.style.borderColor = '#00aa00';
        errorDiv.style.backgroundColor = 'rgba(0, 170, 0, 0.1)';
        errorDiv.style.display = 'block';
        
        // Hide after 3 seconds
        setTimeout(() => {
            errorDiv.style.display = 'none';
            errorDiv.style.color = '';
            errorDiv.style.borderColor = '';
            errorDiv.style.backgroundColor = '';
        }, 3000);
    }
}

// ==================== HOST TAB SWITCHING ====================
function switchHostTab(tabName) {
    // Hide all tabs
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // Deactivate all tab buttons
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => btn.classList.remove('active'));
    
    // Show selected tab
    const selectedTab = document.getElementById(tabName + 'Tab');
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Activate corresponding button - find by matching the onclick value
    Array.from(tabBtns).forEach(btn => {
        if (btn.getAttribute('onclick')?.includes(tabName)) {
            btn.classList.add('active');
        }
    });
}

// ==================== GAME CONTROL ====================
function startGame() {
    const currentHostRoom = localStorage.getItem('ttx_currentHostRoom');
    if (!currentHostRoom) {
        showError('Belum ada ruangan yang aktif');
        return;
    }
    
    const room = getRoom(currentHostRoom);
    if (!room) {
        showError('Ruangan tidak ditemukan');
        return;
    }
    
    // Start the game (can start even if there are no questions yet)
    room.game_status = 'playing';
    if (!room.current_question_id && room.questions && room.questions.length > 0) {
        room.current_question_id = room.questions[0].question_id;
    }
    
    // Initialize player scores for all participants
    if (!room.player_scores) {
        room.player_scores = {};
    }
    room.participants.forEach(participant => {
        if (!room.player_scores[participant]) {
            room.player_scores[participant] = 0;
        }
    });
    
    // Save room - need to update the rooms object correctly
    const allRooms = getAllRooms();
    allRooms[currentHostRoom] = room;
    saveRooms(allRooms);
    
    // Update UI - switch to game page
    showGamePage();
    populatePlayerDropdown();
    loadCurrentQuestion();
    loadScores();
    
    const startGameBtn = document.getElementById('startGameBtn');
    if (startGameBtn) {
        startGameBtn.style.display = 'none';
    }
    
    const gameStatusMessage = document.getElementById('gameStatusMessage');
    if (gameStatusMessage) {
        gameStatusMessage.style.display = 'block';
    }
    
    showSuccess('Permainan dimulai! Peserta dapat melihat soal pertama.');
}

// ==================== GAME QUESTION MANAGEMENT ====================
function createQuestion() {
    const questionText = document.getElementById('questionText').value.trim();
    const answerText = document.getElementById('questionAnswer').value.trim().toUpperCase();
    const helpingLettersInput = document.getElementById('helpingLettersInput').value.trim();
    const pointsInput = document.getElementById('questionPoints');
    const points = pointsInput ? parseInt(pointsInput.value) : 10;
    const errorDiv = document.getElementById('gameCreationError');
    
    if (!questionText || !answerText) {
        showErrorMessage(errorDiv, 'Soal dan jawaban harus diisi!');
        return;
    }
    
    if (points < 1) {
        showErrorMessage(errorDiv, 'Poin harus minimal 1!');
        return;
    }
    
    // Parse helping letters (positions provided as 1-based)
    let helpingLetters = [];
    if (helpingLettersInput) {
        // allow separators '|' or ';'
        const pairs = helpingLettersInput.split(/[;|]/);
        for (let pair of pairs) {
            const [posRaw, letter] = pair.split(',').map(s => s.trim());
            const posNum = parseInt(posRaw);
            if (!isNaN(posNum) && letter !== undefined) {
                // Convert 1-based position to 0-based index internally
                helpingLetters.push({
                    position: posNum - 1,
                    letter: letter.toUpperCase()
                });
            }
        }
    }
    
    const currentHostRoom = localStorage.getItem('ttx_currentHostRoom');
    if (!currentHostRoom) {
        showErrorMessage(errorDiv, 'Ruangan tidak ditemukan!');
        return;
    }
    
    const room = getRoom(currentHostRoom);
    if (!room) {
        showErrorMessage(errorDiv, 'Ruangan tidak ditemukan!');
        return;
    }
    
    // Create question object
    const qid = 'q' + (room.questions ? room.questions.length + 1 : 1);
    const question = {
        question_id: qid,
        question: questionText,
        answer: answerText,
        answer_length: answerText.length,
        helping_letters: helpingLetters,
        points: points,
        status: 'active',
        revealed_at: null,
        created_at: new Date().toISOString()
    };
    
    // Add to room
    if (!room.questions) room.questions = [];
    room.questions.push(question);
    
    // Don't set as current yet - game only starts when host clicks "Mulai Permainan"
    
    // Save room back to localStorage
    const allRooms = getAllRooms();
    allRooms[currentHostRoom] = room;
    saveRooms(allRooms);
    
    // Clear form
    document.getElementById('questionText').value = '';
    document.getElementById('questionAnswer').value = '';
    document.getElementById('helpingLettersInput').value = '';
    document.getElementById('questionPoints').value = '10';
    errorDiv.style.display = 'none';
    
    // Refresh display
    displayQuestionsList();
    
    showSuccess('Soal berhasil ditambahkan!');
}

    function createQuestionDuringGame() {
        const questionText = document.getElementById('gameQuestionText').value.trim();
        const answerText = document.getElementById('gameQuestionAnswer').value.trim().toUpperCase();
        const helpingLettersInput = document.getElementById('gameHelpingLettersInput').value.trim();
        const pointsInput = document.getElementById('gameQuestionPoints');
        const points = pointsInput ? parseInt(pointsInput.value) : 10;
        const errorDiv = document.getElementById('gameCreationError');
    
        if (!questionText || !answerText) {
            showErrorMessage(errorDiv, 'Soal dan jawaban harus diisi!');
            return;
        }
    
        if (points < 1) {
            showErrorMessage(errorDiv, 'Poin harus minimal 1!');
            return;
        }
    
        // Parse helping letters (positions provided as 1-based)
        let helpingLetters = [];
        if (helpingLettersInput) {
            const pairs = helpingLettersInput.split(/[;|]/);
            for (let pair of pairs) {
                const [posRaw, letter] = pair.split(',').map(s => s.trim());
                const posNum = parseInt(posRaw);
                if (!isNaN(posNum) && letter !== undefined) {
                    helpingLetters.push({ position: posNum - 1, letter: letter.toUpperCase() });
                }
            }
        }
    
        const currentHostRoom = localStorage.getItem('ttx_currentHostRoom');
        if (!currentHostRoom) {
            showErrorMessage(errorDiv, 'Ruangan tidak ditemukan!');
            return;
        }
    
        const room = getRoom(currentHostRoom);
        if (!room) {
            showErrorMessage(errorDiv, 'Ruangan tidak ditemukan!');
            return;
        }
    
        // Create question object
        const qid = 'q' + (room.questions ? room.questions.length + 1 : 1);
        const question = {
            question_id: qid,
            question: questionText,
            answer: answerText,
            answer_length: answerText.length,
            helping_letters: helpingLetters,
            points: points,
            status: 'active',
            revealed_at: null,
            created_at: new Date().toISOString()
        };
    
        // Add to room
        if (!room.questions) room.questions = [];
        room.questions.push(question);
    
        // Save room back to localStorage
        const allRooms = getAllRooms();
        allRooms[currentHostRoom] = room;
        saveRooms(allRooms);
    
        // Clear form
        document.getElementById('gameQuestionText').value = '';
        document.getElementById('gameQuestionAnswer').value = '';
        document.getElementById('gameHelpingLettersInput').value = '';
        document.getElementById('gameQuestionPoints').value = '10';
        errorDiv.style.display = 'none';
    
        showSuccess('Soal baru berhasil ditambahkan ke permainan!');
    }
function displayQuestionsList() {
    const currentHostRoom = localStorage.getItem('ttx_currentHostRoom');
    if (!currentHostRoom) return;
    
    const room = getRoom(currentHostRoom);
    if (!room || !room.questions) {
        const list = document.getElementById('questionsList');
        if (list) list.innerHTML = '<p class="empty-message">Belum ada soal yang dibuat</p>';
        return;
    }
    
    const listHtml = room.questions.map((q, idx) => `
        <div class="question-item">
            <div class="question-item-text">${idx + 1}. ${q.question}</div>
            <div class="question-item-answer">Jawaban: ${q.answer}</div>
            <div class="question-item-points">Poin: ${q.points || 10}</div>
            <div class="question-item-status ${q.status === 'revealed' ? 'status-revealed' : 'status-aktif'}">${q.status === 'revealed' ? 'TERBUKA' : 'AKTIF'}</div>
            <div class="question-item-actions">
                <button class="btn btn-select" onclick="selectQuestion('${q.question_id}')">Pilih</button>
                <button class="btn btn-danger" onclick="deleteQuestion('${q.question_id}')">Hapus</button>
            </div>
        </div>
    `).join('');
    
    const list = document.getElementById('questionsList');
    if (list) list.innerHTML = listHtml;
}

function loadCurrentQuestion() {
    const currentHostRoom = localStorage.getItem('ttx_currentHostRoom');
    if (!currentHostRoom) return;
    
    const room = getRoom(currentHostRoom);
    if (!room || !room.questions || !room.current_question_id) {
        const questionBox = document.getElementById('questionBox');
        if (questionBox) questionBox.style.display = 'none';
        return;
    }
    
    // Find current question
    const currentQ = room.questions.find(q => q.question_id === room.current_question_id);
    if (!currentQ) {
        const questionBox = document.getElementById('questionBox');
        if (questionBox) questionBox.style.display = 'none';
        return;
    }
    
    // Display question
    const displayQuestion = document.getElementById('displayQuestion');
    if (displayQuestion) displayQuestion.textContent = currentQ.question;
    
    const questionBox = document.getElementById('questionBox');
    if (questionBox) questionBox.style.display = 'block';
    
    // Render answer boxes
    renderAnswerBoxes(currentQ, 'host');
    
    // Update participants dropdown for awarding points
    if (room.participants) {
        const selectElement = document.getElementById('awardPointsPlayer');
        if (selectElement) {
            selectElement.innerHTML = '<option value="">-- Pilih Peserta --</option>';
            room.participants.forEach(p => {
                selectElement.innerHTML += `<option value="${p}">${p}</option>`;
            });
        }
    }
    
    // Clear input fields
    const guessInput = document.getElementById('guessInput');
    const awardPointsInput = document.getElementById('awardPointsInput');
    const answerCheckResult = document.getElementById('answerCheckResult');
    const gamePlayError = document.getElementById('gamePlayError');
    
    if (guessInput) guessInput.value = '';
    if (awardPointsInput) awardPointsInput.value = '';
    if (answerCheckResult) answerCheckResult.style.display = 'none';
    if (gamePlayError) gamePlayError.style.display = 'none';
}

function selectQuestion(questionId) {
    const currentHostRoom = localStorage.getItem('ttx_currentHostRoom');
    if (!currentHostRoom) return;
    const room = getRoom(currentHostRoom);
    if (!room || !room.questions) return;

    const q = room.questions.find(x => x.question_id === questionId);
    if (!q) {
        showError('Soal tidak ditemukan');
        return;
    }

    room.current_question_id = questionId;
    const allRooms = getAllRooms();
    allRooms[currentHostRoom] = room;
    saveRooms(allRooms);

    loadCurrentQuestion();
    displayQuestionsList();
    displayGameQuestionsList();
    showSuccess('Soal dipilih sebagai soal saat ini');
}

function deleteQuestion(questionId) {
    if (!confirm('Apakah Anda yakin ingin menghapus soal ini?')) {
        return;
    }
    
    const currentHostRoom = localStorage.getItem('ttx_currentHostRoom');
    if (!currentHostRoom) return;
    const room = getRoom(currentHostRoom);
    if (!room || !room.questions) return;
    
    // Remove question from list
    room.questions = room.questions.filter(q => q.question_id !== questionId);
    
    // If deleted question was current, set to first question if available
    if (room.current_question_id === questionId) {
        room.current_question_id = room.questions.length > 0 ? room.questions[0].question_id : null;
    }
    
    const allRooms = getAllRooms();
    allRooms[currentHostRoom] = room;
    saveRooms(allRooms);
    
    // Refresh displays
    displayQuestionsList();
    displayGameQuestionsList();
    if (room.current_question_id) {
        loadCurrentQuestion();
    }
    
    showSuccess('Soal berhasil dihapus');
}

function renderAnswerBoxes(question, mode) {
    const gridId = mode === 'host' ? 'answerBoxes' : 'answerGrid';
    const grid = document.getElementById(gridId);
    if (!grid) return;
    
    let html = '';
    
    for (let i = 0; i < question.answer_length; i++) {
        let boxClass = 'answer-box empty';
        let letter = '';
        
        // Check if this position has helping letter
        const helpLetter = question.helping_letters.find(h => h.position === i);
        if (helpLetter) {
            boxClass = 'answer-box with-letter';
            letter = helpLetter.letter;
        }
        
        // If revealed, show answer
        if (question.status === 'revealed') {
            boxClass = 'answer-box revealed';
            letter = question.answer[i];
        }
        
        html += `<div class="${boxClass}">${letter}</div>`;
    }
    
    grid.innerHTML = html;
}

function checkAnswer() {
    const guessText = document.getElementById('guessInput').value.trim().toUpperCase();
    const feedbackDiv = document.getElementById('answerFeedback');
    const resultDiv = document.getElementById('answerCheckResult');
    
    if (!guessText) {
        showErrorMessage(feedbackDiv, 'Masukkan jawaban terlebih dahulu!');
        resultDiv.style.display = 'block';
        return;
    }
    
    const currentHostRoom = localStorage.getItem('ttx_currentHostRoom');
    const room = getRoom(currentHostRoom);
    const currentQ = room.questions.find(q => q.question_id === room.current_question_id);
    
    if (!currentQ) return;
    
    const isCorrect = (guessText === currentQ.answer);
    
    if (isCorrect) {
        feedbackDiv.textContent = 'BENAR! Jawaban: ' + currentQ.answer;
        feedbackDiv.style.borderColor = '#00aa00';
        feedbackDiv.style.backgroundColor = 'rgba(0, 170, 0, 0.1)';
        feedbackDiv.style.color = '#00aa00';
    } else {
        feedbackDiv.textContent = 'SALAH! Jawaban yang benar adalah: ' + currentQ.answer;
        feedbackDiv.style.borderColor = '#ff3333';
        feedbackDiv.style.backgroundColor = 'rgba(255, 51, 51, 0.1)';
        feedbackDiv.style.color = '#ff3333';
    }
    
    resultDiv.style.display = 'block';
}

function revealAnswer() {
    const currentHostRoom = localStorage.getItem('ttx_currentHostRoom');
    const room = getRoom(currentHostRoom);
    const currentQ = room.questions.find(q => q.question_id === room.current_question_id);
    
    if (!currentQ) return;
    
    currentQ.status = 'revealed';
    currentQ.revealed_at = new Date().toISOString();
    
    const allRooms = getAllRooms();
    allRooms[currentHostRoom] = room;
    saveRooms(allRooms);
    loadCurrentQuestion();
    
    showSuccess('Jawaban telah dibuka!');
}

function markAnswerWrong() {
    // Add red flash animation to each answer box on host side
    const answerBoxes = document.getElementById('answerBoxes');
    if (answerBoxes) {
        const boxes = answerBoxes.querySelectorAll('.answer-box');
        boxes.forEach(box => {
            box.classList.add('wrong-flash');
        });
        setTimeout(() => {
            boxes.forEach(box => {
                box.classList.remove('wrong-flash');
            });
        }, 600);
    }
    
    // Set flag on current question so peserta can see animation real-time
    const currentHostRoom = localStorage.getItem('ttx_currentHostRoom');
    const room = getRoom(currentHostRoom);
    const currentQ = room.questions.find(q => q.question_id === room.current_question_id);
    
    if (currentQ) {
        currentQ.last_wrong_flash_time = new Date().getTime();
        const allRooms = getAllRooms();
        allRooms[currentHostRoom] = room;
        saveRooms(allRooms);
    }
    
    const errorDiv = document.getElementById('gamePlayError');
    if (errorDiv) {
        errorDiv.textContent = '❌ Jawaban Peserta SALAH!';
        errorDiv.style.borderColor = '#ff3333';
        errorDiv.style.backgroundColor = 'rgba(255, 51, 51, 0.1)';
        errorDiv.style.color = '#ff3333';
        errorDiv.style.display = 'block';
        
        // Hide after 3 seconds
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 3000);
    }
}

function displayGameQuestionsList() {
    const currentHostRoom = localStorage.getItem('ttx_currentHostRoom');
    if (!currentHostRoom) return;
    
    const room = getRoom(currentHostRoom);
    if (!room || !room.questions) {
        const list = document.getElementById('gameQuestionsList');
        if (list) list.innerHTML = '<p class="empty-message">Belum ada soal yang dibuat</p>';
        return;
    }
    
    const listHtml = room.questions.map((q, idx) => `
        <div class="question-item">
            <div class="question-item-text">${idx + 1}. ${q.question}</div>
            <div class="question-item-answer">Jawaban: ${q.answer}</div>
            <div class="question-item-points">Poin: ${q.points || 10}</div>
            <div class="question-item-status ${q.status === 'revealed' ? 'status-revealed' : 'status-aktif'}">${q.status === 'revealed' ? 'TERBUKA' : 'AKTIF'}</div>
            <div class="question-item-actions">
                <button class="btn btn-select" onclick="selectQuestion('${q.question_id}')">Pilih</button>
                <button class="btn btn-danger" onclick="deleteQuestion('${q.question_id}')">Hapus</button>
            </div>
        </div>
    `).join('');
    
    const list = document.getElementById('gameQuestionsList');
    if (list) list.innerHTML = listHtml;
}

// Open inline tabs for create / daftar (no modals)
function openCreateModal() {
    switchGameTab('createQuestion');
    const el = document.getElementById('gameQuestionText');
    if (el) el.focus();
}

function openDaftarModal() {
    switchGameTab('daftarSoal');
}

// Modal-based create question (preferred)
function openCreateQuestionModal() {
    const overlay = document.getElementById('modalOverlay');
    const modal = document.getElementById('createQuestionModal');
    if (!overlay || !modal) return;
    overlay.style.display = 'block';
    modal.style.display = 'block';
    const input = document.getElementById('gameQuestionText');
    if (input) input.focus();

    // overlay click closes modal
    overlay.onclick = closeCreateQuestionModal;

    // ESC key closes modal
    window._ttx_modal_keydown = function(e) {
        if (e.key === 'Escape') closeCreateQuestionModal();
    };
    document.addEventListener('keydown', window._ttx_modal_keydown);
}

function closeCreateQuestionModal() {
    const overlay = document.getElementById('modalOverlay');
    const modal = document.getElementById('createQuestionModal');
    if (!overlay || !modal) return;
    overlay.style.display = 'none';
    modal.style.display = 'none';

    // cleanup handlers
    if (overlay.onclick === closeCreateQuestionModal) overlay.onclick = null;
    if (window._ttx_modal_keydown) {
        document.removeEventListener('keydown', window._ttx_modal_keydown);
        window._ttx_modal_keydown = null;
    }
}

// Daftar Soal modal open/close
function openDaftarSoalModal() {
    const overlay = document.getElementById('modalOverlayDaftar');
    const modal = document.getElementById('daftarSoalModal');
    if (!overlay || !modal) return;
    overlay.style.display = 'block';
    modal.style.display = 'block';

    overlay.onclick = closeDaftarSoalModal;

    window._ttx_daftar_keydown = function(e) {
        if (e.key === 'Escape') closeDaftarSoalModal();
    };
    document.addEventListener('keydown', window._ttx_daftar_keydown);

    // Ensure the latest list is rendered when opened
    displayGameQuestionsList();
}

function closeDaftarSoalModal() {
    const overlay = document.getElementById('modalOverlayDaftar');
    const modal = document.getElementById('daftarSoalModal');
    if (!overlay || !modal) return;
    overlay.style.display = 'none';
    modal.style.display = 'none';

    if (overlay.onclick === closeDaftarSoalModal) overlay.onclick = null;
    if (window._ttx_daftar_keydown) {
        document.removeEventListener('keydown', window._ttx_daftar_keydown);
        window._ttx_daftar_keydown = null;
    }
}

function awardPoints() {
    const playerName = document.getElementById('awardPointsPlayer').value;
    const points = parseInt(document.getElementById('awardPointsInput').value);
    const errorDiv = document.getElementById('gamePlayError');
    
    if (!playerName) {
        showErrorMessage(errorDiv, 'Pilih peserta terlebih dahulu!');
        errorDiv.style.display = 'block';
        return;
    }
    
    if (!points || points < 0) {
        showErrorMessage(errorDiv, 'Masukkan jumlah poin yang valid!');
        errorDiv.style.display = 'block';
        return;
    }
    
    const currentHostRoom = localStorage.getItem('ttx_currentHostRoom');
    const room = getRoom(currentHostRoom);
    
    if (!room.player_scores) room.player_scores = {};
    if (!room.player_scores[playerName]) room.player_scores[playerName] = 0;
    
    room.player_scores[playerName] += points;
    
    const allRooms = getAllRooms();
    allRooms[currentHostRoom] = room;
    saveRooms(allRooms);
    
    document.getElementById('awardPointsInput').value = '';
    document.getElementById('awardPointsPlayer').value = '';
    errorDiv.style.display = 'none';
    
    showSuccess(`${points} poin berhasil diberikan ke ${playerName}!`);
    // Call loadScores after awarding points to update scoreboard in real-time
    loadScores();
}

function populatePlayerDropdown() {
    const currentHostRoom = localStorage.getItem('ttx_currentHostRoom');
    const room = getRoom(currentHostRoom);
    const dropdown = document.getElementById('awardPointsPlayer');
    
    if (!dropdown || !room) return;
    
    // Clear existing options except the first one
    while (dropdown.options.length > 1) {
        dropdown.remove(1);
    }
    
    // Add participant options
    if (room.participants && room.participants.length > 0) {
        room.participants.forEach(participant => {
            const option = document.createElement('option');
            option.value = participant;
            option.textContent = participant;
            dropdown.appendChild(option);
        });
    }
}

function nextQuestion() {
    const currentHostRoom = localStorage.getItem('ttx_currentHostRoom');
    const room = getRoom(currentHostRoom);
    
    const currentIdx = room.questions.findIndex(q => q.question_id === room.current_question_id);
    
    if (currentIdx < room.questions.length - 1) {
        room.current_question_id = room.questions[currentIdx + 1].question_id;
        const allRooms = getAllRooms();
        allRooms[currentHostRoom] = room;
        saveRooms(allRooms);
        loadCurrentQuestion();
        showSuccess('Soal berikutnya telah dimuat!');
    } else {
        showError('Tidak ada soal lagi!');
    }
}

function loadScores() {
    const currentHostRoom = localStorage.getItem('ttx_currentHostRoom');
    const room = getRoom(currentHostRoom);
    
    if (!room || !room.player_scores || Object.keys(room.player_scores).length === 0) {
        document.getElementById('scoresBoard').innerHTML = '<p class="empty-message">Belum ada skor</p>';
        return;
    }
    
    const scores = Object.entries(room.player_scores);
    scores.sort((a, b) => b[1] - a[1]);
    
    let html = '';
    scores.forEach((entry, idx) => {
        html += `
            <div class="score-item">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <span class="score-rank">#${idx + 1}</span>
                    <span class="score-player-name">${entry[0]}</span>
                </div>
                <span class="score-points">${entry[1]} Poin</span>
            </div>
        `;
    });
    
    document.getElementById('scoresBoard').innerHTML = html;
}

// ==================== PESERTA GAME FUNCTIONS ====================
function updateGameDisplay() {
    const playerName = localStorage.getItem('ttx_playerName');
    const roomCode = localStorage.getItem('ttx_playerRoomCode');
    
    if (!playerName || !roomCode) return;
    
    const room = getRoom(roomCode);
    if (!room) return;
    
    document.getElementById('playerNameDisplay').textContent = playerName;
    document.getElementById('playerScoreDisplay').textContent = room.player_scores ? (room.player_scores[playerName] || 0) : 0;
    
    // Load current question if available
    if (room.current_question_id && room.questions && room.questions.length > 0) {
        const currentQ = room.questions.find(q => q.question_id === room.current_question_id);
        if (currentQ) {
            const soalEl = document.getElementById('soalText');
            if (soalEl) soalEl.textContent = currentQ.question; // only set if element exists
            const waitingQuestionEl = document.getElementById('waitingQuestionMessage');
            if (waitingQuestionEl) waitingQuestionEl.style.display = 'none';
            renderAnswerBoxes(currentQ, 'peserta');
            const playerAnswerEl = document.getElementById('playerAnswer');
            if (playerAnswerEl) playerAnswerEl.value = '';
            const answerResultEl = document.getElementById('answerResult');
            if (answerResultEl) answerResultEl.style.display = 'none';
        }
    } else {
        // No question yet: show waiting message
        const waitingQuestionEl = document.getElementById('waitingQuestionMessage');
        if (waitingQuestionEl) waitingQuestionEl.style.display = 'block';
        const answerGridEl = document.getElementById('answerGrid');
        if (answerGridEl) answerGridEl.innerHTML = '';
    }
}

function submitPesertaAnswer() {
    const playerName = localStorage.getItem('ttx_playerName');
    const roomCode = localStorage.getItem('ttx_playerRoomCode');
    const answerInput = document.getElementById('playerAnswer').value.trim().toUpperCase();
    const resultDiv = document.getElementById('answerResult');
    const resultText = document.getElementById('answerResultText');
    
    if (!answerInput) {
        showErrorMessage(resultText, 'Masukkan jawaban terlebih dahulu!');
        resultDiv.style.display = 'block';
        return;
    }
    
    const room = getRoom(roomCode);
    const currentQ = room.questions.find(q => q.question_id === room.current_question_id);
    
    if (!currentQ) return;
    
    const isCorrect = (answerInput === currentQ.answer);
    
    if (isCorrect) {
        resultText.textContent = 'BENAR! Tunggu host memberikan poin.';
        resultText.style.borderColor = '#00aa00';
        resultText.style.backgroundColor = 'rgba(0, 170, 0, 0.1)';
        resultText.style.color = '#00aa00';
    } else {
        resultText.textContent = 'SALAH! Coba lagi atau tunggu jawaban yang benar.';
        resultText.style.borderColor = '#ff3333';
        resultText.style.backgroundColor = 'rgba(255, 51, 51, 0.1)';
        resultText.style.color = '#ff3333';
    }
    
    resultDiv.style.display = 'block';
    document.getElementById('playerAnswer').value = '';
}

// ==================== PAGE INITIALIZATION ==================== 
document.addEventListener('DOMContentLoaded', function() {
    // Determine which page we're on and initialize accordingly
    const pathname = window.location.pathname;
    
    if (pathname === '/host') {
        initHostPage();
    } else if (pathname === '/peserta') {
        initPesertaPage();
    }
});

// Optional: Auto-refresh data periodically (for real-time updates)
setInterval(function() {
    const pathname = window.location.pathname;
    
    if (pathname === '/host') {
        const currentHostRoom = localStorage.getItem('ttx_currentHostRoom');
        if (currentHostRoom) {
            const room = getRoom(currentHostRoom);
            if (room) {
                // Update participant count and list in Setup tab
                const participantCount = document.getElementById('participantCount');
                if (participantCount) {
                    const count = room.participants.length;
                    participantCount.textContent = count + (count === 1 ? ' peserta terhubung' : ' peserta terhubung');
                }
                updateParticipantsList(room.participants);
                
                // Update participant count and list in Game tab
                const participantCountInGame = document.getElementById('participantCountInGame');
                if (participantCountInGame) {
                    const count = room.participants.length;
                    participantCountInGame.textContent = count + (count === 1 ? ' peserta' : ' peserta');
                }
                updateParticipantsListInGame(room.participants);
                
                // Refresh game display if on Bermain tab
                const activeTab = document.querySelector('.tab-btn.active');
                if (activeTab && activeTab.textContent.includes('Bermain')) {
                    if (room.current_question_id !== undefined) {
                        loadCurrentQuestion();
                        loadScores();
                    }
                }
            }
        }
    } else if (pathname === '/peserta') {
        const playerName = localStorage.getItem('ttx_playerName');
        const roomCode = localStorage.getItem('ttx_playerRoomCode');
        if (playerName && roomCode) {
            const room = getRoom(roomCode);
            if (room) {
                // Update other participants list
                const otherParticipants = room.participants.filter(p => p !== playerName);
                updateOtherParticipantsList(otherParticipants);
                
                // Check if game has started
                if (room.game_status === 'playing') {
                    const waitingRoom = document.getElementById('waitingRoomSection');
                    const gamePlay = document.getElementById('gamePlaySection');

                    // If there is an active question, show gameplay; otherwise keep peserta in waiting
                    if (room.current_question_id && room.questions && room.questions.length > 0) {
                        if (waitingRoom && gamePlay) {
                            waitingRoom.style.display = 'none';
                            gamePlay.style.display = 'block';
                            updateGameDisplay();
                        }
                    } else {
                        // No question yet: show waiting message to peserta while host prepares soal
                        if (waitingRoom && gamePlay) {
                            waitingRoom.style.display = 'block';
                            gamePlay.style.display = 'none';
                        }
                    }
                }
                
                // Update game display if game is active
                if (room.game_status === 'playing' && room.current_question_id !== undefined && 
                    document.getElementById('gamePlaySection') && 
                    document.getElementById('gamePlaySection').style.display !== 'none') {
                    updateGameDisplay();
                    
                    // Check for wrong flash flag and trigger animation if present
                    const currentQ = room.questions.find(q => q.question_id === room.current_question_id);
                    if (currentQ && currentQ.last_wrong_flash_time) {
                        const lastWrongTime = currentQ.last_wrong_flash_time;
                        const lastProcessedTime = localStorage.getItem('ttx_lastWrongFlashTime_' + currentQ.question_id);
                        
                        // If we haven't processed this wrong flash yet, show it
                        if (!lastProcessedTime || parseInt(lastProcessedTime) < lastWrongTime) {
                            showPesertaWrongFlash();
                            localStorage.setItem('ttx_lastWrongFlashTime_' + currentQ.question_id, lastWrongTime.toString());
                        }
                    }
                }
            }
        }
    }
}, 2000); // Refresh every 2 seconds

function showPesertaWrongFlash() {
    const answerGrid = document.getElementById('answerGrid');
    if (answerGrid) {
        const boxes = answerGrid.querySelectorAll('.answer-box');
        boxes.forEach(box => {
            box.classList.add('wrong-flash');
        });
        setTimeout(() => {
            boxes.forEach(box => {
                box.classList.remove('wrong-flash');
            });
        }, 600);
    }
}
