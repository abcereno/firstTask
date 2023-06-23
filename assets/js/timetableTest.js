document.addEventListener("DOMContentLoaded", function () {
  createTable(); // Call the function after the DOM has been loaded
  populateView();
  populateTeachers();
  populateStudents();
  populateSessions();
  populateLocations();
  updateDates();
});
let days = ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
let colBoxChildren;
let sessionTarget;
let parentColBox;
let originalTime;
let draggedDiv;
let currentStudent;
// Open the modal onclick of the session time
function openModal(modalId) {
  const existingBackdrops = document.querySelectorAll(".modal-backdrop");
  existingBackdrops.forEach((backdrop) => {
    backdrop.parentNode.removeChild(backdrop);
  });

  // Show the modal
  let modal = new bootstrap.Modal(document.querySelector(modalId));
  modal.show();
}
function formatTime(timeInMinutes) {
  const hours = Math.floor(timeInMinutes / 60);
  const minutes = timeInMinutes % 60;
  const formattedHours = hours.toString().padStart(2, "0");
  const formattedMinutes = minutes.toString().padStart(2, "0");
  let period;
  if (hours >= 12){
    period = "PM";
  } else {
    period = "AM";
  }
  return `${formattedHours}:${formattedMinutes}${period}`;
}
function formatInputTime(time) {
  const [hours, minutes] = time.split(":");
  let formattedHours = parseInt(hours, 10);
  let period = "";

  if (formattedHours >= 12) {
    period = "PM";
  }

  formattedHours = formattedHours.toString().padStart(2, "0");
  const formattedMinutes = minutes.padStart(2, "0");

  return `${formattedHours}:${formattedMinutes}${period}`;
}
// Toggle edit time table, only allow drag and creating when clicked
function toggleFunctionality(button) {
  const editTimeTable = button.querySelector("h5");
  const colBoxes = document.getElementsByClassName("colBox");
  const draggables = document.getElementsByClassName("draggable");
  const colBoxTimes = document.getElementsByClassName("colBoxChildren");
  if (editTimeTable.textContent === "Save Timetable") {
    editTimeTable.textContent = "Edit Timetable";
    for (let c = 0; c < colBoxTimes.length; c++) {
      colBoxTimes[c].classList.add("active");
      colBoxTimes[c].removeAttribute("ondrop");
      colBoxTimes[c].removeAttribute("ondragover");
      colBoxTimes[c].removeEventListener("click", openModalHandler);
    }
    for (let i = 0; i < colBoxes.length; i++) {
      colBoxes[i].classList.add("active");
    }
    for (let j = 0; j < draggables.length; j++) {
      draggables[j].removeAttribute("draggable");
      draggables[j].removeAttribute("ondragstart");
      draggables[j].removeEventListener("click", function openSession(event) {
        event.stopImmediatePropagation();
        sessionTarget = event.target.id;
        document.getElementById("attendanceName").textContent = event.target.querySelector("h5").textContent;
        document.getElementById("editSessionStartTime").value = event.target.getAttribute("data-time");
        populateFormData();
        openModal("#sessionInfo");
      });
      // draggables[j].classList.add("untargetable");
    }
  } else {
    editTimeTable.textContent = "Save Timetable";
    for (let c = 0; c < colBoxTimes.length; c++) {
      colBoxTimes[c].classList.remove("active");
      colBoxTimes[c].setAttribute("ondrop", "drop(event)");
      colBoxTimes[c].setAttribute("ondragover", "allowDrop(event)");
      colBoxTimes[c].addEventListener("click", openModalHandler);
    }
    for (let i = 0; i < colBoxes.length; i++) {
      colBoxes[i].classList.remove("active");
    }
    for (let j = 0; j < draggables.length; j++) {
      draggables[j].setAttribute("draggable", "true");
      draggables[j].setAttribute("ondragstart", "drag(event)");
      draggables[j].addEventListener("click", function openSession(event) {
        event.stopImmediatePropagation();
        sessionTarget = event.target.id;
        document.getElementById("attendanceName").textContent = event.target.querySelector("h5").textContent;
        document.getElementById("editSessionStartTime").value = event.target.getAttribute("data-time");
        populateFormData();
        openModal("#sessionInfo");
      });
      // draggables[j].classList.remove("untargetable");
    }
  }
}
let sessionData; // Define the sessionData variable
// Enable drag function
function allowDrop(ev) {
  ev.preventDefault();
  ev.stopPropagation();
}
function drag(ev) {
  ev.stopPropagation();
  ev.dataTransfer.setData("text", ev.target.id);
  sessionTarget = ev.target.id;
  document.getElementById("editSessionStartTime").value = ev.target.getAttribute("data-time");
  const dragging = ev.target;
  const draggableElements = document.getElementsByClassName("draggable");

  for (let i = 0; i < draggableElements.length; i++) {
    const otherDiv = draggableElements[i];

    if (otherDiv !== dragging) {
      const draggedRect = dragging.getBoundingClientRect();
      const otherRect = otherDiv.getBoundingClientRect();

      if (
        draggedRect.right >= otherRect.left &&
        draggedRect.left <= otherRect.right &&
        draggedRect.bottom >= otherRect.top &&
        draggedRect.top <= otherRect.bottom
      ) {
        // Overlapping divs found, display alert
        alert(
          "Overlapping sessions detected! Please delete the other session!"
        );
        return;
      }
    }
  }
  dragging.classList.add("shrink");
  const rect = dragging.getBoundingClientRect(); // Get the current position and size of the element
  const offsetX = ev.clientX - rect.left; // Calculate the X offset within the element
  const offsetY = ev.clientY - rect.top; // Calculate the Y offset within the element
  dragging.style.transformOrigin = `${offsetX}px ${offsetY}px`; // Set the transform origin to the offset position
  ev.dataTransfer.setDragImage(dragging, 0, 0); // Set the drag image
  sessionData = {
      location: document.querySelector("#editSessionLocation").value,
      start_time: document.querySelector("#editSessionStartTime").value,
      end_time: document.querySelector("#editSessionEndTime").value,
      student_name: document.querySelector("#editSessionStudent").value,
      teacher_name: document.querySelector("#editSessionTeacher").value,
      recurring: document.querySelector("#editSessionRecurring").value,
      session_type: document.querySelector("#editSessionSessionType").value,
      hourly_rate: document.querySelector("#editSessionHourlyRate").value,
  };
  // Convert the sessionData to a JSON string and set it in the dataTransfer
  ev.dataTransfer.setData("sessionData", JSON.stringify(sessionData));
}
function drop(ev) {
  ev.preventDefault();
  ev.stopPropagation();
  const data = ev.dataTransfer.getData("text");
  document.getElementById("editSessionStartTime").value = ev.target.getAttribute("data-time");
  const sessionParagraph = document.querySelector(`#${data} p.whiteText`);
  const sessionDiv = document.querySelector(`#${data}`);
  sessionDiv.classList.remove("shrink");
  let EndTime = sessionDiv.getAttribute("data-time");
  let newEndTime = sessionDiv.getAttribute("data-end");
  let timeDiff = getTimeValue(document.getElementById("editSessionStartTime").value) - getTimeValue(EndTime); // Difference in minutes
  let updatedEndTimeValue = getTimeValue(newEndTime) + timeDiff; // 
  let updateEndTime = formatTime(updatedEndTimeValue);
  if (ev.target.classList.contains("draggable") || updateEndTime > "23:59") {
    window.alert("You have an overlapping session or Your end time is until tomorrow, Please edit your session first");
    return;
  } else {
    ev.target.appendChild(document.getElementById(data));
    sessionParagraph.textContent = `${document.getElementById("editSessionStartTime").value} - ${updateEndTime}`;
    sessionDiv.setAttribute("data-time", document.getElementById("editSessionStartTime").value);
    sessionDiv.setAttribute("data-end", updateEndTime);
  }
  // Update parentColBox
  colBoxChildren = ev.target;
  let parentDiv = sessionDiv.parentNode;
  parentDiv.firstChild.setAttribute("data-time", document.getElementById("editSessionStartTime").value);
  parentDiv.firstChild.addEventListener("click", function openSession(event) {
    document.getElementById("editSessionStartTime").value = parentDiv.firstChild.getAttribute("data-time");
    document.getElementById("editSessionStartTime").value = document.getElementById("editSessionStartTime").value;
    sessionTarget = event.target.id;
    document.getElementById("attendanceName").textContent = event.target.querySelector("h5").textContent;    event.stopImmediatePropagation();
    populateFormData();
    openModal("#sessionInfo");
  });
  if (ev.dataTransfer.types.length === 0) {
    ev.target.classList.remove("active");
    ev.target.removeAttribute("onclick", 'openModal("#sessionInfo")');
  } else {
    ev.target.classList.remove("active");
    ev.target.setAttribute("onclick", 'openModal("#sessionInfo")');
  }
  // Get the session data from the event dataTransfer
  sessionData = JSON.parse(ev.dataTransfer.getData("sessionData"));
  // Get the colBox value where the session was dropped
  const colBoxValue = ev.target.getAttribute("data-day");
  // Add the colBox value to the sessionData object
  sessionData = {
    start_time: document.getElementById("editSessionStartTime").value,
    end_time: updateEndTime,
    recurring: ev.target.getAttribute("data-day"),
    time: `${document.getElementById("editSessionStartTime").value} - ${updateEndTime}`
  };
  const drop = sessionTarget;
  const droppedId = drop.match(/\d+/)[0];
  // sendRequest("update_drop", sessionData)
  // Send the session data via fetch request
  fetch(`http://127.0.0.1:8000/api/updateondrop/${droppedId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(sessionData),
  })
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.error(error);
      console.log(sessionData);
    });
}
function openModalHandler(event) {
  event.stopImmediatePropagation();
  sessionTarget = "";
  colBoxChildren = event.target;
  document.getElementById("editSessionStartTime").value = event.target.getAttribute("data-time");
  document.getElementById("editSessionStartTime").value = document.getElementById("editSessionStartTime").value;
  openModal("#staticBackdrop");
}
// Create the table
function createTable(event) {
  let table = document.getElementById("createTable");
  for (let i = 0; i < 24; i++) {
    let timezone = "AM";
    if (i >= 12) {
      timezone = "PM";
    }
    let row = document.createElement("div");
    row.className = "row";
    row.style.minWidth = "1000px";
    table.appendChild(row);
    // box with timezone
    dataDay = "Monday";
    let colBox = document.createElement("div");
    colBox.className = "col colBox active ps-0 pe-0";
    let span = document.createElement("span");
    span.textContent = `${i}:00${timezone}`;
    span.style.position = "absolute";
    span.style.zIndex = "999";
    span.style.left = "10px";
    span.style.top = "10px";
    colBox.appendChild(span);
    colBox.setAttribute("data-day", `${dataDay}`);
    colBox.setAttribute("ondrop", "drop(event)");
    colBox.setAttribute("ondragover", "allowDrop(event)");
    row.appendChild(colBox);

    // start of 5 mins loop divs
    for (let j = 0; j <= 55; j += 5) {
      let colBoxTime = document.createElement("div");
      colBoxTime.className = "colBoxChildren active";
      if (j < 10) {
        dataTime = `${i}:0${j}${timezone}`;
        colBoxTime.setAttribute("data-time", dataTime);
        colBoxTime.setAttribute("id", dataTime);
        colBoxTime.style.height = `${5 * 2.5}px`;
        colBoxTime.style.textContent = dataTime;
      } else {
        dataTime = `${i}:${j}${timezone}`;
        colBoxTime.setAttribute("data-time", dataTime);
        colBoxTime.setAttribute("id", dataTime);
        colBoxTime.style.height = `${5 * 2.5}px`;
        colBoxTime.style.textContent = dataTime;
      }
      if (j === 55) {
        colBoxTime.style.height = `${5 * 2.5 - 1}px`;
      }
      colBoxTime.setAttribute("data-day", `${dataDay}`);
      colBox.appendChild(colBoxTime);
    }
    // end of 5 min divs loops

    // columns without timezone
    for (let k = 0; k < days.length; k++) {
      dataDay = days[k];
      const emptyColBox = document.createElement("div");
      emptyColBox.setAttribute("data-day", dataDay);
      emptyColBox.className = "col colBox active ps-0 pe-0";
      emptyColBox.classList.add("active");
      emptyColBox.setAttribute("ondrop", "drop(event)");
      emptyColBox.setAttribute("ondragover", "allowDrop(event)");
      row.appendChild(emptyColBox);

      // Create and append colBoxTime to each emptyColBox
      for (let j = 0; j <= 55; j += 5) {
        let colBoxTime = document.createElement("div");
        colBoxTime.className = "colBoxChildren active";
        if (j < 10) {
          dataTime = `${i}:0${j}${timezone}`;
          colBoxTime.setAttribute("data-time", dataTime);
          colBoxTime.setAttribute("id", dataTime);
          colBoxTime.style.height = `${5 * 2.5}px`;
        } else {
          dataTime = `${i}:${j}${timezone}`;
          colBoxTime.setAttribute("data-time", dataTime);
          colBoxTime.setAttribute("id", dataTime);
          colBoxTime.style.height = `${5 * 2.5}px`;
        }
        let day = days[k];
        colBoxTime.setAttribute("data-day", day);
        emptyColBox.appendChild(colBoxTime);
        if (j === 55) {
          colBoxTime.style.height = `${5 * 2.5 - 1}px`;
        }
      }
    }
  }
}
const confirmSession = document.querySelector("#confirmSession");
// Event listener for confirmSession button
let confirmSessionData;
confirmSession.addEventListener("click", async function () {
  confirmSessionData = {
    location: document.querySelector("#editSessionLocation").value,
    start_time: document.querySelector("#editSessionStartTime").value,
    end_time: formatInputTime(document.querySelector("#editSessionEndTime").value),
    teacher_name: document.querySelector("#editSessionTeacher").value,
    student_name: document.querySelector("#editSessionStudent").value,
    session_type: document.querySelector("#editSessionSessionType").value,
    hourly_rate: document.querySelector("#editSessionHourlyRate").value,
    time: `${document.querySelector("#editSessionStartTime").value} - ${
      formatInputTime(document.querySelector("#editSessionEndTime").value)
    }`,
    recurring: document.querySelector("#editSessionRecurring").value,
  };
  if (sessionTarget) {
    const updateInfo = sessionTarget;
    const target = updateInfo.match(/\d+/)[0];
    fetch(`http://127.0.0.1:8000/api/updatesession/${target}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(confirmSessionData),
    })
      .then(() => {
        console.log("Session updated successfully");
      })
      .catch((error) => {
        console.error("Error occurred while updating session:", error);
      });
      let endInput = document.getElementById("editSessionEndTime").value;
      let location = document.getElementById("editSessionLocation").value;
      let student = document.getElementById("editSessionStudent").value;
      let startTime = getTimeValue(document.getElementById("editSessionStartTime").value);
      let endTime = getTimeValue(endInput);
      let timeDiff = endTime - startTime; // Difference in minutes
      let height = timeDiff * 2.5; // Convert minutes to pixels
      // create the session
      const session = document.createElement("div");
      session.style.height = `${height}px`;
      session.className =
        "lightAccentHover largeBorderBox pointerHover flex-column";
      session.classList.add("draggable");
      session.setAttribute("data-end", formatInputTime(endInput));
      session.setAttribute("draggable", "true");
      session.setAttribute("ondragstart", "drag(event)");
      session.setAttribute("id", `session_${sessionTarget}`);
      session.classList.add("active");
      const modal = document.getElementById("staticBackdrop");
      // Find the parent colBox
      let dataDay = colBoxChildren.getAttribute("data-day");
      let dataTime = colBoxChildren.getAttribute("data-time");
      // document.getElementById("editSessionStartTime").value = dataTime;
      session.setAttribute("data-time", dataTime);
      // Find the parent colBox
      parentColBox = document.querySelector(
        `.colBoxChildren[data-day="${dataDay}"][data-time="${dataTime}"]`
      );
      if (timeDiff < 0) {
        window.alert(
          "it seems you are gonna work until tomorrow, Please create the extended session on the other table, Thank You!"
        );
        return;
      } else if (!timeDiff) {
        window.alert("Please set an end time");
        return;
      } else {
        if (parentColBox.childElementCount >= 0) {
          // Remove existing session
          parentColBox.innerHTML = "";
        }
        session.addEventListener("click", function openSession(event) {
          colBoxChildren = event.target.parentNode;
          sessionTarget = event.target.id;
          document.getElementById("editSessionStartTime").value = event.target.getAttribute("data-time");
          document.getElementById("attendanceName").textContent = event.target.querySelector("h5").textContent;
          event.stopImmediatePropagation();
          populateFormData();
          openModal("#sessionInfo");
        });
        session.innerHTML = `
          <p class="whiteText untargetable">${document.getElementById("editSessionStartTime").value} - ${formatInputTime(endInput)}</p>
          <h5 class="untargetable whiteText marginTopSmall">${student}</h5>
          <p class="untargetable whiteText noMarginTop">${location}</p>
        `;
        parentColBox.appendChild(session);
      }
      // Close the modal
      const modalInstance = bootstrap.Modal.getInstance(modal);
      modalInstance.hide();
    
      // Get the modal backdrop element
      const modalBackdrop = document.querySelector(".modal-backdrop");
    
      // Check if the modal backdrop element exists and has the "show" class
      if (modalBackdrop && modalBackdrop.classList.contains("show")) {
        // Remove the "show" class to close the modal backdrop
        modalBackdrop.classList.remove("show");
      }
    return;
  } else {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(confirmSessionData),
      });
      if (response.ok) {
        const data = await response.json();
        const sessionId = data.session_id;  
        // Call the createSession function passing the session ID
        createSession(sessionId);
      } else {
        throw new Error("Error occurred while creating session");
      }
    } catch (error) {
      console.error(error);
    }
  }
});
function createSession(sessionId) {
  let endInput = document.getElementById("editSessionEndTime").value;
  let location = document.getElementById("editSessionLocation").value;
  let student = document.getElementById("editSessionStudent").value;
  let startTime = getTimeValue(document.getElementById("editSessionStartTime").value);
  let endTime = getTimeValue(endInput);
  let timeDiff = endTime - startTime; // Difference in minutes
  let height = timeDiff * 2.5; // Convert minutes to pixels
  // create the session
  const session = document.createElement("div");
  session.style.height = `${height}px`;
  session.className =
    "lightAccentHover largeBorderBox pointerHover flex-column";
  session.classList.add("draggable");
  session.setAttribute("data-end", formatInputTime(endInput));
  session.setAttribute("draggable", "true");
  session.setAttribute("ondragstart", "drag(event)");
  session.classList.add("active");
  const modal = document.getElementById("staticBackdrop");
  // Find the parent colBox
  let dataDay = colBoxChildren.getAttribute("data-day");
  let dataTime = colBoxChildren.getAttribute("data-time");
  // document.getElementById("editSessionStartTime").value = dataTime;
  session.setAttribute("data-time", dataTime);
  // Find the parent colBox
  parentColBox = document.querySelector(
    `.colBoxChildren[data-day="${dataDay}"][data-time="${dataTime}"]`
  );
  if (timeDiff < 0) {
    window.alert(
      "it seems you are gonna work until tomorrow, Please create the extended session on the other table, Thank You!"
    );
    return;
  } else if (!timeDiff) {
    window.alert("Please set an end time");
    return;
  } else {
    if (parentColBox.childElementCount >= 0) {
      // Remove existing session
      parentColBox.innerHTML = "";
    }
    session.addEventListener("click", function openSession(event) {
      colBoxChildren = event.target.parentNode;
      sessionTarget = event.target.id;
      document.getElementById("editSessionStartTime").value = event.target.getAttribute("data-time");
      document.getElementById("attendanceName").textContent = event.target.querySelector("h5").textContent;
      event.stopImmediatePropagation();
      populateFormData();
      openModal("#sessionInfo");
    });
    session.innerHTML = `
      <p class="whiteText untargetable">${document.getElementById("editSessionStartTime").value} - ${formatInputTime(endInput)}</p>
      <h5 class="untargetable whiteText marginTopSmall">${student}</h5>
      <p class="untargetable whiteText noMarginTop">${location}</p>
    `;
    parentColBox.appendChild(session);
  }
  // Close the modal
  const modalInstance = bootstrap.Modal.getInstance(modal);
  modalInstance.hide();

  // Get the modal backdrop element
  const modalBackdrop = document.querySelector(".modal-backdrop");

  // Check if the modal backdrop element exists and has the "show" class
  if (modalBackdrop && modalBackdrop.classList.contains("show")) {
    // Remove the "show" class to close the modal backdrop
    modalBackdrop.classList.remove("show");
  }
    // Set the session ID as a data attribute on the session element
    session.setAttribute("id", `session_${sessionId}`);
}
function getTimeValue(timeString) {
  let [hours, minutes] = timeString.split(":");
  return parseInt(hours) * 60 + parseInt(minutes);
}
// API POST
// api route for log attendance
const submitButton = document.querySelector("#logAttendance .mainButton");
submitButton.addEventListener("click", function (event) {
  // Create the data to be sent in the POST request
  const attendanceId = sessionTarget;
  const logAttendanceId = attendanceId.match(/\d+/)[0];
  const logAttendance = {
      session_id: logAttendanceId,
      student_name: document.querySelector("#attendanceName").textContent,
      attendance_mark: document.querySelector("#attendanceMark").value,
      objective: document.querySelector("#attendanceObjective").value,
      evaluation: document.querySelector("#attendanceEvaluation").value,
      achieved: document.querySelector("#attendanceAchieved").value,
  };
  fetch("http://127.0.0.1:8000/api/logattendance", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(logAttendance),
  })
    .then((response) => response.json())
    .then((result) => {
      console.log(result);
    })
    .catch((error) => {
      console.error(error);
    });
});
// api route for deleting
const deleteSession = document.querySelector("#deleteSession");
deleteSession.addEventListener("click", function () {
  let toDelete = document.getElementById(sessionTarget);
  toDelete.remove();
  const idString = sessionTarget;
  const number = idString.match(/\d+/)[0];
  fetch(`http://127.0.0.1:8000/api/deletesession/${number}`, {
    method: "DELETE",
  })
    .then((status) => {
      console.log(status);
    })
    .catch((error) => {
      console.error(error);
    });
});
// API GET to poplulate options on select tags
function populateView() {
  // getRequest("get_teachers")
  fetch("http://127.0.0.1:8000/api/getteachers")
    .then((response) => response.json())
    .then((data) => {
      const viewAs = document.getElementById("populateView");
      viewAs.innerHTML += data
        .map((values) => {
          return `<option value="${values.teacher_name}">${values.teacher_name}</option>`;
        })
        .join("");
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}
function populateTeachers() {
  // getRequest("get_teachers")
  fetch("http://127.0.0.1:8000/api/getteachers")
    .then((response) => response.json()) // Parse the response data as JSON
    .then((data) => {
      let popTeacher = document.getElementById("editSessionTeacher");
      popTeacher.innerHTML = data
        .map((values) => {
          return `<option value="${values.teacher_name}">${values.teacher_name}</option>`;
        })
        .join("");
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}
function populateStudents() {
  // getRequest("get_students")
  fetch("http://127.0.0.1:8000/api/getstudents")
    .then((response) => response.json()) // Parse the response data as JSON
    .then((data) => {
      let popStudent = document.getElementById("editSessionStudent");
      popStudent.innerHTML = data
        .map((values) => {
        return  `<option value="${values.student_name}">${values.student_name}</option>`;
        })
        .join("");
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}
function populateLocations() {
  // getRequest("get_locations")
  fetch("http://127.0.0.1:8000/api/getlocations")
    .then((response) => response.json()) // Parse the response data as JSON
    .then((data) => {
      let popLocation = document.getElementById("editSessionLocation");
      popLocation.innerHTML = data
        .map((values) => {
        return  `<option value="${values.location_name}">${values.location_name}</option>`;
        })
        .join("");
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}
function populateSessions() {
  const populateView = document.getElementById("populateView");
  const selectedTeacher = populateView.value;
  // Clear existing sessions
  const sessionElements = document.getElementsByClassName("draggable");
  while (sessionElements.length > 0) {
    sessionElements[0].parentNode.removeChild(sessionElements[0]);
  }
  // getRequest("get_all_sessions")
  fetch(`http://127.0.0.1:8000/api/getsessions/${selectedTeacher}`)
    .then((response) => response.json())
    .then((data) => {
      // Assuming the response data is an array of sessions
      if (Array.isArray(data) && data.length > 0) {
        data.forEach((session) => {
          const sessionStartTime = session.start_time;
          const sessionDay = session.recurring;
          const sessionEndTime = session.end_time;
          const sessionStudent = session.student_name;
          const sessionLocation = session.location;
          const sessionId = session.session_id;
          let sessionStartTimer = getTimeValue(sessionStartTime);
          let sessionEndTimer = getTimeValue(sessionEndTime);
          let timeDiff = sessionEndTimer - sessionStartTimer; // Difference in minutes
          let height = timeDiff * 2.5;
          const parent = document.querySelector(`.colBoxChildren[data-day="${sessionDay}"][data-time="${sessionStartTime}"]`);
          const sessionElement = document.createElement("div");
          sessionElement.setAttribute("data-day", sessionDay);
          sessionElement.setAttribute("data-time", sessionStartTime);
          sessionElement.style.height = `${height}px`;
          sessionElement.className ="lightAccentHover largeBorderBox pointerHover flex-column";
          sessionElement.classList.add("draggable");
          sessionElement.setAttribute("data-end", sessionEndTime);
          sessionElement.setAttribute("id", `session_${sessionId}`);
          sessionElement.classList.add("active");
          sessionElement.addEventListener("click", function openSession(event) {
            colBoxChildren = event.target.parentNode;
            sessionTarget = event.target.id;
            document.getElementById("attendanceName").textContent = sessionStudent;
            document.getElementById("editSessionStartTime").value = event.target.getAttribute("data-time");
            document.getElementById("editSessionStartTime").value = document.getElementById("editSessionStartTime").value;
            event.stopImmediatePropagation();
            populateFormData();
            openModal("#sessionInfo");
          });
          sessionElement.innerHTML = `
      
          <p class="whiteText untargetable">${sessionStartTime} - ${sessionEndTime}</p>
          <h5 class="untargetable whiteText marginTopSmall">${sessionStudent}</h5>
          <p class="untargetable whiteText noMarginTop">${sessionLocation}</p>
      
        `;
          if (!parent) {
            return;
          } else {
            // Update the colBoxChildren with the session element
            parent.appendChild(sessionElement);
          }
        });
      }
    })
    .catch((error) => {
      console.log(error);
    });
}
function populateFormData(){
  const idString = sessionTarget;
const number = idString.match(/\d+/)[0];
  // getRequest("get_session_info", sessionTarget)
  fetch(`http://127.0.0.1:8000/api/getsessionsinfo/${number}`)
  .then((response) => response.json()) // Parse the response data as JSON
  .then((data) => {
    if (Array.isArray(data) && data.length > 0) {
      data.forEach((session) => {
    document.getElementById("sessionInfoLocation").value = session.location;
    document.getElementById("sessionInfoTime").value = `${session.start_time}-${session.end_time}`;
    document.getElementById("sessionInfoStudent").value = session.student_name;
    document.getElementById("sessionInfoTeacher").value = session.teacher_name;
    document.getElementById("sessionInfoRecurring").value = session.recurring;
    document.getElementById("sessionInfoSessionType").value = session.session_type;
    document.getElementById("sessionInfoHourlyRate").value = session.hourly_rate;
    });
  }
  })
  .catch((error) => {
    console.error("Error:", error);
  });
}
function sendRequest(requestType, requestData = []) {
  requestCreator.abort();
  requestCreator.open("POST", "/api/" + requestType + ".php");
  if (requestData != []) {
     var formData = new FormData();

     for (var i = 0; i < requestData.length; i++) {
        formData.append("requestData[]", requestData[i]);
     }
     requestCreator.send(formData);
  } else {
     requestCreator.send();
  }
}
function getRequest(requestType, requestData = []) {
  requestCreator.abort();
  var url = "/api/" + requestType + ".php";
  
  if (requestData.length > 0) {
     url += "?";

     for (var i = 0; i < requestData.length; i++) {
        url += "requestData[]=" + encodeURIComponent(requestData[i]);

        if (i < requestData.length - 1) {
           url += "&";
        }
     }
  }

  requestCreator.open("GET", url);
  requestCreator.send();
}
function updateDates() {
  // Get the current date
  const currentDate = new Date();

  // Get the current day of the week (0-6, where 0 is Sunday)
  let currentDayOfWeek = currentDate.getDay();

  // Adjust the current day of the week to start the week on Monday
  currentDayOfWeek = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;

  // Calculate the start date of the current week (Monday)
  const startDate = new Date(currentDate);
  startDate.setDate(currentDate.getDate() - currentDayOfWeek);

  // Set the dates for each day of the week
  for (let i = 0; i < 7; i++) {
    const dayElement = document.getElementById(`${dayNames[i].toLowerCase()}Date`);
    const dateValue = startDate.getDate() + i;
    const month = startDate.toLocaleString('default', { month: 'long' }); // Get the month name
    dayElement.textContent = `${dateValue} ${month}`;
  }
}
// Define an array of day names starting from Monday
const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
// Automatically update the dates at the start of each week (Monday)
setInterval(function() {
  const currentDate = new Date();
  if (currentDate.getDay() === 1 || currentDate.getHours() === 0) { // Check if it's Monday (1) or a new day (midnight)
    updateDates();
  }
}, 1000 * 60 * 60 * 24); // Check every day (adjust the interval as needed)
setInterval(function() {
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleString('en-US', { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: 'numeric', second: 'numeric' });
  const formattedDay = currentDate.toLocaleString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const formattedTime = currentDate.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric' });
  document.getElementById("dateToday").textContent = formattedDate;
  document.getElementById("attendanceDate").textContent = formattedDay;
  document.getElementById("attendanceTime").textContent = formattedTime;
}, 1000);