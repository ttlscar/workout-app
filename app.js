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
    const isEditable = true; // 모든 날짜 편집 가능

    if (plan.exercises.length === 0) {
        listEl.innerHTML = '<div class="rest-day">휴식일입니다 😴</div>';
        return;
    }

    // 새 계획 기반으로 운동 목록 재구성 (기존 기록 데이터 유지)
    let exercises;
    if (record) {
        exercises = plan.exercises.map(exerciseName => {
            const existingRecord = record.exercises.find(ex => ex.name === exerciseName);
            return existingRecord || { name: exerciseName, weight: '', sets: '', done: false };
        });
    } else {
        exercises = createEmptyRecord(plan.exercises).exercises;
    }

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
    updateWeekLabel();
}

// ===== 주간 네비게이션 =====
function goToPrevWeek() {
    const newDate = new Date(APP_STATE.selectedDate);
    newDate.setDate(newDate.getDate() - 7);
    APP_STATE.selectedDate = newDate;
    renderApp();
}

function goToNextWeek() {
    const newDate = new Date(APP_STATE.selectedDate);
    newDate.setDate(newDate.getDate() + 7);
    APP_STATE.selectedDate = newDate;
    renderApp();
}

function updateWeekLabel() {
    const weekLabel = document.getElementById('week-label');
    const today = new Date();
    const selectedWeekStart = getWeekDates(APP_STATE.selectedDate)[0];
    const thisWeekStart = getWeekDates(today)[0];

    const diffWeeks = Math.round((selectedWeekStart - thisWeekStart) / (7 * 24 * 60 * 60 * 1000));

    if (diffWeeks === 0) {
        weekLabel.textContent = '이번 주';
    } else if (diffWeeks === -1) {
        weekLabel.textContent = '지난 주';
    } else if (diffWeeks === 1) {
        weekLabel.textContent = '다음 주';
    } else if (diffWeeks < 0) {
        weekLabel.textContent = `${Math.abs(diffWeeks)}주 전`;
    } else {
        weekLabel.textContent = `${diffWeeks}주 후`;
    }
}

function updateSaveButton() {
    const saveBtn = document.getElementById('save-btn');
    const data = getAppData();
    const plan = getDayPlan(data, APP_STATE.selectedDate);

    // 휴식일이 아니면 저장 버튼 표시
    if (plan.exercises.length > 0) {
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

// ===== 기록 조회 기능 =====
function openHistory() {
    document.getElementById('history-modal').classList.add('open');
    // 기본값: 최근 7일
    setQuickRange(7);
}

function closeHistory() {
    document.getElementById('history-modal').classList.remove('open');
}

function setQuickRange(days) {
    const endDate = new Date();
    let startDate = new Date();

    if (days === 'month') {
        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
    } else {
        startDate.setDate(endDate.getDate() - days + 1);
    }

    document.getElementById('history-start-date').value = formatDate(startDate);
    document.getElementById('history-end-date').value = formatDate(endDate);

    // 버튼 활성화 상태
    document.querySelectorAll('.quick-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.days === String(days)) {
            btn.classList.add('active');
        }
    });

    searchHistory();
}

function searchHistory() {
    const startDate = new Date(document.getElementById('history-start-date').value);
    const endDate = new Date(document.getElementById('history-end-date').value);

    const records = getRecordsInRange(startDate, endDate);
    renderHistorySummary(records);
    renderHistoryList(records);
}

function getRecordsInRange(startDate, endDate) {
    const data = getAppData();
    const records = [];

    const current = new Date(startDate);
    while (current <= endDate) {
        const dateKey = formatDate(current);
        const record = data.records[dateKey];
        const plan = getDayPlan(data, current);

        if (record || plan.exercises.length > 0) {
            records.push({
                date: new Date(current),
                dateKey: dateKey,
                record: record,
                plan: plan
            });
        }
        current.setDate(current.getDate() + 1);
    }

    return records.reverse(); // 최신순
}

