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

  // Resource caps to prevent runaway allocation from a single ingest.
  var MAX_FILES = 50;
  var MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MiB per file
  var MAX_TOTAL_SIZE = 500 * 1024 * 1024; // 500 MiB cumulative
  var MAX_NAME_LENGTH = 255;

  // Compact state: Map keyed by a monotonically increasing id. Removal deletes
  // the entry, so iteration and bookkeeping are proportional to the live set.
  var uploadedFiles = new Map();
  var nextId = 0;
  var count = 0;
  var totalSize = 0;

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

  // Delegated click listener for row removal — one listener for the whole list.
  fileItems.addEventListener("click", function (e) {
    var btn = e.target.closest(".file-remove");
    if (!btn || !fileItems.contains(btn)) return;
    var id = btn.getAttribute("data-index");
    var li = btn.closest("li");
    var entry = uploadedFiles.get(id);
    if (entry) {
      count -= 1;
      totalSize -= entry.size;
      uploadedFiles.delete(id);
    }
    if (li) li.remove();
    updateStatus();
  });

  function handleFiles(files) {
    if (!files || files.length === 0) return;

    var errors = [];

    // Bound the batch before touching state.
    var incoming = files.length;
    var remainingSlots = MAX_FILES - count;
    if (remainingSlots <= 0) {
      setError("Upload limit reached (max " + MAX_FILES + " files).");
      return;
    }
    var limit = incoming;
    if (incoming > remainingSlots) {
      errors.push("Only the first " + remainingSlots + " of " + incoming +
        " files were accepted (max " + MAX_FILES + ").");
      limit = remainingSlots;
    }

    var fragment = document.createDocumentFragment();
    var acceptedAny = false;
    var skippedName = 0;
    var skippedSize = 0;
    var skippedTotal = 0;

    for (var i = 0; i < limit; i++) {
      var file = files[i];
      if (!file) continue;

      if (typeof file.name === "string" && file.name.length > MAX_NAME_LENGTH) {
        skippedName += 1;
        continue;
      }
      if (typeof file.size === "number" && file.size > MAX_FILE_SIZE) {
        skippedSize += 1;
        continue;
      }
      if (totalSize + (file.size || 0) > MAX_TOTAL_SIZE) {
        skippedTotal += 1;
        continue;
      }

      var id = String(nextId++);
      uploadedFiles.set(id, file);
      count += 1;
      totalSize += (file.size || 0);
      fragment.appendChild(buildRow(file, id));
      acceptedAny = true;
    }

    if (acceptedAny) {
      fileItems.appendChild(fragment);
    }

    if (skippedName > 0) {
      errors.push(skippedName + " file(s) skipped: name exceeds " + MAX_NAME_LENGTH + " characters.");
    }
    if (skippedSize > 0) {
      errors.push(skippedSize + " file(s) skipped: exceed " + formatSize(MAX_FILE_SIZE) + " per-file limit.");
    }
    if (skippedTotal > 0) {
      errors.push(skippedTotal + " file(s) skipped: cumulative size would exceed " + formatSize(MAX_TOTAL_SIZE) + ".");
    }

    updateStatus(errors.join(" "));
  }

  function buildRow(file, id) {
    var li = document.createElement("li");
    li.setAttribute("data-index", id);

    var nameSpan = document.createElement("span");
    nameSpan.className = "file-name";
    nameSpan.textContent = file.name;

    var sizeSpan = document.createElement("span");
    sizeSpan.className = "file-size";
    sizeSpan.textContent = formatSize(file.size);

    var removeBtn = document.createElement("button");
    removeBtn.className = "file-remove";
    removeBtn.setAttribute("data-index", id);
    removeBtn.textContent = "Remove";

    li.appendChild(nameSpan);
    li.appendChild(sizeSpan);
    li.appendChild(removeBtn);
    return li;
  }

  function setError(message) {
    uploadStatus.textContent = message;
  }

  function updateStatus(extraMessage) {
    var base;
    if (count === 0) {
      base = "";
    } else {
      base = count + " file(s) uploaded (" + formatSize(totalSize) + " total)";
    }
    if (extraMessage) {
      uploadStatus.textContent = base ? base + " — " + extraMessage : extraMessage;
    } else {
      uploadStatus.textContent = base;
    }
  }

  function formatSize(bytes) {
    if (!bytes || bytes === 0) return "0 B";
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
