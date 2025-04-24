<script setup>
import { ref, reactive, onBeforeUnmount, nextTick } from 'vue';

const numBooks = ref(100000);
const numLibraries = ref(100);
const numDays = ref(1000);
const bookScoreMin = ref(1);
const bookScoreMax = ref(1000);
const booksPerLibraryMin = ref(10);
const booksPerLibraryMax = ref(5000);
const signupTimeMin = ref(1);
const signupTimeMax = ref(30);
const booksPerDayMin = ref(1);
const booksPerDayMax = ref(500);

const isMenuOpen = ref(false);
const showInfoModal = ref(false);

const numBooksRef = ref(null);
const booksPerLibraryMinRef = ref(null);
const booksPerLibraryMaxRef = ref(null);
const bookScoreMinRef = ref(null);
const bookScoreMaxRef = ref(null);
const signupTimeMinRef = ref(null);
const signupTimeMaxRef = ref(null);
const booksPerDayMinRef = ref(null);
const booksPerDayMaxRef = ref(null);
const formRef = ref(null);

const generatedInput = ref("");
const showOutputModal = ref(false);
const isLoading = ref(false);
const worker = ref(null);
const statusMessage = ref("");
const isError = ref(false);
const isCancelled = ref(false);
const elapsedTime = ref(0);
const timerInterval = ref(null);
const generationProgress = ref(0);
const selectedPresetName = ref(null);
const isCustomConfig = ref(true);

const presets = reactive([
  {
    name: "Appalachian Regional Library Project", emoji: "📚",
    description: "A grassroots digitization effort focused on preserving regional history in rural Appalachian communities. Involves 3 small public libraries with limited archival collections (~2,500 books total). Using portable overhead scanners (e.g., CZUR ET series), operated by volunteers or interns. The project is scheduled over 3 months (90 days), allowing time for training and modest daily throughput (~40–150 books/day). Designed to capture local heritage without overwhelming resources.",
    values: {
      numBooks: 2500,
      numLibraries: 3,
      numDays: 90,
      bookScoreMin: 20,
      bookScoreMax: 80,
      booksPerLibraryMin: 500,
      booksPerLibraryMax: 1200,
      signupTimeMin: 2,
      signupTimeMax: 5,
      booksPerDayMin: 40,
      booksPerDayMax: 150
    }
  },
  {
    name: "Oxford Bodleian Archives", emoji: "🏛️",
    description: "Targeting rare manuscripts and early prints from the Bodleian Libraries, University of Oxford. Totaling ~18,000 high-value items, this effort uses non-invasive planetary scanners (like Zeutschel OS 14000) to handle delicate materials. Conducted in controlled environments by trained archivists. Daily throughput is limited (10–80 books/day) to ensure preservation integrity. The project reflects a balance between volume and conservation quality.",
    values: {
      numBooks: 18000,
      numLibraries: 4,
      numDays: 365,
      bookScoreMin: 300,
      bookScoreMax: 1000,
      booksPerLibraryMin: 3000,
      booksPerLibraryMax: 6000,
      signupTimeMin: 10,
      signupTimeMax: 45,
      booksPerDayMin: 10,
      booksPerDayMax: 80
    }
  },
  {
    name: "New York Public Library System", emoji: "🏙️",
    description: "Digitizing collections across NYPL's 92 branches, including general circulation, research, and public domain works (~150,000 books). Utilizes a mix of book scanners (Bookeye 4 V2), flatbeds, and high-speed auto-feed units. Scanning is distributed across locations with centralized processing. Bureaucratic and setup delays vary by branch, but daily capacity ranges from 100 to 600 books depending on staff and hardware. Designed to scale across a vast urban system.",
    values: {
      numBooks: 150000,
      numLibraries: 92,
      numDays: 730,
      bookScoreMin: 15,
      bookScoreMax: 500,
      booksPerLibraryMin: 1000,
      booksPerLibraryMax: 5000,
      signupTimeMin: 5,
      signupTimeMax: 25,
      booksPerDayMin: 100,
      booksPerDayMax: 600
    }
  },
  {
    name: "Deutsche Digitale Bibliothek", emoji: "🇩🇪",
    description: "Germany’s national digitization initiative, spanning museums, archives, and libraries (~2 million books). Uses a decentralized model with over 300 institutions. Includes everything from 19th-century texts to university archives. Scanning relies on a variety of professional setups, including robotic V-shaped scanners (e.g. Treventus ScanRobot) and document-safe overhead systems. Broad daily throughput (200–2000) depending on equipment and staff. Designed for long-term national preservation.",
    values: {
      numBooks: 2000000,
      numLibraries: 300,
      numDays: 3650,
      bookScoreMin: 10,
      bookScoreMax: 1000,
      booksPerLibraryMin: 2000,
      booksPerLibraryMax: 20000,
      signupTimeMin: 10,
      signupTimeMax: 60,
      booksPerDayMin: 200,
      booksPerDayMax: 2000
    }
  },
  {
    name: "Internet Archive Bulk Scanning", emoji: "🌐",
    description: "High-speed scanning operation based on real Internet Archive digitization centers. Targets ~600,000 public domain or out-of-print books using semi-automated book scanning stations with human page-turners (e.g., Scribe system). Libraries ship materials to scanning hubs. Designed for speed and cost-efficiency—scanning up to 3,000 books/day across ~40 contributing libraries. Low book value range reflects large-scale general interest material.",
    values: {
      numBooks: 600000,
      numLibraries: 40,
      numDays: 540,
      bookScoreMin: 5,
      bookScoreMax: 300,
      booksPerLibraryMin: 5000,
      booksPerLibraryMax: 15000,
      signupTimeMin: 1,
      signupTimeMax: 3,
      booksPerDayMin: 500,
      booksPerDayMax: 3000
    }
  },
  {
    name: "Vatican Secret Archives Project", emoji: "📜",
    description: "A preservation-focused project for digitizing extremely rare and fragile manuscripts (~3,000 items) from the Vatican Apostolic Archives. Utilizes ultra-high-resolution planetary scanners (e.g., Metis Systems DRS 2000 DCS) in climate-controlled rooms. Staff includes conservators and scholars. Due to the fragility and historical significance of the materials, scanning rates are extremely low (1–10/day). Signup and planning times are significant.",
    values: {
      numBooks: 3000,
      numLibraries: 1,
      numDays: 1460,
      bookScoreMin: 700,
      bookScoreMax: 2000,
      booksPerLibraryMin: 3000,
      booksPerLibraryMax: 3000,
      signupTimeMin: 45,
      signupTimeMax: 120,
      booksPerDayMin: 1,
      booksPerDayMax: 10
    }
  }
]);

