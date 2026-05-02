"use strict";


const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

const POSITIONS = {
  Junior:    { rate: 1.2 },
  Middle:    { rate: 1.5 },
  Senior:    { rate: 2.0 },
  Lead:      { rate: 2.5 },
  Architect: { rate: 3.0 },
  BO:        { rate: 1.0 },
};

const WORKING_DAYS   = 22;   
const CALENDAR_DAYS  = 30;   
const DEFAULT_CAP    = +(WORKING_DAYS / CALENDAR_DAYS).toFixed(2); // ~0.73

const STORAGE_KEY = "outsource_dashboard_v3";


let state = {
  currentMonth: new Date().getMonth(),
  currentYear:  new Date().getFullYear(),
  sort: { table: null, key: null, dir: "asc" },
  // id проекта, открытого в detail-modal
  detailProjectId: null,
};


function getAllData() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); }
  catch { return {}; }
}
function saveAllData(d) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }
function getMonthKey(y, m) { return `${y}_${m}`; }
function getMonthData(y, m) {
  return getAllData()[getMonthKey(y, m)] || { projects: [], employees: [] };
}
function saveMonthData(y, m, d) {
  const all = getAllData();
  all[getMonthKey(y, m)] = d;
  saveAllData(all);
}


function generateId() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }

function escapeHtml(s) {
  return String(s)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function calcAge(dob) {
  const b = new Date(dob), t = new Date();
  let a = t.getFullYear() - b.getFullYear();
  const dm = t.getMonth() - b.getMonth();
  if (dm < 0 || (dm === 0 && t.getDate() < b.getDate())) a--;
  return a;
}

function fmt(n) {
  const rounded = Math.round(n * 100) / 100;
  return "$" + rounded.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}


function initSidebar() {
  const mSel = document.getElementById("monthSelect");
  const ySel = document.getElementById("yearSelect");

  
  MONTHS.forEach((name, i) => {
    const opt = new Option(name, i);
    if (i === state.currentMonth) opt.selected = true;
    mSel.appendChild(opt);
  });
  mSel.addEventListener("change", () => {
    state.currentMonth = +mSel.value;
    renderAll();
  });

  
  const curY = new Date().getFullYear();
  for (let y = curY - 1; y <= curY + 1; y++) {
    const opt = new Option(y, y);
    if (y === state.currentYear) opt.selected = true;
    ySel.appendChild(opt);
  }
  ySel.addEventListener("change", () => {
    state.currentYear = +ySel.value;
    renderAll();
  });

 
  const toggle   = document.getElementById("sidebarToggle");
  const sidebar  = document.getElementById("sidebar");
  const backdrop = document.getElementById("sidebarBackdrop");

  toggle.addEventListener("click", () => {
    const isOpen = sidebar.classList.toggle("open");
    backdrop.classList.toggle("active", isOpen);
  });

  // Клик на backdrop — закрыть
  backdrop.addEventListener("click", () => closeSidebar());
}


function closeSidebar() {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("sidebarBackdrop").classList.remove("active");
}

function sortBy(table, key) {
  if (state.sort.table === table && state.sort.key === key) {
    state.sort.dir = state.sort.dir === "asc" ? "desc" : "asc";
  } else {
    state.sort = { table, key, dir: "asc" };
  }
  renderAll();
}

function applySort(arr, table) {
  if (state.sort.table !== table || !state.sort.key) return arr;
  const { key, dir } = state.sort;
  return [...arr].sort((a, b) => {
    let va = a[key], vb = b[key];
    if (typeof va === "number" && typeof vb === "number")
      return dir === "asc" ? va - vb : vb - va;
    va = String(va || "").toLowerCase();
    vb = String(vb || "").toLowerCase();
    return dir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
  });
}

function updateSortIcons(tableId, colKeys) {
  const tbl = document.getElementById(tableId);
  if (!tbl) return;
  tbl.querySelectorAll("thead tr:first-child .sort-icon").forEach((icon, i) => {
    icon.className = "sort-icon";
    const tname = tableId === "projectsTable" ? "projects" : "employees";
    if (state.sort.table === tname && state.sort.key === colKeys[i])
      icon.classList.add(state.sort.dir);
  });
}


function toggleSearch(event, inputId) {
  event.stopPropagation();
  const input = document.getElementById(inputId);
  if (!input) return;
  const row = input.closest("tr");
  const visible = row.classList.toggle("visible");
  if (!visible) { input.value = ""; renderAll(); }
  else input.focus();
}

function getSearch(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim().toLowerCase() : "";
}



function calcEmpMetrics(emp) {
  const rate      = POSITIONS[emp.position]?.rate || 1;
  const capacity  = emp.capacity  !== undefined ? emp.capacity  : DEFAULT_CAP;
  const vacation  = emp.vacation  !== undefined ? emp.vacation  : 0;
  const effective = Math.max(0, capacity - vacation);
  const revenue   = emp.salary * rate * effective;
  const cost      = emp.salary * effective;
  const profit    = revenue - cost;
  return { rate, capacity, vacation, effective, revenue, cost, profit };
}


function renderProjects() {
  const tbody = document.getElementById("projectsBody");
  const { projects, employees } = getMonthData(state.currentYear, state.currentMonth);

  const sc = getSearch("pCompany");
  const sn = getSearch("pName");

  let rows = projects.map(p => {
    const emps = employees.filter(e => e.projectId === p.id);
    // Estimated income = сумма revenue всех сотрудников проекта
    const income = emps.reduce((s, e) => s + calcEmpMetrics(e).revenue, 0);
    return { ...p, _emps: emps, income };
  });

  if (sc) rows = rows.filter(p => p.company.toLowerCase().includes(sc));
  if (sn) rows = rows.filter(p => p.name.toLowerCase().includes(sn));
  rows = applySort(rows, "projects");

  updateSortIcons("projectsTable",
    ["company","name","budget","capacity",null,"income",null]);

  tbody.innerHTML = "";

  if (rows.length === 0) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="7">
      ${projects.length === 0
        ? 'No projects yet. Click "+ Add Project" to add one.'
        : 'No projects match your search.'}</td></tr>`;
    return;
  }

  rows.forEach(p => {
    const incomeClass = p.income >= p.budget ? "income-positive" : "";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(p.company)}</td>
      <td>
        <button class="project-link" onclick="openProjectDetail('${p.id}')">
          ${escapeHtml(p.name)}
        </button>
      </td>
      <td>${fmt(p.budget)}</td>
      <td>${p.capacity}</td>
      <td>${p._emps.length} / ${p.capacity}</td>
      <td class="${incomeClass}">${fmt(p.income)}</td>
      <td>
        <button class="btn btn-danger btn-sm" onclick="deleteProject('${p.id}')">Delete</button>
      </td>`;
    tbody.appendChild(tr);
  });
}


