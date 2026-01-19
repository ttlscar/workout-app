// ===== 앱 상태 관리 =====
const APP_STATE = {
    currentDate: new Date(),
    selectedDate: new Date(),
    isSettingsOpen: false,
    editingDay: null
};

// ===== 기본 데이터 구조 =====
const DEFAULT_DATA = {
    weeklyPlan: {
        mon: { name: "가슴", exercises: ["벤치프레스", "인클라인 덤벨프레스", "플로어프레스", "푸시업"] },
        tue: { name: "등", exercises: ["랫풀다운", "바벨로우", "덤벨로우", "시티드로우"] },
        wed: { name: "휴식", exercises: [] },
        thu: { name: "어깨", exercises: ["오버헤드프레스", "사이드레터럴", "프론트레이즈", "페이스풀"] },
        fri: { name: "하체", exercises: ["스쿼트", "레그프레스", "레그컬", "런지"] },
        sat: { name: "팔", exercises: ["바벨컬", "트라이셉 푸시다운", "해머컬", "오버헤드익스텐션"] },
        sun: { name: "휴식", exercises: [] }
    },
    records: {}
};

// ===== 요일 매핑 =====
const DAY_NAMES = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

// ===== 유틸리티 함수 =====
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function isSameDate(date1, date2) {
    return formatDate(date1) === formatDate(date2);
}

function isToday(date) {
    return isSameDate(date, new Date());
}

function getWeekDates(date) {
    const dates = [];
    const current = new Date(date);
    const dayOfWeek = current.getDay();

    // 월요일부터 시작하도록 조정
    const monday = new Date(current);
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    monday.setDate(current.getDate() + diff);

    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        dates.push(d);
    }
    return dates;
}

// ===== 데이터 관리 =====
function loadAppData() {
    const saved = localStorage.getItem('workoutAppData');
    if (saved) {
        return JSON.parse(saved);
    }
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
}

function saveAppData(data) {
    localStorage.setItem('workoutAppData', JSON.stringify(data));
}

function getAppData() {
    return loadAppData();
}

// ===== 운동 기록 관리 =====
function getDayPlan(data, date) {
    const dayName = DAY_NAMES[date.getDay()];
    return data.weeklyPlan[dayName];
}

function getRecord(data, date) {
    const dateKey = formatDate(date);
    return data.records[dateKey] || null;
}

function createEmptyRecord(exercises) {
    return {
        exercises: exercises.map(name => ({
            name: name,
            weight: '',
            sets: '',
            done: false
        }))
    };
}

function saveRecord(date, exerciseData) {
    const data = getAppData();
    const dateKey = formatDate(date);
    data.records[dateKey] = { exercises: exerciseData };
    saveAppData(data);
}

// ===== UI 렌더링 =====
function renderCalendar() {
    const calendarEl = document.getElementById('calendar');
    const weekDates = getWeekDates(APP_STATE.selectedDate);
    const data = getAppData();

    calendarEl.innerHTML = weekDates.map((date, index) => {
        const dayIndex = (index + 1) % 7; // 월요일부터 시작
        const dayLabel = DAY_LABELS[dayIndex === 0 ? 0 : dayIndex];
        const isSelected = isSameDate(date, APP_STATE.selectedDate);
        const isTodayDate = isToday(date);
        const record = getRecord(data, date);
        const plan = getDayPlan(data, date);

        // 완료 여부 체크
        let isCompleted = false;
        if (record && record.exercises.length > 0 && plan.exercises.length > 0) {
            isCompleted = record.exercises.every(ex => ex.done);
        }

        return `
            <button class="calendar-day ${isSelected ? 'selected' : ''} ${isTodayDate ? 'today' : ''} ${isCompleted ? 'completed' : ''}"
                    data-date="${formatDate(date)}">
                <span class="day-label">${dayLabel}</span>
                <span class="day-number">${date.getDate()}</span>
                ${isCompleted ? '<span class="check-mark">✓</span>' : ''}
            </button>
        `;
    }).join('');

    // 이벤트 리스너 추가
    calendarEl.querySelectorAll('.calendar-day').forEach(btn => {
        btn.addEventListener('click', () => {
            APP_STATE.selectedDate = new Date(btn.dataset.date);
            renderApp();
        });
    });
}

function renderHeader() {
    const headerEl = document.getElementById('header-title');
    const data = getAppData();
    const plan = getDayPlan(data, APP_STATE.selectedDate);
    const dateStr = formatDate(APP_STATE.selectedDate);
    const todayStr = isToday(APP_STATE.selectedDate) ? ' (오늘)' : '';

    headerEl.innerHTML = `
        <div class="header-date">${APP_STATE.selectedDate.getMonth() + 1}월 ${APP_STATE.selectedDate.getDate()}일${todayStr}</div>
        <div class="header-workout">💪 ${plan.name}</div>
    `;
}

