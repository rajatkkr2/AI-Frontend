// ============================================
// Admin Dashboard Logic
// Handles: view students/teachers, add teacher, delete users
// ============================================

// Run on page load
document.addEventListener("DOMContentLoaded", () => {
  // Check if user is admin, redirect if not
  if (!redirectIfNotRole("admin")) return;

  // Display admin name in the header
  const user = getUser();
  document.getElementById("adminName").textContent = user.name;

  // Load initial data
  loadStudents();
  loadTeachers();

  // Set up the "Add Teacher" form
  document.getElementById("addTeacherForm").addEventListener("submit", handleAddTeacher);
});

// ============================================
// Load and Display Students
// ============================================
async function loadStudents() {
  const container = document.getElementById("studentsList");
  const countEl = document.getElementById("studentsCount");

  // Show loading spinner
  container.innerHTML = `
    <div class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>`;

  try {
    const response = await fetch(`${API_BASE_URL}/admin/students`, {
      headers: authHeaders(),
    });
    const data = await response.json();

    if (!data.success) throw new Error(data.message);

    const students = data.data.students;
    countEl.textContent = students.length;

    if (students.length === 0) {
      container.innerHTML = `
        <div class="text-center py-8 text-gray-400">
          <p>No students registered yet.</p>
        </div>`;
      return;
    }

    // Build the table
    container.innerHTML = `
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-200">
              <th class="text-left py-3 px-4 font-medium text-gray-500">Name</th>
              <th class="text-left py-3 px-4 font-medium text-gray-500">Email</th>
              <th class="text-left py-3 px-4 font-medium text-gray-500">Joined</th>
              <th class="text-right py-3 px-4 font-medium text-gray-500">Action</th>
            </tr>
          </thead>
          <tbody id="studentsTableBody">
            ${students
              .map(
                (s) => `
              <tr class="border-b border-gray-100 hover:bg-gray-50">
                <td class="py-3 px-4 font-medium text-gray-800">${escapeHtml(s.name)}</td>
                <td class="py-3 px-4 text-gray-600">${escapeHtml(s.email)}</td>
                <td class="py-3 px-4 text-gray-500">${new Date(s.createdAt).toLocaleDateString()}</td>
                <td class="py-3 px-4 text-right">
                  <button onclick="deleteUser('${s._id}', '${escapeHtml(s.name)}', 'student')"
                    class="text-red-500 hover:text-red-700 text-sm font-medium transition">
                    Delete
                  </button>
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
        <p>Failed to load students: ${error.message}</p>
      </div>`;
  }
}

// ============================================
// Load and Display Teachers
// ============================================
async function loadTeachers() {
  const container = document.getElementById("teachersList");
  const countEl = document.getElementById("teachersCount");

  container.innerHTML = `
    <div class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>`;

  try {
    const response = await fetch(`${API_BASE_URL}/admin/teachers`, {
      headers: authHeaders(),
    });
    const data = await response.json();

    if (!data.success) throw new Error(data.message);

    const teachers = data.data.teachers;
    countEl.textContent = teachers.length;

    if (teachers.length === 0) {
      container.innerHTML = `
        <div class="text-center py-8 text-gray-400">
          <p>No teachers added yet.</p>
        </div>`;
      return;
    }

    container.innerHTML = `
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-200">
              <th class="text-left py-3 px-4 font-medium text-gray-500">Name</th>
              <th class="text-left py-3 px-4 font-medium text-gray-500">Email</th>
              <th class="text-left py-3 px-4 font-medium text-gray-500">Subject</th>
              <th class="text-right py-3 px-4 font-medium text-gray-500">Action</th>
            </tr>
          </thead>
          <tbody>
            ${teachers
              .map(
                (t) => `
              <tr class="border-b border-gray-100 hover:bg-gray-50">
                <td class="py-3 px-4 font-medium text-gray-800">${escapeHtml(t.name)}</td>
                <td class="py-3 px-4 text-gray-600">${escapeHtml(t.email)}</td>
                <td class="py-3 px-4 text-gray-500">${escapeHtml(t.subject || "N/A")}</td>
                <td class="py-3 px-4 text-right">
                  <button onclick="deleteUser('${t._id}', '${escapeHtml(t.name)}', 'teacher')"
                    class="text-red-500 hover:text-red-700 text-sm font-medium transition">
                    Delete
                  </button>
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
        <p>Failed to load teachers: ${error.message}</p>
      </div>`;
  }
}

// ============================================
// Add New Teacher
// ============================================
async function handleAddTeacher(e) {
  e.preventDefault();

  const name = document.getElementById("teacherName").value.trim();
  const email = document.getElementById("teacherEmail").value.trim();
  const password = document.getElementById("teacherPassword").value;
  const subject = document.getElementById("teacherSubject").value.trim();
  const btn = document.getElementById("addTeacherBtn");
  const errorDiv = document.getElementById("addTeacherError");

  errorDiv.classList.add("hidden");

  // Validate
  if (!name || !email || !password || !subject) {
    errorDiv.textContent = "All fields are required.";
    errorDiv.classList.remove("hidden");
    return;
  }

  if (password.length < 6) {
    errorDiv.textContent = "Password must be at least 6 characters.";
    errorDiv.classList.remove("hidden");
    return;
  }

  btn.disabled = true;
  btn.textContent = "Adding...";

  try {
    const response = await fetch(`${API_BASE_URL}/admin/teachers`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ name, email, password, subject }),
    });

    const data = await response.json();

    if (!data.success) throw new Error(data.message);

    // Clear form and reload teacher list
    document.getElementById("addTeacherForm").reset();
    showToast("Teacher added successfully!", "success");
    loadTeachers();

    // Close the modal
    toggleAddTeacherModal(false);
  } catch (error) {
    errorDiv.textContent = error.message;
    errorDiv.classList.remove("hidden");
  } finally {
    btn.disabled = false;
    btn.textContent = "Add Teacher";
  }
}