function toggleMenu() {
    isMenuOpen.value = !isMenuOpen.value;
}

function openInfoModal() {
    showInfoModal.value = true;
}

function closeInfoModal() {
    showInfoModal.value = false;
}

function markAsCustom() {
    if (!isLoading.value && !isCustomConfig.value) {
        isCustomConfig.value = true;
        selectedPresetName.value = null;
    }
}

function applyPreset(preset) {
    numBooks.value = preset.values.numBooks;
    numLibraries.value = preset.values.numLibraries;
    numDays.value = preset.values.numDays;
    bookScoreMin.value = preset.values.bookScoreMin;
    bookScoreMax.value = preset.values.bookScoreMax;
    booksPerLibraryMin.value = preset.values.booksPerLibraryMin;
    booksPerLibraryMax.value = preset.values.booksPerLibraryMax;
    signupTimeMin.value = preset.values.signupTimeMin;
    signupTimeMax.value = preset.values.signupTimeMax;
    booksPerDayMin.value = preset.values.booksPerDayMin;
    booksPerDayMax.value = preset.values.booksPerDayMax;
    selectedPresetName.value = preset.name;
    isCustomConfig.value = false;
    nextTick(() => {
        checkCrossFieldValidity();
        formRef.value?.reportValidity();
    });
    isMenuOpen.value = false;
}

function stopTimer() {
    if (timerInterval.value) {
        clearInterval(timerInterval.value);
        timerInterval.value = null;
    }
}
function startTimer() {
    stopTimer();
    elapsedTime.value = 0;
    const startTime = Date.now();
    timerInterval.value = setInterval(() => {
        if (!isLoading.value || isCancelled.value) { stopTimer(); return; }
        elapsedTime.value = ((Date.now() - startTime) / 1000).toFixed(1);
    }, 100);
}