function renderExerciseList() {
    const listEl = document.getElementById('exercise-list');
    const data = getAppData();
    const plan = getDayPlan(data, APP_STATE.selectedDate);
    const record = getRecord(data, APP_STATE.selectedDate);
    const isEditable = isToday(APP_STATE.selectedDate);

    if (plan.exercises.length === 0) {
        listEl.innerHTML = '<div class="rest-day">휴식일입니다 😴</div>';
        return;
    }

    // 기록이 있으면 사용, 없으면 빈 기록 생성
    const exercises = record ? record.exercises : createEmptyRecord(plan.exercises).exercises;

    listEl.innerHTML = exercises.map((ex, index) => `
        <li class="exercise-item ${ex.done ? 'done' : ''}">
            <input type="checkbox"
                   id="ex${index}"
                   class="exercise-check"
                   data-index="${index}"
                   ${ex.done ? 'checked' : ''}
                   ${!isEditable ? 'disabled' : ''}>
            <label for="ex${index}" class="exercise-name">${ex.name}</label>
            <div class="input-group">
                <input type="number"
                       class="weight-input"
                       placeholder="kg"
                       min="0"
                       step="0.5"
                       data-index="${index}"
                       data-field="weight"
                       value="${ex.weight}"
                       ${!isEditable ? 'disabled' : ''}>
                <input type="number"
                       class="sets-input"
                       placeholder="세트"
                       min="1"
                       max="20"
                       data-index="${index}"
                       data-field="sets"
                       value="${ex.sets}"
                       ${!isEditable ? 'disabled' : ''}>
            </div>
        </li>
    `).join('');

    // 이벤트 리스너 추가
    if (isEditable) {
        listEl.querySelectorAll('.exercise-check').forEach(checkbox => {
            checkbox.addEventListener('change', handleCheckChange);
        });

        listEl.querySelectorAll('.weight-input, .sets-input').forEach(input => {
            input.addEventListener('input', handleInputChange);
            input.addEventListener('blur', handleInputChange);
        });
    }
}

function renderProgress() {
    const data = getAppData();
    const plan = getDayPlan(data, APP_STATE.selectedDate);
    const record = getRecord(data, APP_STATE.selectedDate);

    const progressFill = document.getElementById('progress-fill');
    const progressPercent = document.getElementById('progress-percent');

    if (plan.exercises.length === 0) {
        progressFill.style.width = '0%';
        progressPercent.textContent = '휴식';
        return;
    }

    const exercises = record ? record.exercises : [];
    const total = plan.exercises.length;
    const checked = exercises.filter(ex => ex.done).length;
    const percent = Math.round((checked / total) * 100);

    progressFill.style.width = percent + '%';
    progressPercent.textContent = percent + '%';
}

function renderApp() {
    renderCalendar();
    renderHeader();
    renderExerciseList();
    renderProgress();
    updateSaveButton();
}

function updateSaveButton() {
    const saveBtn = document.getElementById('save-btn');
    const isEditable = isToday(APP_STATE.selectedDate);

    if (isEditable) {
        saveBtn.style.display = 'block';
        saveBtn.textContent = '기록 저장';
    } else {
        saveBtn.style.display = 'none';
    }
}

// ===== 이벤트 핸들러 =====
function handleCheckChange(e) {
    const index = parseInt(e.target.dataset.index);
    updateExerciseField(index, 'done', e.target.checked);
    renderProgress();

    // 완료 상태 변경시 스타일 업데이트
    const item = e.target.closest('.exercise-item');
    if (e.target.checked) {
        item.classList.add('done');
    } else {
        item.classList.remove('done');
    }
}

function handleInputChange(e) {
    const index = parseInt(e.target.dataset.index);
    const field = e.target.dataset.field;
    let value = e.target.value;

    // 음수 방지
    if (value < 0) {
        value = 0;
        e.target.value = 0;
    }

    updateExerciseField(index, field, value);
}

function updateExerciseField(index, field, value) {
    const data = getAppData();
    const plan = getDayPlan(data, APP_STATE.selectedDate);
    const dateKey = formatDate(APP_STATE.selectedDate);

    // 기록이 없으면 새로 생성
    if (!data.records[dateKey]) {
        data.records[dateKey] = createEmptyRecord(plan.exercises);
    }

    data.records[dateKey].exercises[index][field] = value;
    saveAppData(data);
}

function handleSave() {
    const data = getAppData();
    const dateKey = formatDate(APP_STATE.selectedDate);
    const plan = getDayPlan(data, APP_STATE.selectedDate);

    // 현재 화면의 데이터 수집
    const exercises = [];
    document.querySelectorAll('.exercise-item').forEach((item, index) => {
        const checkbox = item.querySelector('.exercise-check');
        const weightInput = item.querySelector('.weight-input');
        const setsInput = item.querySelector('.sets-input');
        const nameLabel = item.querySelector('.exercise-name');

        exercises.push({
            name: nameLabel.textContent,
            weight: weightInput.value,
            sets: setsInput.value,
            done: checkbox.checked
        });
    });

    data.records[dateKey] = { exercises };
    saveAppData(data);

    // 달력 업데이트 (완료 표시)
    renderCalendar();

    alert('기록이 저장되었습니다! 💪');
}

