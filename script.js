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

        const codeSpan = document.createElement('span');
        codeSpan.className = 'c-code';
        codeSpan.textContent = c.code;

        const titleSpan = document.createElement('span');
        titleSpan.className = 'c-title';
        titleSpan.textContent = c.title;

    const metaSpan = document.createElement('span');
    metaSpan.className = 'c-meta';
    // credits badge
    const credits = (typeof c.credits === 'number') ? c.credits : (c.credit || 0);
    const badge = document.createElement('span');
    badge.className = 'credit-badge';
    badge.textContent = credits;
    // attach badge to codeSpan so it appears at end of code line
    codeSpan.appendChild(badge);

        // CCC detection (flexible)
        const isCCC = !!(c.ccc || (c.attributes && c.attributes.includes && c.attributes.includes('CCC')) || (c.core && c.core.includes && c.core.includes('CCC')));
        if (isCCC) {
            const cccSpan = document.createElement('small');
            cccSpan.style.marginLeft = '6px';
            cccSpan.style.color = '#d2691e';
            cccSpan.textContent = 'CCC';
            metaSpan.appendChild(cccSpan);
        }

    li.appendChild(codeSpan);
    li.appendChild(titleSpan);
    li.appendChild(metaSpan);

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
let pendingLecture = null; // { code, lectureId } when user selected a lecture but must choose subsections