function renderHistorySummary(records) {
    const summaryEl = document.getElementById('history-summary');

    const workoutDays = records.filter(r => r.record && r.record.exercises.some(ex => ex.done)).length;
    const totalDays = records.filter(r => r.plan.exercises.length > 0).length;

    let totalCompletion = 0;
    let completedCount = 0;

    records.forEach(r => {
        if (r.record && r.plan.exercises.length > 0) {
            const done = r.record.exercises.filter(ex => ex.done).length;
            totalCompletion += (done / r.plan.exercises.length) * 100;
            completedCount++;
        }
    });

    const avgCompletion = completedCount > 0 ? Math.round(totalCompletion / completedCount) : 0;

    summaryEl.innerHTML = `
        <div class="summary-item">
            <span class="summary-value">${workoutDays}/${totalDays}</span>
            <span class="summary-label">운동한 날</span>
        </div>
        <div class="summary-item">
            <span class="summary-value">${avgCompletion}%</span>
            <span class="summary-label">평균 완료율</span>
        </div>
    `;
}

function renderHistoryList(records) {
    const listEl = document.getElementById('history-list');

    if (records.length === 0) {
        listEl.innerHTML = '<div class="no-records">기록이 없습니다</div>';
        return;
    }

    listEl.innerHTML = records.map(r => renderHistoryItem(r)).join('');

    // 펼치기/접기 이벤트
    listEl.querySelectorAll('.history-card').forEach(card => {
        card.addEventListener('click', () => {
            card.classList.toggle('expanded');
        });
    });
}

function renderHistoryItem(item) {
    const { date, record, plan } = item;

    if (plan.exercises.length === 0) {
        return `
            <div class="history-card rest">
                <div class="history-header">
                    <span class="history-date">${date.getMonth() + 1}/${date.getDate()} (${DAY_LABELS[date.getDay()]})</span>
                    <span class="history-type">휴식일</span>
                </div>
            </div>
        `;
    }

    const exercises = record ? record.exercises : [];
    const done = exercises.filter(ex => ex.done).length;
    const total = plan.exercises.length;
    const percent = Math.round((done / total) * 100);

    const exerciseDetails = plan.exercises.map(exName => {
        const exRecord = record ? record.exercises.find(e => e.name === exName) : null;
        const isDone = exRecord ? exRecord.done : false;
        const weight = exRecord && exRecord.weight ? `${exRecord.weight}kg` : '-';
        const sets = exRecord && exRecord.sets ? `${exRecord.sets}세트` : '-';

        return `
            <div class="history-exercise ${isDone ? 'done' : ''}">
                <span class="ex-name">${isDone ? '✓' : '○'} ${exName}</span>
                <span class="ex-detail">${weight} / ${sets}</span>
            </div>
        `;
    }).join('');

    return `
        <div class="history-card ${percent === 100 ? 'complete' : ''}">
            <div class="history-header">
                <span class="history-date">${date.getMonth() + 1}/${date.getDate()} (${DAY_LABELS[date.getDay()]})</span>
                <span class="history-type">${plan.name}</span>
                <span class="history-progress">${percent}%</span>
            </div>
            <div class="history-progress-bar">
                <div class="history-progress-fill" style="width: ${percent}%"></div>
            </div>
            <div class="history-details">
                ${exerciseDetails}
            </div>
        </div>
    `;
}

// ===== 통계 기능 =====
let currentStatsTab = 'week';

function openStats() {
    document.getElementById('stats-modal').classList.add('open');
    currentStatsTab = 'week';
    updateStatsTabs();
    renderStats('week');
}

function closeStats() {
    document.getElementById('stats-modal').classList.remove('open');
}

function updateStatsTabs() {
    document.querySelectorAll('.stats-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.tab === currentStatsTab) {
            tab.classList.add('active');
        }
    });
}

function switchStatsTab(tab) {
    currentStatsTab = tab;
    updateStatsTabs();

    if (tab === 'compare') {
        renderCompareView();
    } else {
        renderStats(tab);
    }
}