// ============================================
// Delete User (Student or Teacher)
// ============================================
async function deleteUser(id, name, role) {
  // Confirm before deleting
  if (!confirm(`Are you sure you want to delete ${role} "${name}"? This action cannot be undone.`)) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });

    const data = await response.json();

    if (!data.success) throw new Error(data.message);

    showToast(data.message, "success");

    // Reload the relevant list
    if (role === "student") loadStudents();
    else loadTeachers();
  } catch (error) {
    showToast(`Failed to delete: ${error.message}`, "error");
  }
}

// ============================================
// Modal Toggle
// ============================================
function toggleAddTeacherModal(show) {
  const modal = document.getElementById("addTeacherModal");
  if (show) {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  } else {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    document.getElementById("addTeacherForm").reset();
    document.getElementById("addTeacherError").classList.add("hidden");
  }
}

// ============================================
// Tab Switching
// ============================================
function switchTab(tab) {
  const studentsTab = document.getElementById("studentsTab");
  const teachersTab = document.getElementById("teachersTab");
  const studentsPanel = document.getElementById("studentsPanel");
  const teachersPanel = document.getElementById("teachersPanel");

  const activeClasses = "border-indigo-600 text-indigo-600";
  const inactiveClasses = "border-transparent text-gray-500 hover:text-gray-700";

  if (tab === "students") {
    studentsPanel.classList.remove("hidden");
    teachersPanel.classList.add("hidden");
    studentsTab.className = `pb-3 px-1 border-b-2 font-medium text-sm cursor-pointer ${activeClasses}`;
    teachersTab.className = `pb-3 px-1 border-b-2 font-medium text-sm cursor-pointer ${inactiveClasses}`;
  } else {
    studentsPanel.classList.add("hidden");
    teachersPanel.classList.remove("hidden");
    teachersTab.className = `pb-3 px-1 border-b-2 font-medium text-sm cursor-pointer ${activeClasses}`;
    studentsTab.className = `pb-3 px-1 border-b-2 font-medium text-sm cursor-pointer ${inactiveClasses}`;
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
