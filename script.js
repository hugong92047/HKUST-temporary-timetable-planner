let plans = {};
let currentPlanId = "Plan 1";
let addedSections = [];
const colors = ['#3F51B5', '#009688', '#E91E63', '#FF9800', '#673AB7', '#795548', '#2196F3', '#4CAF50'];

document.addEventListener('DOMContentLoaded', () => {
    if(typeof courseData === 'undefined') {
        alert("Error: courses.js not found!");
        return;
    }
    loadPlans();
    initGrid();
    renderSubjectGrid();
    
    document.getElementById('searchInput').addEventListener('input', (e) => {
        const val = e.target.value.trim();
        if(val.length > 0) {
            renderCourseList(val, true);
        } else {
            showSubjectList();
        }
    });
    
    // Prevent form submission on Enter in search
    document.getElementById('searchInput').addEventListener('keydown', (e) => {
        if(e.key === 'Enter') {
            e.preventDefault();
        }
    });
});

// Mobile Sidebar
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.querySelector('.sidebar-overlay').classList.toggle('active');
}
function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.querySelector('.sidebar-overlay').classList.remove('active');
}

// Plan Management
function loadPlans() {
    const stored = localStorage.getItem('hkust_plans');
    if(stored) {
        plans = JSON.parse(stored);
        currentPlanId = Object.keys(plans)[0];
    } else {
        plans = { "Plan 1": [] };
        currentPlanId = "Plan 1";
    }
    updatePlanSelect();
    addedSections = plans[currentPlanId];
    updateStats();
}

function savePlans() {
    localStorage.setItem('hkust_plans', JSON.stringify(plans));
    updateStats();
}

function updatePlanSelect() {
    const select = document.getElementById('planSelect');
    select.innerHTML = "";
    Object.keys(plans).forEach(id => {
        const opt = document.createElement('option');
        opt.value = id;
        opt.textContent = id;
        if(id === currentPlanId) opt.selected = true;
        select.appendChild(opt);
    });
}

function switchPlan(newId) {
    currentPlanId = newId;
    addedSections = plans[currentPlanId];
    closeModal(); // Close modal when switching plans
    initGrid();
    updateStats();
}

function createNewPlan() {
    try {
        const name = prompt("Enter new plan name:", `Plan ${Object.keys(plans).length + 1}`);
        if(name) {
            const trimmedName = name.trim();
            if(!trimmedName) {
                alert("Plan name cannot be empty!");
                return;
            }
            if(plans[trimmedName]) {
                alert(`Plan "${trimmedName}" already exists!`);
                return;
            }
            plans[trimmedName] = [];
            currentPlanId = trimmedName;
            addedSections = plans[currentPlanId];
            closeModal(); // Close modal when creating new plan
            savePlans();
            updatePlanSelect();
            initGrid();
        }
    } catch(error) {
        console.error("Error creating new plan:", error);
        alert("An error occurred while creating the plan. Please try again.");
    }
}

function renamePlan() {
    try {
        const name = prompt("Rename current plan:", currentPlanId);
        if(name) {
            const trimmedName = name.trim();
            if(!trimmedName) {
                alert("Plan name cannot be empty!");
                return;
            }
            if(trimmedName === currentPlanId) {
                return; // No change
            }
            if(plans[trimmedName]) {
                alert(`Plan "${trimmedName}" already exists!`);
                return;
            }
            plans[trimmedName] = plans[currentPlanId];
            delete plans[currentPlanId];
            currentPlanId = trimmedName;
            closeModal(); // Close modal when renaming plan
            savePlans();
            updatePlanSelect();
            initGrid(); // Refresh grid to show updated plan
        }
    } catch(error) {
        console.error("Error renaming plan:", error);
        alert("An error occurred while renaming the plan. Please try again.");
    }
}