function terminateWorker() {
    if (worker.value) {
        worker.value.terminate();
        worker.value = null;
    }
}

function checkCrossFieldValidity(fieldName) {
    nextTick(() => {
        bookScoreMinRef.value?.setCustomValidity('');
        bookScoreMaxRef.value?.setCustomValidity('');
        booksPerLibraryMinRef.value?.setCustomValidity('');
        booksPerLibraryMaxRef.value?.setCustomValidity('');
        signupTimeMinRef.value?.setCustomValidity('');
        signupTimeMaxRef.value?.setCustomValidity('');
        booksPerDayMinRef.value?.setCustomValidity('');
        booksPerDayMaxRef.value?.setCustomValidity('');
        numBooksRef.value?.setCustomValidity('');

        if (bookScoreMin.value > bookScoreMax.value) {
            bookScoreMinRef.value?.setCustomValidity('Min cannot be greater than Max.');
            bookScoreMaxRef.value?.setCustomValidity('Max cannot be less than Min.');
        }
        if (booksPerLibraryMin.value > booksPerLibraryMax.value) {
            booksPerLibraryMinRef.value?.setCustomValidity('Min cannot be greater than Max.');
            booksPerLibraryMaxRef.value?.setCustomValidity('Max cannot be less than Min.');
        }
        if (signupTimeMin.value > signupTimeMax.value) {
            signupTimeMinRef.value?.setCustomValidity('Min cannot be greater than Max.');
            signupTimeMaxRef.value?.setCustomValidity('Max cannot be less than Min.');
        }
        if (booksPerDayMin.value > booksPerDayMax.value) {
            booksPerDayMinRef.value?.setCustomValidity('Min cannot be greater than Max.');
            booksPerDayMaxRef.value?.setCustomValidity('Max cannot be less than Min.');
        }

        if (booksPerLibraryMin.value > numBooks.value) {
            booksPerLibraryMinRef.value?.setCustomValidity(`Cannot exceed total books (${numBooks.value}).`);
            numBooksRef.value?.setCustomValidity(`Must be >= Min Books/Lib (${booksPerLibraryMin.value}).`);
        }
         if (booksPerLibraryMax.value > numBooks.value) {
            booksPerLibraryMaxRef.value?.setCustomValidity(`Cannot exceed total books (${numBooks.value}).`);
        }
    });
}

function handleFormSubmit() {
    statusMessage.value = '';
    isError.value = false;

    checkCrossFieldValidity();

    if (!formRef.value?.checkValidity()) {
        formRef.value?.reportValidity();
        statusMessage.value = "Please correct the errors shown.";
        isError.value = true;
        return;
    }

    triggerGeneration();
}

function triggerGeneration() {
  if (isLoading.value) return;

  isLoading.value = true;
  isCancelled.value = false;
  generatedInput.value = "";
  statusMessage.value = "";
  isError.value = false;
  generationProgress.value = 0;
  startTimer();

  try {
    terminateWorker();
    worker.value = new Worker('/generator.worker.js');

    worker.value.onmessage = (event) => {
        if (isCancelled.value || !isLoading.value) {
             terminateWorker(); stopTimer(); if(isLoading.value) isLoading.value = false; generationProgress.value = 0; return;
        }

        if (event.data.type === 'progress') {
            generationProgress.value = event.data.value;
        } else if (event.data.type === 'result') {
            stopTimer();
            generationProgress.value = 100;
            generatedInput.value = event.data.data;
            showOutputModal.value = true;
            isError.value = false;
            isLoading.value = false;
            terminateWorker();
        } else if (event.data.type === 'error') {
            stopTimer();
            statusMessage.value = `Generation Error: ${event.data.message}`;
            isError.value = true;
            isLoading.value = false;
            terminateWorker();
            generationProgress.value = 0;
        }
    };

    worker.value.onerror = (error) => {
         if (isCancelled.value || !isLoading.value) {
             terminateWorker(); stopTimer(); if(isLoading.value) isLoading.value = false; generationProgress.value = 0; return;
         }
        stopTimer(); statusMessage.value = `Worker Error: ${error.message || 'Unknown'}`;
        isError.value = true; isLoading.value = false; terminateWorker(); error.preventDefault(); generationProgress.value = 0;
    };

    const params = {
        numBooks: numBooks.value, numLibraries: numLibraries.value, numDays: numDays.value,
        bookScoreMin: bookScoreMin.value, bookScoreMax: bookScoreMax.value,
        booksPerLibraryMin: booksPerLibraryMin.value, booksPerLibraryMax: booksPerLibraryMax.value,
        signupTimeMin: signupTimeMin.value, signupTimeMax: signupTimeMax.value,
        booksPerDayMin: booksPerDayMin.value, booksPerDayMax: booksPerDayMax.value,
    };
    worker.value.postMessage(params);

  } catch (e) {
      stopTimer(); statusMessage.value = "Failed to initialize generation process.";
      isError.value = true; isLoading.value = false; worker.value = null; generationProgress.value = 0;
  }
}