function getWeekStats(startDate) {
    const data = getAppData();
    const stats = {
        completionRate: 0,
        workoutDays: 0,
        plannedDays: 0,
        completedExercises: 0,
        totalSets: 0,
        totalWeight: 0
    };

    const weekDates = [];
    const current = new Date(startDate);
    for (let i = 0; i < 7; i++) {
        weekDates.push(new Date(current));
        current.setDate(current.getDate() + 1);
    }

    let totalPercent = 0;

    weekDates.forEach(date => {
        const plan = getDayPlan(data, date);
        const record = getRecord(data, date);

        if (plan.exercises.length > 0) {
            stats.plannedDays++;

            if (record) {
                const doneExercises = record.exercises.filter(ex => ex.done);
                const percent = (doneExercises.length / plan.exercises.length) * 100;
                totalPercent += percent;

                if (doneExercises.length > 0) {
                    stats.workoutDays++;
                }

                stats.completedExercises += doneExercises.length;

                record.exercises.forEach(ex => {
                    if (ex.done) {
                        stats.totalSets += parseInt(ex.sets) || 0;
                        stats.totalWeight += parseFloat(ex.weight) || 0;
                    }
                });
            }
        }
    });

    stats.completionRate = stats.plannedDays > 0 ? Math.round(totalPercent / stats.plannedDays) : 0;

    return stats;
}

function getMonthStats(year, month) {
    const data = getAppData();
    const stats = {
        completionRate: 0,
        workoutDays: 0,
        plannedDays: 0,
        completedExercises: 0,
        totalSets: 0,
        totalWeight: 0
    };

    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    let totalPercent = 0;

    const current = new Date(startDate);
    while (current <= endDate) {
        const plan = getDayPlan(data, current);
        const record = getRecord(data, current);

        if (plan.exercises.length > 0) {
            stats.plannedDays++;

            if (record) {
                const doneExercises = record.exercises.filter(ex => ex.done);
                const percent = (doneExercises.length / plan.exercises.length) * 100;
                totalPercent += percent;

                if (doneExercises.length > 0) {
                    stats.workoutDays++;
                }

                stats.completedExercises += doneExercises.length;

                record.exercises.forEach(ex => {
                    if (ex.done) {
                        stats.totalSets += parseInt(ex.sets) || 0;
                        stats.totalWeight += parseFloat(ex.weight) || 0;
                    }
                });
            }
        }
        current.setDate(current.getDate() + 1);
    }

    stats.completionRate = stats.plannedDays > 0 ? Math.round(totalPercent / stats.plannedDays) : 0;

    return stats;
}

function renderStats(period) {
    const contentEl = document.getElementById('stats-content');
    let stats, title;

    if (period === 'week') {
        const weekStart = getWeekDates(new Date())[0];
        stats = getWeekStats(weekStart);
        title = '이번 주 통계';
    } else {
        const now = new Date();
        stats = getMonthStats(now.getFullYear(), now.getMonth());
        title = `${now.getMonth() + 1}월 통계`;
    }

    contentEl.innerHTML = `
        <h3 class="stats-title">${title}</h3>
        <div class="stats-grid">
            <div class="stat-card primary">
                <span class="stat-value">${stats.completionRate}%</span>
                <span class="stat-label">완료율</span>
            </div>
            <div class="stat-card">
                <span class="stat-value">${stats.workoutDays}/${stats.plannedDays}</span>
                <span class="stat-label">운동일</span>
            </div>
            <div class="stat-card">
                <span class="stat-value">${stats.completedExercises}</span>
                <span class="stat-label">완료 운동</span>
            </div>
            <div class="stat-card">
                <span class="stat-value">${stats.totalSets}</span>
                <span class="stat-label">총 세트</span>
            </div>
            <div class="stat-card wide">
                <span class="stat-value">${stats.totalWeight.toLocaleString()} kg</span>
                <span class="stat-label">총 무게</span>
            </div>
        </div>
    `;
}

function renderCompareView() {
    const contentEl = document.getElementById('stats-content');

    contentEl.innerHTML = `
        <div class="compare-selector">
            <button class="compare-btn active" data-type="week">주간 비교</button>
            <button class="compare-btn" data-type="month">월간 비교</button>
        </div>
        <div id="compare-content">
            <!-- JS로 렌더링 -->
        </div>
    `;

    // 버튼 이벤트
    contentEl.querySelectorAll('.compare-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            contentEl.querySelectorAll('.compare-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderCompareCards(btn.dataset.type);
        });
    });

    renderCompareCards('week');
}

