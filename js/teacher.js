// ============================================
// Teacher Dashboard Logic
// Handles: mark attendance, view attendance records
// ============================================

// Store students list for reuse
let allStudents = [];

document.addEventListener("DOMContentLoaded", () => {
  if (!redirectIfNotRole("teacher")) return;

  const user = getUser();
  document.getElementById("teacherName").textContent = user.name;
  document.getElementById("teacherSubject").textContent = user.subject || "N/A";

  // Set today's date as default for the date picker
  document.getElementById("attendanceDate").value = getTodayDate();

  // Load data
  loadStudentsForAttendance();
  loadAttendanceRecords();
});

/**
 * getTodayDate - Returns today's date in YYYY-MM-DD format
 */
function getTodayDate() {
  const today = new Date();
  return today.toISOString().split("T")[0];
}

// ============================================
// Load Students for the Attendance Form
// ============================================
async function loadStudentsForAttendance() {
  const container = document.getElementById("attendanceForm");

  try {
    const response = await fetch(`${API_BASE_URL}/teacher/students`, {
      headers: authHeaders(),
    });
    const data = await response.json();

    if (!data.success) throw new Error(data.message);

    allStudents = data.data.students;

    if (allStudents.length === 0) {
      container.innerHTML = `
        <div class="text-center py-8 text-gray-400">
          <p>No students registered in the system yet.</p>
        </div>`;
      return;
    }

    renderAttendanceForm();
  } catch (error) {
    container.innerHTML = `
      <div class="text-center py-8 text-red-500">
        <p>Failed to load students: ${error.message}</p>
      </div>`;
  }
}

/**
 * renderAttendanceForm - Builds the attendance marking form with all students
 */
function renderAttendanceForm() {
  const container = document.getElementById("studentCheckboxes");

  container.innerHTML = allStudents
    .map(
      (s, index) => `
      <div class="flex items-center justify-between py-3 px-4 ${index % 2 === 0 ? "bg-gray-50" : "bg-white"} rounded-lg">
        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-sm font-medium text-indigo-600">
            ${s.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p class="font-medium text-gray-800 text-sm">${escapeHtml(s.name)}</p>
            <p class="text-xs text-gray-500">${escapeHtml(s.email)}</p>
          </div>
        </div>
        <div class="flex items-center space-x-4">
          <label class="flex items-center space-x-1 cursor-pointer">
            <input type="radio" name="attendance_${s._id}" value="present" checked
              class="text-green-600 focus:ring-green-500" />
            <span class="text-sm text-green-600 font-medium">Present</span>
          </label>
          <label class="flex items-center space-x-1 cursor-pointer">
            <input type="radio" name="attendance_${s._id}" value="absent"
              class="text-red-600 focus:ring-red-500" />
            <span class="text-sm text-red-600 font-medium">Absent</span>
          </label>
        </div>
      </div>`
    )
    .join("");
}

// ============================================
// Mark All Present / Absent
// ============================================
function markAll(status) {
  allStudents.forEach((s) => {
    const radio = document.querySelector(`input[name="attendance_${s._id}"][value="${status}"]`);
    if (radio) radio.checked = true;
  });
}

// ============================================
// Submit Attendance
// ============================================
async function submitAttendance() {
  const date = document.getElementById("attendanceDate").value;
  const btn = document.getElementById("submitAttendanceBtn");

  if (!date) {
    showToast("Please select a date.", "error");
    return;
  }

  if (allStudents.length === 0) {
    showToast("No students to mark attendance for.", "error");
    return;
  }

  // Collect attendance status for each student
  const records = allStudents.map((s) => {
    const selected = document.querySelector(`input[name="attendance_${s._id}"]:checked`);
    return {
      studentId: s._id,
      status: selected ? selected.value : "present",
    };
  });

  btn.disabled = true;
  btn.textContent = "Submitting...";

  try {
    const response = await fetch(`${API_BASE_URL}/teacher/attendance`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ date, records }),
    });

    const data = await response.json();

    if (!data.success) throw new Error(data.message);

    showToast(data.message, "success");

    // Refresh attendance records view
    loadAttendanceRecords();
  } catch (error) {
    showToast(`Failed: ${error.message}`, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Submit Attendance";
  }
}

// ============================================
// Load Attendance Records (View Tab)
// ============================================
async function loadAttendanceRecords() {
  const container = document.getElementById("recordsList");
  const filterDate = document.getElementById("filterDate").value;

  container.innerHTML = `
    <div class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>`;

  try {
    let url = `${API_BASE_URL}/teacher/attendance`;
    if (filterDate) url += `?date=${filterDate}`;

    const response = await fetch(url, { headers: authHeaders() });
    const data = await response.json();

    if (!data.success) throw new Error(data.message);

    const records = data.data.records;

    if (records.length === 0) {
      container.innerHTML = `
        <div class="text-center py-8 text-gray-400">
          <p>No attendance records found.</p>
        </div>`;
      return;
    }

    // Group records by date for better display
    const grouped = {};
    records.forEach((r) => {
      if (!grouped[r.date]) grouped[r.date] = [];
      grouped[r.date].push(r);
    });

    let html = "";
    for (const [date, dateRecords] of Object.entries(grouped)) {
      const presentCount = dateRecords.filter((r) => r.status === "present").length;
      const absentCount = dateRecords.filter((r) => r.status === "absent").length;

      html += `
        <div class="mb-6">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-semibold text-gray-800">${formatDate(date)}</h3>
            <div class="flex space-x-3 text-sm">
              <span class="text-green-600">${presentCount} Present</span>
              <span class="text-red-600">${absentCount} Absent</span>
            </div>
          </div>
          <div class="space-y-2">
            ${dateRecords
              .map(
                (r) => `
              <div class="flex items-center justify-between py-2 px-4 bg-gray-50 rounded-lg">
                <span class="text-sm font-medium text-gray-700">${r.student ? escapeHtml(r.student.name) : "Unknown"}</span>
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  r.status === "present"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }">
                  ${r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                </span>
              </div>`
              )
              .join("")}
          </div>
        </div>`;
    }

    container.innerHTML = html;
  } catch (error) {
    container.innerHTML = `
      <div class="text-center py-8 text-red-500">
        <p>Failed to load records: ${error.message}</p>
      </div>`;
  }
}

// ============================================
// Tab Switching
// ============================================
function switchTeacherTab(tab) {
  const markTab = document.getElementById("markTab");
  const viewTab = document.getElementById("viewTab");
  const markPanel = document.getElementById("markPanel");
  const viewPanel = document.getElementById("viewPanel");

  const activeClasses = "border-indigo-600 text-indigo-600";
  const inactiveClasses = "border-transparent text-gray-500 hover:text-gray-700";

  if (tab === "mark") {
    markPanel.classList.remove("hidden");
    viewPanel.classList.add("hidden");
    markTab.className = `pb-3 px-1 border-b-2 font-medium text-sm cursor-pointer ${activeClasses}`;
    viewTab.className = `pb-3 px-1 border-b-2 font-medium text-sm cursor-pointer ${inactiveClasses}`;
  } else {
    markPanel.classList.add("hidden");
    viewPanel.classList.remove("hidden");
    viewTab.className = `pb-3 px-1 border-b-2 font-medium text-sm cursor-pointer ${activeClasses}`;
    markTab.className = `pb-3 px-1 border-b-2 font-medium text-sm cursor-pointer ${inactiveClasses}`;
    loadAttendanceRecords();
  }
}

// ============================================
// Utility: Escape HTML to prevent XSS
// ============================================
function escapeHtml(text) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(text));
  return div.innerHTML;
}
