function loadTask(taskName) {
    const iframe = document.getElementById('taskFrame');
    iframe.src = taskName + '.html';
  }
  
  // Komunikasi untuk resize iframe otomatis
  window.addEventListener("message", function(event) {
    const iframe = document.getElementById("taskFrame");
    if (event.data && event.data.type === "setHeight") {
      iframe.style.height = event.data.height + "px";
    }
  });  