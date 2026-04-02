// ============================================
// Student Dashboard Logic
// Handles: view own attendance records + summary
// ============================================

document.addEventListener("DOMContentLoaded", () => {
  if (!redirectIfNotRole("student")) return;

  const user = getUser();
  document.getElementById("studentName").textContent = user.name;
  document.getElementById("studentEmail").textContent = user.email;

  // Set default filter to current month/year
  const now = new Date();
  document.getElementById("filterMonth").value = now.getMonth() + 1;
  document.getElementById("filterYear").value = now.getFullYear();

  // Load attendance data
  loadMyAttendance();
});

// ============================================
// Load Attendance Records
// ============================================
async function loadMyAttendance() {
  const container = document.getElementById("attendanceList");
  const month = document.getElementById("filterMonth").value;
  const year = document.getElementById("filterYear").value;

  // Show loading
  container.innerHTML = `
    <div class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>`;

  try {
    let url = `${API_BASE_URL}/student/attendance`;
    const params = new URLSearchParams();
    if (month) params.append("month", month);
    if (year) params.append("year", year);
    if (params.toString()) url += `?${params.toString()}`;

    const response = await fetch(url, { headers: authHeaders() });
    const data = await response.json();

    if (!data.success) throw new Error(data.message);

    const { records, summary } = data.data;

    // Update summary cards
    updateSummary(summary);

    if (records.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12 text-gray-400">
          <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p class="text-lg font-medium">No attendance records found</p>
          <p class="text-sm mt-1">Try adjusting the filters above</p>
        </div>`;
      return;
    }

    // Render attendance records
    container.innerHTML = `
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-200">
              <th class="text-left py-3 px-4 font-medium text-gray-500">Date</th>
              <th class="text-left py-3 px-4 font-medium text-gray-500">Status</th>
              <th class="text-left py-3 px-4 font-medium text-gray-500">Marked By</th>
            </tr>
          </thead>
          <tbody>
            ${records
              .map(
                (r) => `
              <tr class="border-b border-gray-100 hover:bg-gray-50">
                <td class="py-3 px-4 font-medium text-gray-800">${formatDate(r.date)}</td>
                <td class="py-3 px-4">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    r.status === "present"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }">
                    ${r.status === "present" ? "Present" : "Absent"}
                  </span>
                </td>
                <td class="py-3 px-4 text-gray-600">
                  ${r.teacher ? escapeHtml(r.teacher.name) : "Unknown"}
                  ${r.teacher && r.teacher.subject ? `<span class="text-gray-400 text-xs">(${escapeHtml(r.teacher.subject)})</span>` : ""}
                </td>
              </tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>`;
  } catch (error) {
    container.innerHTML = `
      <div class="text-center py-8 text-red-500">
        <p>Failed to load attendance: ${error.message}</p>
      </div>`;
  }
}

// ============================================
// Update Summary Cards
// ============================================
function updateSummary(summary) {
  document.getElementById("totalClasses").textContent = summary.totalClasses;
  document.getElementById("presentCount").textContent = summary.present;
  document.getElementById("absentCount").textContent = summary.absent;
  document.getElementById("percentage").textContent = `${summary.percentage}%`;

  // Color the percentage based on value
  const percentageEl = document.getElementById("percentage");
  const pct = parseFloat(summary.percentage);
  if (pct >= 75) {
    percentageEl.className = "text-3xl font-bold text-green-600 mt-1";
  } else if (pct >= 50) {
    percentageEl.className = "text-3xl font-bold text-yellow-600 mt-1";
  } else {
    percentageEl.className = "text-3xl font-bold text-red-600 mt-1";
  }
}

// ============================================
// Clear Filters
// ============================================
function clearFilters() {
  document.getElementById("filterMonth").value = "";
  document.getElementById("filterYear").value = "";
  loadMyAttendance();
}

// ============================================
// Utility: Escape HTML
// ============================================
function escapeHtml(text) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(text));
  return div.innerHTML;
}