function renderCompareCards(type) {
    const compareEl = document.getElementById('compare-content');
    let current, previous, currentLabel, previousLabel;

    if (type === 'week') {
        const thisWeekStart = getWeekDates(new Date())[0];
        const lastWeekStart = new Date(thisWeekStart);
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);

        current = getWeekStats(thisWeekStart);
        previous = getWeekStats(lastWeekStart);
        currentLabel = '이번 주';
        previousLabel = '지난 주';
    } else {
        const now = new Date();
        current = getMonthStats(now.getFullYear(), now.getMonth());

        const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        const lastYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        previous = getMonthStats(lastYear, lastMonth);

        currentLabel = `${now.getMonth() + 1}월`;
        previousLabel = `${lastMonth + 1}월`;
    }

    const renderDiff = (curr, prev) => {
        const diff = curr - prev;
        if (diff > 0) return `<span class="diff positive">+${diff}</span>`;
        if (diff < 0) return `<span class="diff negative">${diff}</span>`;
        return `<span class="diff">-</span>`;
    };

    const renderPercentDiff = (curr, prev) => {
        const diff = curr - prev;
        if (diff > 0) return `<span class="diff positive">+${diff}%</span>`;
        if (diff < 0) return `<span class="diff negative">${diff}%</span>`;
        return `<span class="diff">-</span>`;
    };

    compareEl.innerHTML = `
        <div class="compare-table">
            <div class="compare-row header">
                <span></span>
                <span>${previousLabel}</span>
                <span>${currentLabel}</span>
                <span>변화</span>
            </div>
            <div class="compare-row">
                <span>완료율</span>
                <span>${previous.completionRate}%</span>
                <span>${current.completionRate}%</span>
                ${renderPercentDiff(current.completionRate, previous.completionRate)}
            </div>
            <div class="compare-row">
                <span>운동일</span>
                <span>${previous.workoutDays}</span>
                <span>${current.workoutDays}</span>
                ${renderDiff(current.workoutDays, previous.workoutDays)}
            </div>
            <div class="compare-row">
                <span>완료 운동</span>
                <span>${previous.completedExercises}</span>
                <span>${current.completedExercises}</span>
                ${renderDiff(current.completedExercises, previous.completedExercises)}
            </div>
            <div class="compare-row">
                <span>총 세트</span>
                <span>${previous.totalSets}</span>
                <span>${current.totalSets}</span>
                ${renderDiff(current.totalSets, previous.totalSets)}
            </div>
            <div class="compare-row">
                <span>총 무게</span>
                <span>${previous.totalWeight}kg</span>
                <span>${current.totalWeight}kg</span>
                ${renderDiff(current.totalWeight, previous.totalWeight)}
            </div>
        </div>
    `;
}

// ===== 초기화 =====
function initApp() {
    // 저장 버튼
    document.getElementById('save-btn').addEventListener('click', handleSave);

    // 주간 네비게이션 버튼
    document.getElementById('prev-week-btn').addEventListener('click', goToPrevWeek);
    document.getElementById('next-week-btn').addEventListener('click', goToNextWeek);

    // 설정 버튼
    document.getElementById('settings-btn').addEventListener('click', openSettings);
    document.getElementById('close-settings').addEventListener('click', closeSettings);

    // 기록 조회 버튼
    document.getElementById('history-btn').addEventListener('click', openHistory);
    document.getElementById('close-history').addEventListener('click', closeHistory);

    // 날짜 변경 이벤트
    document.getElementById('history-start-date').addEventListener('change', searchHistory);
    document.getElementById('history-end-date').addEventListener('change', searchHistory);

    // 빠른 선택 버튼
    document.querySelectorAll('.quick-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const days = btn.dataset.days === 'month' ? 'month' : parseInt(btn.dataset.days);
            setQuickRange(days);
        });
    });

    // 통계 버튼
    document.getElementById('stats-btn').addEventListener('click', openStats);
    document.getElementById('close-stats').addEventListener('click', closeStats);

    // 통계 탭 이벤트
    document.querySelectorAll('.stats-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            switchStatsTab(tab.dataset.tab);
        });
    });

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

    document.getElementById('history-modal').addEventListener('click', (e) => {
        if (e.target.id === 'history-modal') {
            closeHistory();
        }
    });

    document.getElementById('stats-modal').addEventListener('click', (e) => {
        if (e.target.id === 'stats-modal') {
            closeStats();
        }
    });

    // 앱 렌더링
    renderApp();
}

// 페이지 로드시 초기화
document.addEventListener('DOMContentLoaded', initApp);