function renderEmployees() {
  const tbody = document.getElementById("employeesBody");
  const { projects, employees } = getMonthData(state.currentYear, state.currentMonth);

  const sN = getSearch("eName");
  const sS = getSearch("eSurname");
  const sP = getSearch("ePosition");
  const sPr= getSearch("eProject");

  let rows = employees.map(emp => {
    const m = calcEmpMetrics(emp);
    const age     = calcAge(emp.dob);
    const project = projects.find(p => p.id === emp.projectId);
    return { ...emp, ...m, age, _project: project };
  });

  if (sN)  rows = rows.filter(e => e.name.toLowerCase().includes(sN));
  if (sS)  rows = rows.filter(e => e.surname.toLowerCase().includes(sS));
  if (sP)  rows = rows.filter(e => e.position.toLowerCase().includes(sP));
  if (sPr) rows = rows.filter(e => (e._project?.name || "").toLowerCase().includes(sPr));

  rows = applySort(rows, "employees");
  updateSortIcons("employeesTable",
    ["name","surname","age","position","salary","payment","project","income",null]);

  tbody.innerHTML = "";

  if (rows.length === 0) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="9">
      ${employees.length === 0
        ? 'No employees yet. Click "+ Add Employee" to add one.'
        : 'No employees match your search.'}</td></tr>`;
    return;
  }

  rows.forEach(emp => {
    const opts = [
      '<option value="">— No project —</option>',
      ...projects.map(p => {
        const cnt = employees.filter(e => e.projectId === p.id && e.id !== emp.id).length;
        const full = cnt >= p.capacity;
        const sel  = emp.projectId === p.id ? "selected" : "";
        const dis  = full && !sel ? "disabled" : "";
        return `<option value="${p.id}" ${sel} ${dis}>${escapeHtml(p.name)} (${cnt}/${p.capacity})</option>`;
      })
    ].join("");

   
    const profitClass = emp.profit >= 0 ? "profit-positive" : "profit-negative";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(emp.name)}</td>
      <td>${escapeHtml(emp.surname)}</td>
      <td>${emp.age}</td>
      <td>${emp.position}</td>
      <td>${fmt(emp.salary)}</td>
      <td>${fmt(emp.salary)}</td>
      <td>
        <select class="project-select" onchange="assignProject('${emp.id}', this.value)">
          ${opts}
        </select>
      </td>
      <td class="${profitClass}">${fmt(emp.revenue)}</td>
      <td>
        <button class="btn btn-danger btn-sm" onclick="deleteEmployee('${emp.id}')">Delete</button>
      </td>`;
    tbody.appendChild(tr);
  });
}