function cancelGeneration() {
    if (!isLoading.value || !worker.value) { return; }
    isCancelled.value = true; terminateWorker(); stopTimer();
    isLoading.value = false;
    isError.value = false;
    generationProgress.value = 0;
    statusMessage.value = "Generation cancelled.";
}

function closeOutputModal() { showOutputModal.value = false; }

function copyToClipboard() {
   if (!generatedInput.value) return;
   navigator.clipboard.writeText(generatedInput.value)
       .then(() => alert("Copied!"))
       .catch(err => { console.error('Copy failed: ', err); statusMessage.value = "Copy failed."; isError.value = true; showOutputModal.value = false; });
}

function formatNumberWithUnits(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return String(num);
}

function exportTxt() {
   if (!generatedInput.value) return;
   try {
       const blob = new Blob([generatedInput.value], { type: "text/plain;charset=utf-8" });
       const link = document.createElement("a");
       link.href = URL.createObjectURL(blob);

       const formattedBooks = formatNumberWithUnits(numBooks.value);
       const formattedLibraries = formatNumberWithUnits(numLibraries.value);
       const formattedDays = formatNumberWithUnits(numDays.value);

       link.download = `Books${formattedBooks}_Libs${formattedLibraries}_Days${formattedDays}.in`;
       document.body.appendChild(link); link.click(); document.body.removeChild(link);
       URL.revokeObjectURL(link.href);
   } catch (err) { console.error("Export failed:", err); statusMessage.value = "Export failed."; isError.value = true; showOutputModal.value = false; }
}

onBeforeUnmount(() => { stopTimer(); terminateWorker(); });
</script>