function deletePlan() {
    try {
        if(Object.keys(plans).length <= 1) {
            alert("You must have at least one plan.");
            return;
        }
        if(confirm(`Delete "${currentPlanId}"?`)) {
            delete plans[currentPlanId];
            currentPlanId = Object.keys(plans)[0];
            addedSections = plans[currentPlanId];
            closeModal(); // Close modal when deleting plan
            savePlans();
            updatePlanSelect();
            initGrid();
        }
    } catch(error) {
        console.error("Error deleting plan:", error);
        alert("An error occurred while deleting the plan. Please try again.");
    }
}

function clearCurrentPlan() {
    if(confirm("Clear current timetable?")) {
        plans[currentPlanId] = [];
        addedSections = [];
        closeModal(); // Close modal when clearing plan
        savePlans();
        initGrid();
    }
}

// Sidebar Logic
function renderSubjectGrid() {
    const grid = document.getElementById('subject-grid');
    grid.innerHTML = "";
    const subjects = [...new Set(courseData.map(c => c.code.split(' ')[0]))].sort();
    
    subjects.forEach(subj => {
        const div = document.createElement('div');
        div.className = 'subject-tile';
        div.innerHTML = `<span>${subj}</span><span class="chevron">&rsaquo;</span>`;
        div.onclick = () => {
            showCoursesForSubject(subj);
        };
        grid.appendChild(div);
    });
    
    document.getElementById('subject-header').style.display = 'block';
    document.getElementById('subject-grid').style.display = 'grid';
    document.getElementById('course-list').style.display = 'none';
    document.getElementById('nav-header').style.display = 'none';
}

function showCoursesForSubject(subject) {
    const nav = document.getElementById('nav-header');
    document.getElementById('nav-title').textContent = `${subject} Courses`;
    nav.style.display = 'flex';
    renderCourseList(subject, false);
}

function renderCourseList(filter, isSearch) {
    document.getElementById('subject-header').style.display = 'none';
    document.getElementById('subject-grid').style.display = 'none';
    
    const list = document.getElementById('course-list');
    list.style.display = 'block';
    list.innerHTML = "";
    
    const term = filter.toLowerCase();
    const filtered = courseData.filter(c => {
        return isSearch 
            ? c.code.toLowerCase().includes(term) || c.title.toLowerCase().includes(term)
            : c.code.startsWith(filter);
    });

    if (filtered.length === 0) list.innerHTML = '<li style="padding:15px; color:#999; text-align:center">No courses found</li>';

    filtered.forEach(c => {
        const li = document.createElement('li');
        li.className = 'course-item';
        li.innerHTML = `<span class="c-code">${c.code}</span><span class="c-title">${c.title}</span>`;
        li.onclick = () => {
            openModal(c);
        };
        list.appendChild(li);
    });
    
    if(isSearch) document.getElementById('nav-header').style.display = 'none';
}

function showSubjectList() {
    document.getElementById('searchInput').value = "";
    renderSubjectGrid();
}

// Timetable Logic
let eventLayout = {}; // key -> { col, cols }

function computeEventLayout() {
    eventLayout = {};
    const byDay = {}; // day -> [{ key, start, end }]

    addedSections.forEach(item => {
        item.sec.slots.forEach((slot, sIdx) => {
            slot.days.forEach(day => {
                if (day < 1 || day > 6) return; // grid only renders Mon(1) to Sat(6)
                const key = `${item.uid}|${sIdx}|${day}`;
                (byDay[day] ||= []).push({ key, start: slot.start, end: slot.end });
            });
        });
    });
  
    Object.keys(byDay).forEach(day => {
        const events = byDay[day].sort((a, b) => a.start - b.start || a.end - b.end);
        
        let active = [];              // [{ end, col, key }]
        let componentKeys = [];
        let componentMax = 0;
        
        for (const ev of events) {
            // drop finished
            active = active.filter(a => a.end > ev.start);
            
            // if a component ended, finalize its cols
            if (active.length === 0 && componentKeys.length > 0) {
                componentKeys.forEach(k => eventLayout[k].cols = componentMax);
                componentKeys = [];
                componentMax = 0;
            }
            
            const used = new Set(active.map(a => a.col));
            let col = 0;
            while (used.has(col)) col++;
            
            eventLayout[ev.key] = { col, cols: 1 }; // cols finalized later
            active.push({ end: ev.end, col, key: ev.key });
            componentKeys.push(ev.key);
            componentMax = Math.max(componentMax, active.length);
        }
  
        // finalize last component
        if (componentKeys.length > 0) {
            componentKeys.forEach(k => eventLayout[k].cols = componentMax);
        }
    });
}