function renderAll() {
  renderProjects();
  renderEmployees();
}


function openProjectDetail(projectId) {
  state.detailProjectId = projectId;
  const modal = document.getElementById("projectDetailModal");
  renderProjectDetail();
  modal.classList.add("open");
}

function renderProjectDetail() {
  const { projects, employees } = getMonthData(state.currentYear, state.currentMonth);
  const project = projects.find(p => p.id === state.detailProjectId);
  if (!project) return;

  document.getElementById("projectDetailTitle").textContent =
    `${escapeHtml(project.name)} — Employees`;

  const tbody = document.getElementById("projectDetailBody");
  tbody.innerHTML = "";

  const emps = employees.filter(e => e.projectId === project.id);

  if (emps.length === 0) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="9">
      No employees assigned to this project yet.</td></tr>`;
    return;
  }

  emps.forEach(emp => {
    const m = calcEmpMetrics(emp);
    const profitClass = m.profit >= 0 ? "profit-positive" : "profit-negative";
    const vacDisplay  = m.vacation > 0 ? m.vacation.toFixed(2) : "-";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="color:var(--primary);font-weight:500">${escapeHtml(emp.name)} ${escapeHtml(emp.surname)}</td>
      <td>${m.capacity.toFixed(2)}</td>
      <td>${m.capacity.toFixed(2)}</td>
      <td>${vacDisplay}</td>
      <td>${m.effective.toFixed(3)}</td>
      <td>${fmt(m.revenue)}</td>
      <td>${fmt(m.cost)}</td>
      <td class="${profitClass}">${fmt(m.profit)}</td>
      <td>
        <button class="btn btn-danger btn-sm"
          onclick="unassignFromDetail('${emp.id}')">Unassign</button>
      </td>`;
    tbody.appendChild(tr);
  });
}

function unassignFromDetail(empId) {
  const data = getMonthData(state.currentYear, state.currentMonth);
  data.employees = data.employees.map(e =>
    e.id === empId ? { ...e, projectId: null } : e
  );
  saveMonthData(state.currentYear, state.currentMonth, data);
  renderProjectDetail();
  renderAll();
}

function initProjectDetailModal() {
  document.getElementById("closeProjectDetailBtn").addEventListener("click", () => {
    document.getElementById("projectDetailModal").classList.remove("open");
  });
  document.getElementById("projectDetailOverlay").addEventListener("click", () => {
    document.getElementById("projectDetailModal").classList.remove("open");
  });
}