<template>
  <div class="relative min-h-screen bg-gray-900 overflow-x-hidden font-sans">

    <div class="flex flex-col items-center justify-center p-4 sm:p-6 min-h-screen">

      <div class="flex items-start space-x-6 w-full max-w-5xl justify-center">

        <div class="flex-1 w-full max-w-lg bg-gray-800 p-6 md:p-8 rounded-xl shadow-2xl z-10 relative">
          <div class="flex flex-col items-center mb-4">
            <img class="w-auto h-20 mr-3 object-contain hidden sm:block flex-shrink-0" src="/hashcode_problem.png"
              alt="logo" />
            <h1 class="text-xl sm:text-2xl font-bold text-gray-100 truncate">Book Scanning - Input Generator</h1>
          </div>

          <button @click="toggleMenu" v-if="!isMenuOpen" title="Toggle Presets"
            class="absolute top-1/2 left-full transform -translate-y-1/2 ml-[-2px] z-20 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-r-md transition duration-150 ease-in-out flex-shrink-0 shadow-md flex flex-col items-center"
            aria-label="Toggle Presets Panel">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
              stroke="currentColor" class="w-5 h-5 flex-shrink-0">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6Z" />
            </svg>
          </button>

          <p class="text-center text-sm text-gray-400 mb-5 -mt-1">
            <span v-if="!isCustomConfig && selectedPresetName">Using Preset: <span
                class="font-semibold text-gray-300">{{ selectedPresetName }}</span></span>
            <span v-else>Custom Configuration</span>
          </p>

          <fieldset class="space-y-1">
            <form @submit.prevent="handleFormSubmit" id="generation-form" ref="formRef" novalidate>

              <div class="flex flex-col sm:flex-row sm:space-x-4 space-y-3 sm:space-y-0">
                <div class="flex-1">
                  <label for="numBooks"
                    class="block text-gray-300 font-semibold mb-1 text-sm sm:text-base">Total Books</label>
                  <input :disabled="isLoading" id="numBooks" ref="numBooksRef" v-model.number="numBooks"
                    @input="markAsCustom(); checkCrossFieldValidity('numBooks')"
                    @blur="checkCrossFieldValidity('numBooks')" type="number" min="1" max="10000000" required class="w-full p-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg placeholder-gray-400 disabled:opacity-50
                                  focus:ring focus:ring-green-500 focus:border-green-500
                                  invalid:border-red-500 invalid:ring-red-500 invalid:text-red-400" />
                  <div class="h-3"></div>
                </div>
                <div class="flex-1">
                  <label for="numLibraries"
                    class="block text-gray-300 font-semibold mb-1 text-sm sm:text-base">Total Libraries</label>
                  <input :disabled="isLoading" id="numLibraries" v-model.number="numLibraries" @input="markAsCustom"
                    type="number" min="1" max="10000" required class="w-full p-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg placeholder-gray-400 disabled:opacity-50
                                  focus:ring focus:ring-green-500 focus:border-green-500
                                  invalid:border-red-500 invalid:ring-red-500 invalid:text-red-400" />
                  <div class="h-3"></div>
                </div>
                <div class="flex-1">
                  <label for="numDays" class="block text-gray-300 font-semibold mb-1 text-sm sm:text-base">Scanning Days</label>
                  <input :disabled="isLoading" id="numDays" v-model.number="numDays" @input="markAsCustom" type="number"
                    min="1" max="10000" required class="w-full p-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg placeholder-gray-400 disabled:opacity-50
                                  focus:ring focus:ring-green-500 focus:border-green-500
                                  invalid:border-red-500 invalid:ring-red-500 invalid:text-red-400" />
                  <div class="h-3"></div>
                </div>
              </div>

              <div class="flex flex-col sm:flex-row sm:space-x-4 space-y-3 sm:space-y-0 mt-3">
                <div class="flex-1">
                  <label class="block text-gray-300 font-semibold mb-1 text-sm sm:text-base">Book Value Range</label>
                  <div class="flex space-x-2">
                    <input :disabled="isLoading" id="bookScoreMin" ref="bookScoreMinRef" v-model.number="bookScoreMin"
                      @input="markAsCustom(); checkCrossFieldValidity('bookScoreMin')"
                      @blur="checkCrossFieldValidity('bookScoreMin')" type="number" placeholder="Min" required min="1"
                      max="1000" class="w-1/2 p-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg placeholder-gray-400 disabled:opacity-50
                                      focus:ring focus:ring-green-500 focus:border-green-500
                                      invalid:border-red-500 invalid:ring-red-500 invalid:text-red-400" />
                    <input :disabled="isLoading" id="bookScoreMax" ref="bookScoreMaxRef" v-model.number="bookScoreMax"
                      @input="markAsCustom(); checkCrossFieldValidity('bookScoreMax')"
                      @blur="checkCrossFieldValidity('bookScoreMax')" type="number" placeholder="Max" required min="1"
                      max="1000" class="w-1/2 p-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg placeholder-gray-400 disabled:opacity-50
                                      focus:ring focus:ring-green-500 focus:border-green-500
                                      invalid:border-red-500 invalid:ring-red-500 invalid:text-red-400" />
                  </div>
                  <div class="h-3"></div>
                </div>
                <div class="flex-1">
                  <label class="block text-gray-300 font-semibold mb-1 text-sm sm:text-base">Books Per Library Range</label>
                  <div class="flex space-x-2">
                    <input :disabled="isLoading" id="booksPerLibraryMin" ref="booksPerLibraryMinRef"
                      v-model.number="booksPerLibraryMin"
                      @input="markAsCustom(); checkCrossFieldValidity('booksPerLibraryMin')"
                      @blur="checkCrossFieldValidity('booksPerLibraryMin')" type="number" placeholder="Min" required
                      min="1" max="20000" class="w-1/2 p-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg placeholder-gray-400 disabled:opacity-50
                                      focus:ring focus:ring-green-500 focus:border-green-500
                                      invalid:border-red-500 invalid:ring-red-500 invalid:text-red-400" />
                    <input :disabled="isLoading" id="booksPerLibraryMax" ref="booksPerLibraryMaxRef"
                      v-model.number="booksPerLibraryMax"
                      @input="markAsCustom(); checkCrossFieldValidity('booksPerLibraryMax')"
                      @blur="checkCrossFieldValidity('booksPerLibraryMax')" type="number" placeholder="Max" required
                      min="1" max="20000" class="w-1/2 p-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg placeholder-gray-400 disabled:opacity-50
                                      focus:ring focus:ring-green-500 focus:border-green-500
                                      invalid:border-red-500 invalid:ring-red-500 invalid:text-red-400" />
                  </div>
                  <div class="h-3"></div>
                </div>
              </div>

              <div class="flex flex-col sm:flex-row sm:space-x-4 space-y-3 sm:space-y-0 mt-3">
                <div class="flex-1">
                  <label class="block text-gray-300 font-semibold mb-1 text-sm sm:text-base">Library Sign-Up (days)</label>
                  <div class="flex space-x-2">
                    <input :disabled="isLoading" id="signupTimeMin" ref="signupTimeMinRef"
                      v-model.number="signupTimeMin" @input="markAsCustom(); checkCrossFieldValidity('signupTimeMin')"
                      @blur="checkCrossFieldValidity('signupTimeMin')" type="number" placeholder="Min" required min="1"
                      max="200" class="w-1/2 p-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg placeholder-gray-400 disabled:opacity-50
                                      focus:ring focus:ring-green-500 focus:border-green-500
                                      invalid:border-red-500 invalid:ring-red-500 invalid:text-red-400" />
                    <input :disabled="isLoading" id="signupTimeMax" ref="signupTimeMaxRef"
                      v-model.number="signupTimeMax" @input="markAsCustom(); checkCrossFieldValidity('signupTimeMax')"
                      @blur="checkCrossFieldValidity('signupTimeMax')" type="number" placeholder="Max" required min="1"
                      max="200" class="w-1/2 p-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg placeholder-gray-400 disabled:opacity-50
                                      focus:ring focus:ring-green-500 focus:border-green-500
                                      invalid:border-red-500 invalid:ring-red-500 invalid:text-red-400" />
                  </div>
                  <div class="h-3"></div>
                </div>
                <div class="flex-1">
                  <label class="block text-gray-300 font-semibold mb-1 text-sm sm:text-base">Scan Rate (books/day)</label>
                  <div class="flex space-x-2">
                    <input :disabled="isLoading" id="booksPerDayMin" ref="booksPerDayMinRef"
                      v-model.number="booksPerDayMin" @input="markAsCustom(); checkCrossFieldValidity('booksPerDayMin')"
                      @blur="checkCrossFieldValidity('booksPerDayMin')" type="number" placeholder="Min" required min="1"
                      max="5000" class="w-1/2 p-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg placeholder-gray-400 disabled:opacity-50
                                      focus:ring focus:ring-green-500 focus:border-green-500
                                      invalid:border-red-500 invalid:ring-red-500 invalid:text-red-400" />
                    <input :disabled="isLoading" id="booksPerDayMax" ref="booksPerDayMaxRef"
                      v-model.number="booksPerDayMax" @input="markAsCustom(); checkCrossFieldValidity('booksPerDayMax')"
                      @blur="checkCrossFieldValidity('booksPerDayMax')" type="number" placeholder="Max" required min="1"
                      max="5000" class="w-1/2 p-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg placeholder-gray-400 disabled:opacity-50
                                      focus:ring focus:ring-green-500 focus:border-green-500
                                      invalid:border-red-500 invalid:ring-red-500 invalid:text-red-400" />
                  </div>
                  <div class="h-3"></div>
                </div>
              </div>

              <div class="flex items-center space-x-4 mt-6">
                <button type="submit" :disabled="isLoading"
                  class="flex-grow bg-green-600 text-white py-2.5 px-4 rounded-lg hover:bg-green-700 transition duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-h-[44px]">
                  <svg v-if="isLoading" class="animate-spin flex-shrink-0 -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                    </path>
                  </svg>
                  <span>{{ isLoading ? 'Generating...' : 'Generate Input' }}</span>
                  <span v-if="isLoading" class="text-gray-200 text-xs ml-2 tabular-nums"> ({{ elapsedTime }}s)</span>
                </button>
                <button v-if="isLoading" @click="cancelGeneration" type="button" title="Cancel Generation"
                  class="bg-red-600 text-white p-2.5 rounded-lg hover:bg-red-700 transition duration-200 flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                    stroke="currentColor" class="w-5 h-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </form>
          </fieldset>

          <div v-if="isLoading" class="w-full bg-gray-600 rounded-full h-2.5 mt-4 mb-1 dark:bg-gray-700">
            <div class="bg-blue-500 h-2.5 rounded-full transition-all duration-150 ease-linear"
              :style="{ width: generationProgress + '%' }"></div>
          </div>
          <p v-if="isLoading" class="text-center text-xs text-gray-400 mb-3">{{ generationProgress.toFixed(0) }}%
            Complete</p>

          <p v-if="statusMessage"
            :class="{'text-red-400': isError, 'text-green-400': !isError && statusMessage.includes('successful'), 'text-yellow-500': statusMessage.includes('cancelled'), 'text-gray-400': !isError && !statusMessage.includes('successful') && !statusMessage.includes('cancelled')}"
            class="text-center mt-4 text-sm min-h-[1.25em]">
            {{ statusMessage }}
          </p>

        </div>

        <div v-if="isMenuOpen"
          class="w-80 flex-shrink-0 bg-gray-800 shadow-lg rounded-xl z-20 p-4 max-h-[calc(100vh-theme(spacing.12))] overflow-y-auto presets-scrollbar"
          @click.stop>
          <div class="flex justify-between items-center mb-4 sticky top-0 bg-gray-800 pb-3 border-b border-gray-700">
            <div class="flex items-center space-x-2">
                 <h2 class="text-lg font-semibold text-gray-100">Load Preset</h2>
                 <button @click="openInfoModal" title="About Presets" class="text-blue-400 hover:text-blue-300">
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                       <path stroke-linecap="round" stroke-linejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                     </svg>
                 </button>
            </div>
            <button @click="toggleMenu" title="Close Presets" class="text-gray-400 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <ul class="space-y-2 pt-2">
            <li v-for="preset in presets" :key="preset.name">
              <button @click="applyPreset(preset)"
                class="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition duration-150 ease-in-out text-gray-200 flex items-center space-x-3 disabled:opacity-50"
                :disabled="isLoading"
                :class="{ 'bg-blue-800 ring-2 ring-blue-400': !isCustomConfig && selectedPresetName === preset.name }">
                <span class="text-xl flex-shrink-0 w-6 text-center">{{ preset.emoji }}</span>
                <span class="text-sm font-medium">{{ preset.name }}</span>
              </button>
            </li>
          </ul>
        </div>

      </div>

    </div>

    <div v-if="showOutputModal"
      class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 p-4 backdrop-blur-sm z-50">
      <div class="relative bg-gray-800 p-6 rounded-lg shadow-xl max-w-2xl w-full border border-gray-700 flex flex-col"
        style="max-height: 90vh;">
        <button @click="closeOutputModal" title="Close"
          class="absolute top-3 right-3 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full p-1.5 transition duration-150 ease-in-out z-10">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
            stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
        <h2 class="text-xl font-semibold text-gray-100 mb-4 flex-shrink-0 pr-8">Generated Input File</h2>
        <pre
          class="bg-gray-900 border border-gray-700 p-4 rounded-lg overflow-auto text-gray-200 text-sm flex-grow mb-5 output-scrollbar">{{ generatedInput }}</pre>
        <div class="flex justify-end space-x-3 flex-shrink-0">
          <button @click="copyToClipboard" title="Copy to Clipboard"
            class="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition duration-200 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
              stroke="currentColor" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m9.75 11.625-3.75-3.75M9.375 7.5h1.5v1.5h-1.5V7.5Z" />
            </svg> </button>
          <button @click="exportTxt" title="Export as .in file"
            class="bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700 transition duration-200 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
              stroke="currentColor" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg> </button>
        </div>
      </div>
    </div>

     <div v-if="showInfoModal"
      class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 p-4 backdrop-blur-sm z-50">
      <div class="relative bg-gray-800 p-6 rounded-lg shadow-xl max-w-3xl w-full border border-gray-700 flex flex-col"
        style="max-height: 90vh;">
        <button @click="closeInfoModal" title="Close"
          class="absolute top-3 right-3 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full p-1.5 transition duration-150 ease-in-out z-10">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
            stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
        <h2 class="text-xl font-semibold text-gray-100 mb-4 flex-shrink-0 pr-8 border-b border-gray-700 pb-3">About Presets</h2>
        <div class="overflow-auto presets-scrollbar flex-grow pr-2">
            <p class="text-sm text-gray-300 mb-5">These presets provide starting points based on different realistic library scanning scenarios. You can load a preset and then customize the values.</p>
            <ul class="space-y-5">
                <li v-for="preset in presets" :key="preset.name + '-info'" class="border border-gray-700 rounded-lg p-4 bg-gray-850 shadow-inner">
                    <h3 class="text-lg font-semibold text-gray-100 mb-2 flex items-center space-x-2">
                        <span class="text-xl w-6 text-center">{{ preset.emoji }}</span>
                        <span>{{ preset.name }}</span>
                    </h3>
                    <p class="text-sm text-gray-300 mb-3">{{ preset.description }}</p>
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs text-gray-400 tabular-nums">
                        <span>Books: {{ formatNumberWithUnits(preset.values.numBooks) }}</span>
                        <span>Libraries: {{ formatNumberWithUnits(preset.values.numLibraries) }}</span>
                        <span>Days: {{ formatNumberWithUnits(preset.values.numDays) }}</span>
                        <span>Book Value: {{ preset.values.bookScoreMin }} - {{ preset.values.bookScoreMax }}</span>
                        <span>Books/Lib: {{ preset.values.booksPerLibraryMin }} - {{ formatNumberWithUnits(preset.values.booksPerLibraryMax) }}</span>
                        <span>Signup: {{ preset.values.signupTimeMin }} - {{ preset.values.signupTimeMax }} days</span>
                        <span>Scan Rate: {{ preset.values.booksPerDayMin }} - {{ formatNumberWithUnits(preset.values.booksPerDayMax) }}/day</span>
                    </div>
                </li>
            </ul>
        </div>
         <div class="flex justify-end mt-4 flex-shrink-0 border-t border-gray-700 pt-4">
          <button @click="closeInfoModal" title="Close"
            class="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-200">
            Close
           </button>
        </div>
      </div>
    </div>


  </div>