function initGrid() {
    computeEventLayout();
    const tbody = document.getElementById('grid-body');
    const emptyState = document.getElementById('empty-state');
    const grid = document.getElementById('grid');
    
    // Show/hide empty state
    if(addedSections.length === 0) {
        emptyState.style.display = 'block';
        grid.style.display = 'none';
    } else {
        emptyState.style.display = 'none';
        grid.style.display = 'table';
    }
    
    tbody.innerHTML = "";
    for(let h=8; h<=22; h++) {
        const tr = document.createElement('tr');
        const tdTime = document.createElement('td');
        if(h !== 22) {
            let displayHour = h;
            let period = 'AM';
            if(h === 12) {
                displayHour = 12;
                period = 'PM';
            } else if(h > 12) {
                displayHour = h - 12;
                period = 'PM';
            }
            tdTime.innerHTML = `${displayHour} ${period}`;
        }
        tr.appendChild(tdTime);
        
        for(let d=1; d<=6; d++) {
            const td = document.createElement('td');
            renderEventsInCell(td, h, d);
            tr.appendChild(td);
        }
        tbody.appendChild(tr);
    }
    updateStats();
}

function renderEventsInCell(td, h, d) {
    addedSections.forEach((item, idx) => {
        item.sec.slots.forEach((slot, sIdx) => {
            if(!slot.days.includes(d)) return;
            if(Math.floor(slot.start) !== h) return; // Only render in start hour cell
            
            const div = document.createElement('div');
            div.className = 'event';
            const courseIndex = [...new Set(addedSections.map(x => x.code))].indexOf(item.code);
            div.style.backgroundColor = colors[courseIndex % colors.length];
  
            const duration = slot.end - slot.start;
            const offset = slot.start - h;
            
            div.style.top = (offset * 42) + 'px';
            div.style.height = (duration * 42 - 2) + 'px';

            // Apply Split Layout if needed
            const key = `${item.uid}|${sIdx}|${d}`;
            const layout = eventLayout[key];
            if (layout) {
                const { col, cols } = layout;
                if (cols > 1) {
                    div.style.width = `calc((100% - 4px) / ${cols})`;
                    div.style.left = `calc(2px + ${col} * ((100% - 4px) / ${cols}))`;
                }
            }
  
            div.innerHTML = `<b>${item.code} ${item.sec.id}</b><br>${slot.venue}`;
            div.onclick = (e) => {
                e.stopPropagation();
                // Open modal to show all sections of this course
                const course = courseData.find(c => c.code === item.code);
                if(course) openModal(course);
            };
            
            td.appendChild(div);
        });
    });
}

// Store current course in modal for refresh
let currentModalCourse = null;

