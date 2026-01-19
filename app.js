// ===== 요소 가져오기 =====
const checkboxes = document.querySelectorAll('.exercise-check');
const weightInputs = document.querySelectorAll('.weight-input');
const saveBtn = document.getElementById('save-btn');
const progressFill = document.getElementById('progress-fill');
const progressPercent = document.getElementById('progress-percent');

// ===== 진행률 업데이트 함수 =====
function updateProgress() {
    // 체크된 개수 세기
    const total = checkboxes.length;
    let checked = 0;

    checkboxes.forEach(function(checkbox) {
        if (checkbox.checked) {
            checked = checked + 1;
        }
    });

    // 퍼센트 계산
    const percent = Math.round((checked / total) * 100);

    // 화면에 반영
    progressFill.style.width = percent + '%';
    progressPercent.textContent = percent + '%';
}

// ===== 데이터 저장 함수 =====
function saveData() {
    const data = [];

    // 각 운동의 체크 상태와 무게 저장
    checkboxes.forEach(function(checkbox, index) {
        data.push({
            checked: checkbox.checked,
            weight: weightInputs[index].value
        });
    });

    // localStorage에 저장 (브라우저에 저장됨)
    localStorage.setItem('workoutData', JSON.stringify(data));

    // 저장 완료 알림
    alert('기록이 저장되었습니다! 💪');
}

// ===== 저장된 데이터 불러오기 =====
function loadData() {
    const saved = localStorage.getItem('workoutData');

    // 저장된 데이터가 있으면
    if (saved) {
        const data = JSON.parse(saved);

        // 각 운동에 적용
        data.forEach(function(item, index) {
            if (checkboxes[index]) {
                checkboxes[index].checked = item.checked;
            }
            if (weightInputs[index]) {
                weightInputs[index].value = item.weight;
            }
        });

        // 진행률 업데이트
        updateProgress();
    }
}

// ===== 이벤트 연결 =====

// 체크박스 클릭할 때마다 진행률 업데이트
checkboxes.forEach(function(checkbox) {
    checkbox.addEventListener('change', updateProgress);
});

// 저장 버튼 클릭
saveBtn.addEventListener('click', saveData);

// ===== 페이지 로드시 실행 =====
loadData();