function openModal(course) {
    currentModalCourse = course;
    document.getElementById('modalTitle').textContent = `${course.code} - ${course.title}`;
    const tbody = document.getElementById('sectionList');
    tbody.innerHTML = "";
    // Find the active Lecture (Pure Lecture, not Lab/Tutorial)
    const activeLecture = addedSections.find(s => s.code === course.code && s.sec.id.startsWith('L') && !s.sec.id.startsWith('LA'))
        || (pendingLecture && pendingLecture.code === course.code ? { sec: { id: pendingLecture.lectureId } } : null);
    
    course.sections.forEach(sec => {
        const uid = `${course.code}-${sec.id}`;
    const isAdded = addedSections.some(x => x.uid === uid) || (pendingLecture && pendingLecture.code === course.code && pendingLecture.lectureId === sec.id);
        
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
            <td class="modal-credit-cell"><span class="credit-badge">${course.credits || ''}</span></td>
            <td>${timeHTML}</td>
            <td>${Array.from(instrSet).join("<br>") || "TBA"}</td>
            <td>
                <button class="btn ${isAdded ? 'btn-remove' : 'btn-add'}" 
                    ${isDisabled && !isAdded ? 'disabled' : ''}
                    title="${tooltip}"
                    onclick="${isAdded ? `removeSection('${uid}')` : `addSection('${course.code}', '${sec.id}')`}">
                    ${isAdded ? (pendingLecture && pendingLecture.code === course.code && pendingLecture.lectureId === sec.id ? 'Selected' : 'Remove') : 'Add'}
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('modalOverlay').style.display = 'flex';
    renderPendingBanner();
}

function refreshModalContent() {
    if(!currentModalCourse) return;
    const course = currentModalCourse;
    const tbody = document.getElementById('sectionList');
    tbody.innerHTML = "";

    course.sections.forEach(sec => {
        const uid = `${course.code}-${sec.id}`;
    const isAdded = addedSections.some(x => x.uid === uid) || (pendingLecture && pendingLecture.code === course.code && pendingLecture.lectureId === sec.id);
        
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
            <td class="modal-credit-cell"><span class="credit-badge">${course.credits || ''}</span></td>
            <td>${timeHTML}</td>
            <td>${instrHTML}</td>
            <td>
                <button class="btn ${isAdded ? 'btn-remove' : 'btn-add'}" 
                    onclick="${isAdded ? `removeSection('${uid}')` : `addSection('${course.code}', '${sec.id}')`}">
                    ${isAdded ? (pendingLecture && pendingLecture.code === course.code && pendingLecture.lectureId === sec.id ? 'Selected' : 'Remove') : 'Add'}
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    renderPendingBanner();
}

// Render a small banner in the modal when a lecture is pending selection
function renderPendingBanner() {
    const modalBody = document.querySelector('.modal .modal-body');
    if(!modalBody) return;
    // remove existing banner if any
    const existing = document.getElementById('pendingBanner');
    if(existing) existing.remove();

    if(pendingLecture && currentModalCourse && pendingLecture.code === currentModalCourse.code) {
        const banner = document.createElement('div');
        banner.id = 'pendingBanner';
        banner.style.padding = '10px';
        banner.style.marginBottom = '10px';
        banner.style.background = '#fff3cd';
        banner.style.border = '1px solid #ffeeba';
        banner.style.borderRadius = '4px';
        banner.innerHTML = `Selected Lecture <strong>${pendingLecture.lectureId}</strong>. Please choose the matching Tutorial/Lab to complete the selection. <button class="btn" style="margin-left:8px;" onclick="cancelPending()">Cancel</button>`;
        modalBody.insertBefore(banner, modalBody.firstChild);
    }
}

function cancelPending() {
    pendingLecture = null;
    refreshModalContent();
}


function addSection(code, secId) {
    const course = courseData.find(c => c.code === code);
    const sec = course.sections.find(s => s.id === secId);
    // New behavior requirements:
    // (1) If selecting a Lecture, mark it as pending and require user to pick matching Tutorial/Lab (if any) and add together.
    // (2) Time conflicts should only alert (no blocking) — already the behavior, but ensure we don't return on conflicts.
    // (3) Deleting any part removes all sections of that course (handled in removeSection).

    const uid = `${code}-${secId}`;

    // If this is a Lecture and the course has subsections that must match, set pendingLecture and re-open modal
    const isLecture = secId.startsWith('L') && !secId.startsWith('LA');
    const hasTutorials = course.sections.some(s => s.id.startsWith('T'));
    const hasLabs = course.sections.some(s => s.id.startsWith('LA'));

    // If the course requires matching, selecting a Lecture must be followed by selecting matching subs
    if (isLecture && (hasTutorials || hasLabs) && course.matchingRequired) {
        // mark pending and re-render modal so user selects subs
        pendingLecture = { code, lectureId: secId };
        // show a selected state immediately (modal stays open)
        refreshModalContent();
        return;
    }

    // If we have a pendingLecture for this course, and the user is now selecting a matching sub (T or LA),
    // perform a batch add: lecture + the selected sub + any other required subs that match the lecture number.
    // Guard: if pendingLecture exists, only allow selecting subsections that match the lecture number
    if (pendingLecture && pendingLecture.code === code && course.matchingRequired) {
        const isSubSectionClick = secId.startsWith('T') || secId.startsWith('LA');
        if (isSubSectionClick) {
            const matchingNum = pendingLecture.lectureId.replace(/\D/g, '');
            const subNum = secId.replace(/\D/g, '');
            if (matchingNum !== subNum) {
                alert(`Please select the Tutorial/Lab that matches ${pendingLecture.lectureId}.`);
                return; // block non-matching clicks
            }
        }

        // gather lecture section object
        const lectureSec = course.sections.find(s => s.id === pendingLecture.lectureId);
        const matchingNum = pendingLecture.lectureId.replace(/\D/g, '');

        // collect to-add sections: lecture + all subsections whose numeric suffix matches
        const toAdd = [lectureSec];
        course.sections.forEach(s => {
            if ((s.id.startsWith('T') || s.id.startsWith('LA')) && s.id.replace(/\D/g, '') === matchingNum) {
                toAdd.push(s);
            }
        });

        // Conflict detection: alert only, do not block
        const conflicts = [];
        toAdd.forEach(newSec => {
            newSec.slots.forEach(newSlot => {
                addedSections.forEach(existing => {
                    existing.sec.slots.forEach(exSlot => {
                        const commonDays = newSlot.days.filter(d => exSlot.days.includes(d));
                        if (commonDays.length === 0) return;
                        if (newSlot.start < exSlot.end && newSlot.end > exSlot.start) {
                            conflicts.push(`${existing.code} ${existing.sec.id}`);
                        }
                    });
                });
            });
        });
        if (conflicts.length > 0) {
            alert(`Time Conflict with ${[...new Set(conflicts)].join(', ')}`);
        }

        // Commit all collected sections for this lecture component
        toAdd.forEach(s => {
            const addUid = `${code}-${s.id}`;
            if (!addedSections.some(x => x.uid === addUid)) {
                addedSections.push({ uid: addUid, code, credits: course.credits, sec: s });
            }
        });

        // clear pending and refresh
        pendingLecture = null;
        savePlans();
        initGrid();
        closeModal();
        return;
    }

    // Otherwise (no pending lecture requirements), perform normal single add but only alert on conflicts
    const conflicts = [];
    sec.slots.forEach(newSlot => {
        addedSections.forEach(existing => {
            existing.sec.slots.forEach(exSlot => {
                const commonDays = newSlot.days.filter(d => exSlot.days.includes(d));
                if (commonDays.length === 0) return;
                if (newSlot.start < exSlot.end && newSlot.end > exSlot.start) {
                    conflicts.push(`${existing.code} ${existing.sec.id}`);
                }
            });
        });
    });
    if (conflicts.length > 0) {
        alert(`Time Conflict with ${[...new Set(conflicts)].join(', ')}`);
    }

    // Commit single section
    if (!addedSections.some(x => x.uid === uid)) {
        addedSections.push({ uid, code, credits: course.credits, sec });
    }
    savePlans();
    initGrid();
    closeModal(); // Close modal on success
}

function removeSection(uid) {
    // New behavior: deleting any section of a course removes all sections of that course from the plan
    const target = addedSections.find(x => x.uid === uid);
    if (!target) return;
    const code = target.code;
    if(!confirm(`Remove all sections of ${code} from current plan? This will delete lecture(s) and any tutorial/lab associated.`)) return;
    // remove all with this course code
    const remaining = addedSections.filter(x => x.code !== code);
    addedSections.length = 0;
    remaining.forEach(r => addedSections.push(r));
    savePlans();
    initGrid();

    // If modal open for same course, refresh; otherwise close
    const modal = document.getElementById('modalOverlay');
    if(modal.style.display === 'flex' && currentModalCourse && currentModalCourse.code === code) {
        refreshModalContent();
    } else {
        closeModal();
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
    pendingLecture = null;
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