function deleteProject(id) {
  if (!confirm("Delete this project? All assigned employees will be unassigned.")) return;
  const data = getMonthData(state.currentYear, state.currentMonth);
  data.projects  = data.projects.filter(p => p.id !== id);
  data.employees = data.employees.map(e => e.projectId === id ? { ...e, projectId: null } : e);
  saveMonthData(state.currentYear, state.currentMonth, data);
  renderAll();
}

function deleteEmployee(id) {
  if (!confirm("Delete this employee?")) return;
  const data = getMonthData(state.currentYear, state.currentMonth);
  data.employees = data.employees.filter(e => e.id !== id);
  saveMonthData(state.currentYear, state.currentMonth, data);
  renderAll();
}


function assignProject(empId, projectId) {
  const data = getMonthData(state.currentYear, state.currentMonth);
  data.employees = data.employees.map(e =>
    e.id === empId ? { ...e, projectId: projectId || null } : e
  );
  saveMonthData(state.currentYear, state.currentMonth, data);
  renderAll();
}


function showError(inputId, errorId) {
  document.getElementById(inputId)?.classList.add("error");
  document.getElementById(errorId)?.classList.add("visible");
}
function clearErrors(inputIds, errorIds) {
  inputIds.forEach(id => document.getElementById(id)?.classList.remove("error"));
  errorIds.forEach(id => document.getElementById(id)?.classList.remove("visible"));
}
function onInput(inputId, errorId) {
  document.getElementById(inputId)?.addEventListener("input", () => {
    document.getElementById(inputId)?.classList.remove("error");
    document.getElementById(errorId)?.classList.remove("visible");
  });
}


function initProjectForm() {
  const modal = document.getElementById("projectModal");
  const form  = document.getElementById("projectForm");
  const IDS   = ["projName","projCompany","projBudget","projCapacity"];
  const EIDS  = ["projNameError","projCompanyError","projBudgetError","projCapacityError"];

  document.getElementById("addProjectBtn").addEventListener("click", () => modal.classList.add("open"));
  document.getElementById("cancelProjectBtn").addEventListener("click", () => {
    modal.classList.remove("open"); form.reset(); clearErrors(IDS, EIDS);
  });
  document.getElementById("projectOverlay").addEventListener("click", () => modal.classList.remove("open"));
  IDS.forEach((id, i) => onInput(id, EIDS[i]));

  form.addEventListener("submit", e => {
    e.preventDefault();
    clearErrors(IDS, EIDS);
    const name     = document.getElementById("projName").value.trim();
    const company  = document.getElementById("projCompany").value.trim();
    const budget   = +document.getElementById("projBudget").value;
    const capacity = +document.getElementById("projCapacity").value;

    let ok = true;
    if (name.length < 3)        { showError("projName",    "projNameError");    ok=false; }
    if (company.length < 2)     { showError("projCompany", "projCompanyError"); ok=false; }
    if (!budget || budget <= 0) { showError("projBudget",  "projBudgetError");  ok=false; }
    if (!capacity || capacity<1){ showError("projCapacity","projCapacityError");ok=false; }
    if (!ok) return;

    const data = getMonthData(state.currentYear, state.currentMonth);
    data.projects.push({ id:generateId(), name, company, budget, capacity });
    saveMonthData(state.currentYear, state.currentMonth, data);
    modal.classList.remove("open"); form.reset(); renderAll();
  });
}