// ===== 설정 모달 =====
function openSettings() {
    document.getElementById('settings-modal').classList.add('open');
    renderSettingsList();
}

function closeSettings() {
    document.getElementById('settings-modal').classList.remove('open');
    APP_STATE.editingDay = null;
}

function renderSettingsList() {
    const listEl = document.getElementById('settings-days');
    const data = getAppData();

    const dayOrder = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const dayLabels = { mon: '월', tue: '화', wed: '수', thu: '목', fri: '금', sat: '토', sun: '일' };

    listEl.innerHTML = dayOrder.map(day => {
        const plan = data.weeklyPlan[day];
        return `
            <div class="settings-day-item" data-day="${day}">
                <span class="day-name">${dayLabels[day]}요일: ${plan.name}</span>
                <span class="exercise-count">${plan.exercises.length}개 운동</span>
                <button class="edit-day-btn" data-day="${day}">편집</button>
            </div>
        `;
    }).join('');

    // 편집 버튼 이벤트
    listEl.querySelectorAll('.edit-day-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            openDayEditor(btn.dataset.day);
        });
    });
}

function openDayEditor(day) {
    APP_STATE.editingDay = day;
    const data = getAppData();
    const plan = data.weeklyPlan[day];
    const dayLabels = { mon: '월', tue: '화', wed: '수', thu: '목', fri: '금', sat: '토', sun: '일' };

    document.getElementById('settings-list').style.display = 'none';
    document.getElementById('day-editor').style.display = 'block';
    document.getElementById('editor-title').textContent = `${dayLabels[day]}요일 운동 편집`;

    // 운동 부위 이름
    document.getElementById('workout-name-input').value = plan.name;

    renderExerciseEditor(plan.exercises);
}

function renderExerciseEditor(exercises) {
    const listEl = document.getElementById('editor-exercise-list');

    listEl.innerHTML = exercises.map((ex, index) => `
        <div class="editor-exercise-item" data-index="${index}">
            <input type="text" class="exercise-name-input" value="${ex}" placeholder="운동 이름">
            <button class="delete-exercise-btn" data-index="${index}">삭제</button>
        </div>
    `).join('');

    // 삭제 버튼 이벤트
    listEl.querySelectorAll('.delete-exercise-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            deleteExercise(parseInt(btn.dataset.index));
        });
    });
}

function addExercise() {
    const data = getAppData();
    const day = APP_STATE.editingDay;
    data.weeklyPlan[day].exercises.push('새 운동');
    saveAppData(data);
    renderExerciseEditor(data.weeklyPlan[day].exercises);
}

function deleteExercise(index) {
    const data = getAppData();
    const day = APP_STATE.editingDay;
    data.weeklyPlan[day].exercises.splice(index, 1);
    saveAppData(data);
    renderExerciseEditor(data.weeklyPlan[day].exercises);
}

function saveDaySettings() {
    const data = getAppData();
    const day = APP_STATE.editingDay;

    // 운동 부위 이름 저장
    data.weeklyPlan[day].name = document.getElementById('workout-name-input').value || '운동';

    // 운동 목록 저장
    const exercises = [];
    document.querySelectorAll('.exercise-name-input').forEach(input => {
        if (input.value.trim()) {
            exercises.push(input.value.trim());
        }
    });
    data.weeklyPlan[day].exercises = exercises;

    saveAppData(data);
    closeDayEditor();
    renderApp();
}

function closeDayEditor() {
    document.getElementById('settings-list').style.display = 'block';
    document.getElementById('day-editor').style.display = 'none';
    APP_STATE.editingDay = null;
    renderSettingsList();
}

// ===== 초기화 =====
function initApp() {
    // 저장 버튼
    document.getElementById('save-btn').addEventListener('click', handleSave);

    // 설정 버튼
    document.getElementById('settings-btn').addEventListener('click', openSettings);
    document.getElementById('close-settings').addEventListener('click', closeSettings);

    // 요일 편집 버튼들
    document.getElementById('add-exercise-btn').addEventListener('click', addExercise);
    document.getElementById('save-day-btn').addEventListener('click', saveDaySettings);
    document.getElementById('back-to-list').addEventListener('click', closeDayEditor);

    // 모달 외부 클릭시 닫기
    document.getElementById('settings-modal').addEventListener('click', (e) => {
        if (e.target.id === 'settings-modal') {
            closeSettings();
        }
    });

    // 앱 렌더링
    renderApp();
}

// 페이지 로드시 초기화
document.addEventListener('DOMContentLoaded', initApp);
