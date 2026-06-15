document.addEventListener("DOMContentLoaded", function () {
  initNavigation();
  initFileUpload();
  initClipboard();
});

function initNavigation() {
  var links = document.querySelectorAll(".nav-link");
  var loginBtn = document.getElementById("login-btn");

  function showPage(pageId) {
    links.forEach(function (l) { l.classList.remove("active"); });
    var navTarget = document.querySelector('[data-page="' + pageId + '"]');
    if (navTarget) navTarget.classList.add("active");

    document.querySelectorAll(".page").forEach(function (p) { p.classList.remove("active"); });
    document.getElementById(pageId).classList.add("active");

    window.location.hash = pageId;
  }

  links.forEach(function (link) {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      showPage(this.getAttribute("data-page"));
    });
  });

  loginBtn.addEventListener("click", function (e) {
    e.preventDefault();
    showPage("login");
  });

  var hash = window.location.hash.replace("#", "");
  if (hash) {
    showPage(hash);
  }
}

function initFileUpload() {
  var dropZone = document.getElementById("drop-zone");
  var fileInput = document.getElementById("file-input");
  var browseBtn = document.getElementById("browse-btn");
  var fileItems = document.getElementById("file-items");
  var uploadStatus = document.getElementById("upload-status");
  var uploadedFiles = [];

  browseBtn.addEventListener("click", function () {
    fileInput.click();
  });

  dropZone.addEventListener("click", function (e) {
    if (e.target === dropZone || e.target.closest(".upload-icon") || e.target.closest("p")) {
      fileInput.click();
    }
  });

  dropZone.addEventListener("dragover", function (e) {
    e.preventDefault();
    dropZone.classList.add("drag-over");
  });

  dropZone.addEventListener("dragleave", function () {
    dropZone.classList.remove("drag-over");
  });

  dropZone.addEventListener("drop", function (e) {
    e.preventDefault();
    dropZone.classList.remove("drag-over");
    handleFiles(e.dataTransfer.files);
  });

  fileInput.addEventListener("change", function () {
    handleFiles(fileInput.files);
    fileInput.value = "";
  });

  function handleFiles(files) {
    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      uploadedFiles.push(file);
      addFileToList(file, uploadedFiles.length - 1);
    }
    updateStatus();
  }

  function addFileToList(file, index) {
    var li = document.createElement("li");
    li.setAttribute("data-index", index);
    li.innerHTML =
      '<span class="file-name">' + escapeHtml(file.name) + '</span>' +
      '<span class="file-size">' + formatSize(file.size) + '</span>' +
      '<button class="file-remove" data-index="' + index + '">Remove</button>';
    fileItems.appendChild(li);

    li.querySelector(".file-remove").addEventListener("click", function () {
      var idx = parseInt(this.getAttribute("data-index"));
      uploadedFiles[idx] = null;
      li.remove();
      updateStatus();
    });
  }

  function updateStatus() {
    var activeFiles = uploadedFiles.filter(function (f) { return f !== null; });
    if (activeFiles.length === 0) {
      uploadStatus.textContent = "";
    } else {
      var totalSize = activeFiles.reduce(function (sum, f) { return sum + f.size; }, 0);
      uploadStatus.textContent = activeFiles.length + " file(s) uploaded (" + formatSize(totalSize) + " total)";
    }
  }

  function formatSize(bytes) {
    if (bytes === 0) return "0 B";
    var units = ["B", "KB", "MB", "GB"];
    var i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(1) + " " + units[i];
  }
}

function initClipboard() {
  var buttons = document.querySelectorAll("[data-copy-target]");
  buttons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var targetId = btn.getAttribute("data-copy-target");
      var target = document.getElementById(targetId);
      var text = target.value !== undefined ? target.value : target.textContent;
      copyToClipboard(text, btn);
    });
  });
}

function copyToClipboard(text, btn) {
  var feedbackEl = btn.nextElementSibling;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function () {
      showFeedback(feedbackEl, "Copied!");
    }).catch(function () {
      fallbackCopy(text, feedbackEl);
    });
  } else {
    fallbackCopy(text, feedbackEl);
  }
}

function fallbackCopy(text, feedbackEl) {
  var textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand("copy");
    showFeedback(feedbackEl, "Copied!");
  } catch (e) {
    showFeedback(feedbackEl, "Failed to copy");
  }
  document.body.removeChild(textarea);
}

function showFeedback(el, message) {
  if (!el) return;
  el.textContent = message;
  el.classList.add("visible");
  setTimeout(function () {
    el.classList.remove("visible");
  }, 2000);
}

function escapeHtml(str) {
  var div = document.createElement("div");
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}
