(function() {
  "use strict";

  // DOM refs
  var toastEl = document.getElementById('toast');
  var toastTimer = null;
  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.style.opacity = '1';
    toastEl.style.transform = 'translate(-50%, 0)';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function() {
      toastEl.style.opacity = '0';
      toastEl.style.transform = 'translate(-50%, 12px)';
    }, 2800);
  }

  // Legal modal (unchanged)
  var legalModal = document.getElementById('legal-modal');
  var legalBackdrop = document.getElementById('legal-backdrop');
  var legalClose = document.getElementById('legal-close');
  function openLegal() { legalModal.classList.remove('hidden'); }
  function closeLegal() { legalModal.classList.add('hidden'); }
  document.querySelectorAll('.open-legal').forEach(function(el) {
    el.addEventListener('click', openLegal);
  });
  legalBackdrop.addEventListener('click', closeLegal);
  legalClose.addEventListener('click', closeLegal);
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeLegal();
  });
  document.querySelectorAll('.legal-year').forEach(function(el) {
    el.textContent = new Date().getFullYear();
  });

  // Scroll reveal (unchanged)
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(function(el) { io.observe(el); });
  } else {
    revealEls.forEach(function(el) { el.classList.add('is-visible'); });
  }

  // Upload elements
  var dropzone = document.getElementById('dropzone');
  var dropzoneEmpty = document.getElementById('dropzone-empty');
  var previewImg = document.getElementById('preview-img');
  var fileInput = document.getElementById('file-input');
  var uploadBtn = document.getElementById('upload-btn');
  var newPhotoBtn = document.getElementById('new-photo-btn');
  var processingOverlay = document.getElementById('processing-overlay');
  var shareSection = document.getElementById('share-section');
  var shareBtn = document.getElementById('share-btn');

  // State
  var selectedFile = null;
  var sourceDataUrl = null;
  var convertedDataUrl = null;
  var pureBase64 = null;
  var isConverting = false;

  // ---- Conversion functions (unchanged) ----
  function readOrientation(dataUrl) {
    try {
      var exif = piexif.load(dataUrl);
      return exif["0th"][piexif.ImageIFD.Orientation] || 1;
    } catch (e) {
      return 1;
    }
  }

  function drawCorrected(dataUrl, targetW, targetH, orientation) {
    return new Promise(function(resolve, reject) {
      var img = new Image();
      img.onload = function() {
        var canvas = document.createElement("canvas");
        var rotate90 = orientation >= 5 && orientation <= 8;
        canvas.width = rotate90 ? targetH : targetW;
        canvas.height = rotate90 ? targetW : targetH;
        var ctx = canvas.getContext("2d");
        switch (orientation) {
          case 2: ctx.setTransform(-1, 0, 0, 1, targetW, 0); break;
          case 3: ctx.setTransform(-1, 0, 0, -1, targetW, targetH); break;
          case 4: ctx.setTransform(1, 0, 0, -1, 0, targetH); break;
          case 5: ctx.setTransform(0, 1, 1, 0, 0, 0); break;
          case 6: ctx.setTransform(0, 1, -1, 0, targetH, 0); break;
          case 7: ctx.setTransform(0, -1, -1, 0, targetH, targetW); break;
          case 8: ctx.setTransform(0, -1, 1, 0, 0, targetW); break;
          default: ctx.setTransform(1, 0, 0, 1, 0, 0);
        }
        ctx.drawImage(img, 0, 0, targetW, targetH);
        resolve(canvas.toDataURL("image/jpeg", 0.95));
      };
      img.onerror = reject;
      img.src = dataUrl;
    });
  }

  function buildExif(dataUrl) {
    var exif;
    try {
      exif = piexif.load(dataUrl);
    } catch (e) {
      exif = { "0th": {}, "Exif": {}, "GPS": {}, "1st": {}, "thumbnail": null };
    }
    exif["GPS"] = {};
    delete exif["0th"][piexif.ImageIFD.Software];
    delete exif["0th"][piexif.ImageIFD.HostComputer];
    delete exif["Exif"][piexif.ExifIFD.MakerNote];
    delete exif["Exif"][piexif.ExifIFD.LensMake];
    delete exif["Exif"][piexif.ExifIFD.LensModel];
    delete exif["Exif"][piexif.ExifIFD.LensSpecification];
    exif["0th"][piexif.ImageIFD.Make] = "Meta AI";
    exif["0th"][piexif.ImageIFD.Model] = "Ray-Ban Meta Smart Glasses 2";
    exif["0th"][piexif.ImageIFD.Orientation] = 1;
    exif["Exif"][piexif.ExifIFD.ColorSpace] = 1;
    exif["Exif"][piexif.ExifIFD.PixelXDimension] = 3024;
    exif["Exif"][piexif.ExifIFD.PixelYDimension] = 4032;
    return exif;
  }

  function runConversion() {
    return new Promise(function(resolve, reject) {
      var orientation = readOrientation(sourceDataUrl);
      drawCorrected(sourceDataUrl, 3024, 4032, orientation)
        .then(function(corrected) {
          var exif = buildExif(sourceDataUrl);
          var exifBytes = piexif.dump(exif);
          convertedDataUrl = piexif.insert(exifBytes, corrected);
          pureBase64 = convertedDataUrl.split(",")[1];
          resolve({ convertedDataUrl: convertedDataUrl, pureBase64: pureBase64 });
        })
        .catch(reject);
    });
  }

  function dataUrlToBlob(dataUrl) {
    var arr = dataUrl.split(',');
    var mime = arr[0].match(/:(.*?);/)[1] || 'image/jpeg';
    var bstr = atob(arr[1]);
    var n = bstr.length;
    var u8arr = new Uint8Array(n);
    while (n--) { u8arr[n] = bstr.charCodeAt(n); }
    return new Blob([u8arr], { type: mime });
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    var ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    var ok = document.execCommand("copy");
    ta.remove();
    return ok ? Promise.resolve() : Promise.reject(new Error("copy failed"));
  }

  // ---- Share converted image (UPDATED) ----
  async function shareConvertedImage() {
    if (!convertedDataUrl) {
      showToast("Please convert the photo first.");
      return;
    }
    var blob = dataUrlToBlob(convertedDataUrl);
    var file = new File([blob], "meta-glasses-converted.jpg", { type: "image/jpeg" });

    // Check if Web Share with files is supported and the file is shareable
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: "Meta Glasses Photo",
          text: "Converted Ray-Ban Meta Glasses 3024×4032"
        });
        showToast("✅ Shared successfully!");
        return;
      } catch (err) {
        if (err.name === "AbortError") {
          showToast("Sharing cancelled");
          return;
        }
        // Other errors: fall through to download
      }
    }

    // Fallback: download the image
    var blobUrl = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.style.display = "none";
    a.href = blobUrl;
    a.download = "meta-glasses-converted.jpg";
    document.body.appendChild(a);
    a.click();
    setTimeout(function() {
      URL.revokeObjectURL(blobUrl);
      a.remove();
    }, 4000);
    showToast("📥 Image downloaded — please share manually to Instagram from your gallery.");
  }

  // ---- Load photo + auto-convert (unchanged) ----
  function loadPhoto(file) {
    if (!file || !file.type.match(/^image\//)) {
      showToast('Please choose an image file');
      return;
    }

    convertedDataUrl = null;
    pureBase64 = null;
    isConverting = false;

    processingOverlay.classList.remove('hidden');
    var reader = new FileReader();

    reader.onload = function(e) {
      sourceDataUrl = e.target.result;
      selectedFile = file;

      previewImg.src = sourceDataUrl;
      previewImg.classList.remove('hidden');
      dropzoneEmpty.classList.add('hidden');
      shareSection.classList.remove('hidden');

      isConverting = true;
      runConversion()
        .then(function(result) {
          convertedDataUrl = result.convertedDataUrl;
          pureBase64 = result.pureBase64;
          previewImg.src = convertedDataUrl;
          showToast('✅ Converted to Meta Glasses format!');
        })
        .catch(function(err) {
          console.error('Conversion error:', err);
          showToast('❌ Conversion failed. Try another JPG.');
        })
        .finally(function() {
          isConverting = false;
          processingOverlay.classList.add('hidden');
        });
    };

    reader.onerror = function() {
      processingOverlay.classList.add('hidden');
      showToast('Failed to read file');
    };

    reader.readAsDataURL(file);
  }

  // ---- Event binding (unchanged) ----
  uploadBtn.addEventListener('click', function() { fileInput.click(); });

  fileInput.addEventListener('change', function(e) {
    if (e.target.files && e.target.files[0]) {
      loadPhoto(e.target.files[0]);
    }
    fileInput.value = '';
  });

  ['dragenter', 'dragover'].forEach(function(evt) {
    dropzone.addEventListener(evt, function(e) {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('drag-over');
    });
  });

  ['dragleave', 'drop'].forEach(function(evt) {
    dropzone.addEventListener(evt, function(e) {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('drag-over');
    });
  });

  dropzone.addEventListener('drop', function(e) {
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      loadPhoto(e.dataTransfer.files[0]);
    }
  });

  newPhotoBtn.addEventListener('click', function() {
    selectedFile = null;
    sourceDataUrl = null;
    convertedDataUrl = null;
    pureBase64 = null;
    isConverting = false;
    fileInput.value = '';
    previewImg.src = '';
    previewImg.classList.add('hidden');
    shareSection.classList.add('hidden');
    dropzoneEmpty.classList.remove('hidden');
    showToast('Reset');
  });

  shareBtn.addEventListener('click', async function() {
    if (!sourceDataUrl) {
      showToast('Please select a photo first');
      return;
    }

    if (isConverting) {
      showToast('⏳ Conversion in progress, please wait...');
      return;
    }

    if (!convertedDataUrl) {
      processingOverlay.classList.remove('hidden');
      shareBtn.disabled = true;
      shareBtn.style.opacity = '0.6';
      try {
        await runConversion();
        previewImg.src = convertedDataUrl;
        showToast('✅ Converted! Sharing now...');
      } catch (err) {
        console.error(err);
        showToast('❌ Conversion failed. Try another JPG.');
        processingOverlay.classList.add('hidden');
        shareBtn.disabled = false;
        shareBtn.style.opacity = '1';
        return;
      }
      processingOverlay.classList.add('hidden');
      shareBtn.disabled = false;
      shareBtn.style.opacity = '1';
    }

    await shareConvertedImage();
  });

  // Disable context menu on images
  document.addEventListener('contextmenu', function(e) {
    if (e.target.tagName === 'IMG') e.preventDefault();
  });

})();