function openModal(course) {
    document.getElementById('modalTitle').textContent = `${course.code} - ${course.title}`;
    const tbody = document.getElementById('sectionList');
    tbody.innerHTML = "";

    // Find the active Lecture (Pure Lecture, not Lab/Tutorial)
    const activeLecture = addedSections.find(s => s.code === course.code && s.sec.id.startsWith('L') && !s.sec.id.startsWith('LA'));
    
    course.sections.forEach(sec => {
        const uid = `${course.code}-${sec.id}`;
        const isAdded = addedSections.some(x => x.uid === uid);
        
        // Define Section Types
        const isLecture = sec.id.startsWith('L') && !sec.id.startsWith('LA'); // L1, L2
        const isTutorial = sec.id.startsWith('T');    // T1, T1A
        const isLab = sec.id.startsWith('LA');        // LA1, LA1A
        const isSubSection = isTutorial || isLab;     // Both need matching

        let isDisabled = false;
        let tooltip = "";

        // RULE 1: Grey out other Lectures
        if (isLecture && activeLecture && !isAdded) {
            isDisabled = true;
            tooltip = "You can only select one Lecture per course";
        }

        // RULE 2: Grey out unmatched Tutorials AND Labs
        if (course.matchingRequired && isSubSection) {
            if (!activeLecture) {
                isDisabled = true;
                tooltip = "Please select a Lecture first";
            } else {
                // Extract Numbers to match: "L01" -> "01", "LA1" -> "1"
                const lecNum = activeLecture.sec.id.replace(/\D/g, ''); // "L1" -> "1"
                const subNum = sec.id.replace(/\D/g, '');               // "LA1" -> "1"
                
                // The numbers must match (e.g. L1 matches T1 and LA1)
                if (lecNum !== subNum) {
                    isDisabled = true;
                    tooltip = `This section matches Lecture ${lecNum} only`;
                }
            }
        }

        let timeHTML = "";
        let instrSet = new Set();
        sec.slots.forEach(slot => {
            timeHTML += `<div class="slot-row">📅 ${slot.time}<br>📍 ${slot.venue}</div>`;
            if(slot.instructor && slot.instructor !== "TBA") instrSet.add(slot.instructor);
        });

        // Render Row
        const tr = document.createElement('tr');
        
        if (isSubSection) tr.style.backgroundColor = "#fafafa";
        if (isDisabled && !isAdded) tr.style.opacity = "0.4";

        tr.innerHTML = `
            <td><b>${sec.id}</b></td>
            <td>${timeHTML}</td>
            <td>${Array.from(instrSet).join("<br>") || "TBA"}</td>
            <td>
                <button class="btn ${isAdded ? 'btn-remove' : 'btn-add'}" 
                    ${isDisabled && !isAdded ? 'disabled' : ''}
                    title="${tooltip}"
                    onclick="${isAdded ? `removeSection('${uid}')` : `addSection('${course.code}', '${sec.id}')`}">
                    ${isAdded ? 'Remove' : 'Add'}
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('modalOverlay').style.display = 'flex';
}

function refreshModalContent() {
    if(!currentModalCourse) return;
    const course = currentModalCourse;
    const tbody = document.getElementById('sectionList');
    tbody.innerHTML = "";

    course.sections.forEach(sec => {
        const uid = `${course.code}-${sec.id}`;
        const isAdded = addedSections.some(x => x.uid === uid);
        
        let timeHTML = "";
        let instrHTML = "";
        let instructors = new Set();

        sec.slots.forEach(slot => {
            timeHTML += `<div class="slot-row">📅 ${slot.time}<br>📍 ${slot.venue}</div>`;
            if(slot.instructor && slot.instructor !== "TBA") instructors.add(slot.instructor);
        });
        instrHTML = Array.from(instructors).join("<br>") || "TBA";

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><b>${sec.id}</b></td>
            <td>${timeHTML}</td>
            <td>${instrHTML}</td>
            <td>
                <button class="btn ${isAdded ? 'btn-remove' : 'btn-add'}" 
                    onclick="${isAdded ? `removeSection('${uid}')` : `addSection('${course.code}', '${sec.id}')`}">
                    ${isAdded ? 'Remove' : 'Add'}
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function addSection(code, secId) {
    const course = courseData.find(c => c.code === code);
    const sec = course.sections.find(s => s.id === secId);
    
    // 1. Check for Max Overlaps (Blocking Rule: Max 2 allowed)
    for (let newSlot of sec.slots) {
        for (let day of newSlot.days) {
            // Gather all existing slots on this day
            const existingSlotsOnDay = [];
            addedSections.forEach(ex => {
                ex.sec.slots.forEach(s => {
                    if(s.days.includes(day)) existingSlotsOnDay.push(s);
                });
            });
            // Add new slot temporarily for calculation
            existingSlotsOnDay.push(newSlot);

            // Create scan-line events
            const points = [];
            existingSlotsOnDay.forEach(s => {
                points.push({t: s.start, type: 1}); // start
                points.push({t: s.end, type: -1});  // end
            });
            // Sort: time asc, then end (-1) before start (1)
            points.sort((a,b) => (a.t - b.t) || (a.type - b.type));

            let active = 0;
            for (let p of points) {
                active += p.type;
                if (active > 2) {
                    alert("Cannot add: Time slot has too many overlaps (max 2 allowed).");
                    return; // BLOCK ADDITION
                }
            }
        }
    }

    // 2. Check for Time Conflict (Alert Only)
    let conflictMsg = null;
    for (let newSlot of sec.slots) {
        for (let existing of addedSections) {
            for (let existSlot of existing.sec.slots) {
                const commonDays = newSlot.days.filter(d => existSlot.days.includes(d));
                if (commonDays.length === 0) continue;
                if (newSlot.start < existSlot.end && newSlot.end > existSlot.start) {
                    conflictMsg = `Time Conflict with ${existing.code} ${existing.sec.id}`;
                }
            }
        }
    }

    if (conflictMsg) {
        alert(conflictMsg); // Alert but continue
    }

    // 3. Commit to Plan
    addedSections.push({ uid: `${code}-${secId}`, code, credits: course.credits, sec });
    savePlans();
    initGrid();
    closeModal(); // Close modal on success

    // 4. Reminder Logic for Tutorials AND Labs
    if (secId.startsWith('L') && !secId.startsWith('LA')) {
        const hasTutorials = course.sections.some(s => s.id.startsWith('T'));
        const hasLabs = course.sections.some(s => s.id.startsWith('LA'));
        
        if (hasTutorials || hasLabs) {
            setTimeout(() => {
                let missing = [];
                if (hasTutorials) missing.push("Tutorial");
                if (hasLabs) missing.push("Laboratory");
                alert(`Action Required: ${code} also requires a ${missing.join(" and ")}.`);
                openModal(course); // Re-open to pick the missing parts
            }, 400);
        }
    }
}

function removeSection(uid) {
    const idx = addedSections.findIndex(x => x.uid === uid);
    if(idx !== -1) {
        const removed = addedSections[idx];
        addedSections.splice(idx, 1);
        savePlans();
        initGrid();
        
        // Refresh modal if open and showing the same course
        const modal = document.getElementById('modalOverlay');
        if(modal.style.display === 'flex' && currentModalCourse && currentModalCourse.code === removed.code) {
            refreshModalContent();
        } else {
            closeModal();
        }
    }
}


function updateStats() {
    const unique = new Set(addedSections.map(x => x.code));
    const total = Array.from(unique).reduce((sum, code) => {
        const course = courseData.find(c => c.code === code);
        return sum + (course ? course.credits : 0);
    }, 0);
    document.getElementById('credit-count').textContent = total;
}

function closeModal() {
    document.getElementById('modalOverlay').style.display = 'none';
    currentModalCourse = null;
    if(window.innerWidth <= 768) closeSidebar();
}

function closeModalOnOverlay(event) {
    if(event.target.id === 'modalOverlay') closeModal();
}

// Keyboard support
document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape') {
        const modal = document.getElementById('modalOverlay');
        if(modal.style.display === 'flex') closeModal();
    }
});

// Ensure functions are globally accessible
window.createNewPlan = createNewPlan;
window.renamePlan = renamePlan;
window.deletePlan = deletePlan;
window.switchPlan = switchPlan;
window.clearCurrentPlan = clearCurrentPlan;