function initEmployeeForm() {
  const modal = document.getElementById("employeeModal");
  const form  = document.getElementById("employeeForm");
  const IDS   = ["empName","empSurname","empDob","empPosition","empSalary"];
  const EIDS  = ["empNameError","empSurnameError","empDobError","empPositionError","empSalaryError"];

  document.getElementById("addEmployeeBtn").addEventListener("click", () => modal.classList.add("open"));
  document.getElementById("cancelEmployeeBtn").addEventListener("click", () => {
    modal.classList.remove("open"); form.reset(); clearErrors(IDS, EIDS);
  });
  document.getElementById("employeeOverlay").addEventListener("click", () => modal.classList.remove("open"));
  IDS.forEach((id, i) => onInput(id, EIDS[i]));

  form.addEventListener("submit", e => {
    e.preventDefault();
    clearErrors(IDS, EIDS);
    const name     = document.getElementById("empName").value.trim();
    const surname  = document.getElementById("empSurname").value.trim();
    const dob      = document.getElementById("empDob").value;
    const position = document.getElementById("empPosition").value;
    const salary   = +document.getElementById("empSalary").value;
    const re       = /^[a-zA-Zа-яёА-ЯЁ\s'-]+$/;

    let ok = true;
    if (name.length<3||!re.test(name))       { showError("empName",    "empNameError");    ok=false; }
    if (surname.length<3||!re.test(surname)) { showError("empSurname","empSurnameError"); ok=false; }
    if (!dob || calcAge(dob)<18)             { showError("empDob",    "empDobError");     ok=false; }
    if (!position)                           { showError("empPosition","empPositionError");ok=false; }
    if (!salary || salary<=0)                { showError("empSalary", "empSalaryError");  ok=false; }
    if (!ok) return;

    const data = getMonthData(state.currentYear, state.currentMonth);
    data.employees.push({
      id: generateId(), name, surname, dob, position, salary,
      projectId: null,
      capacity:  DEFAULT_CAP,
      vacation:  0
    });
    saveMonthData(state.currentYear, state.currentMonth, data);
    modal.classList.remove("open"); form.reset(); renderAll();
  });
}


function initSeedData() {
  const modal = document.getElementById("seedModal");
  document.getElementById("seedDataBtn").addEventListener("click", () => {
    renderSeedModal(); modal.classList.add("open");
  });
  document.getElementById("closeSeedBtn").addEventListener("click", () => modal.classList.remove("open"));
  document.getElementById("seedOverlay").addEventListener("click", () => modal.classList.remove("open"));
}

function renderSeedModal() {
  document.getElementById("currentMonthLabel").textContent =
    `${MONTHS[state.currentMonth]} ${state.currentYear}`;
  const tbody = document.getElementById("seedBody");
  const all   = getAllData();
  tbody.innerHTML = "";

  const rows = [];
  Object.keys(all).forEach(key => {
    const [y, m] = key.split("_").map(Number);
    if (y === state.currentYear && m === state.currentMonth) return;
    const md = all[key];
    const income = md.employees.reduce((s,e) => s + calcEmpMetrics(e).revenue, 0);
    rows.push({ y, m, md, income });
  });
  rows.sort((a,b) => b.y - a.y || b.m - a.m);

  if (!rows.length) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="6">No other months with data found.</td></tr>`;
    return;
  }
  rows.forEach(({ y, m, md, income }) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${y}</td><td>${MONTHS[m]}</td>
      <td>${md.projects.length}</td><td>${md.employees.length}</td>
      <td>${fmt(income)}</td>
      <td><button class="btn btn-primary btn-sm" onclick="seedFromMonth(${y},${m})">Use this</button></td>`;
    tbody.appendChild(tr);
  });
}

function seedFromMonth(fy, fm) {
  if (!confirm(`Copy data from ${MONTHS[fm]} ${fy} to current month?`)) return;
  const src  = getMonthData(fy, fm);
  const newP = src.projects.map(p => ({ ...p, id: generateId() }));
  const idMap = {};
  src.projects.forEach((p,i) => { idMap[p.id] = newP[i].id; });
  const newE = src.employees.map(e => ({
    ...e, id: generateId(),
    projectId: e.projectId ? (idMap[e.projectId] || null) : null
  }));
  saveMonthData(state.currentYear, state.currentMonth, { projects:newP, employees:newE });
  document.getElementById("seedModal").classList.remove("open");
  renderAll();
}


document.addEventListener("DOMContentLoaded", () => {
  initSidebar();
  initProjectForm();
  initEmployeeForm();
  initSeedData();
  initProjectDetailModal();
  renderAll();
});