</template>

<style scoped>
.output-scrollbar::-webkit-scrollbar,
.presets-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
.output-scrollbar::-webkit-scrollbar-track,
.presets-scrollbar::-webkit-scrollbar-track { background: #374151; border-radius: 4px; } /* gray-700 */
.output-scrollbar::-webkit-scrollbar-thumb,
.presets-scrollbar::-webkit-scrollbar-thumb { background-color: #6b7280; border-radius: 4px; border: 2px solid #374151; } /* gray-500 */
.output-scrollbar::-webkit-scrollbar-thumb:hover,
.presets-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #9ca3af; } /* gray-400 */
pre.output-scrollbar,
div.presets-scrollbar { scrollbar-width: thin; scrollbar-color: #6b7280 #374151; }
.min-h-\[1\.25em\] { min-height: 1.25em; }
.tabular-nums { font-variant-numeric: tabular-nums; }
.min-h-\[44px\] { min-height: 44px; }
.h-3 { height: 0.75rem; }

.invalid\:border-red-500:invalid { border-color: #ef4444; }
.invalid\:ring-red-500:invalid { --tw-ring-color: #ef4444; }
.invalid\:text-red-400:invalid { color: #f87171; }

.max-h-\[calc\(100vh-theme\(spacing\.12\)\)\] {
    max-height: calc(100vh - 3rem);
}
.bg-gray-850 { background-color: #1f2937e0; } /* Slightly different bg for info modal list items */
</style>