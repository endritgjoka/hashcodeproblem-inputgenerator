<script setup>
import { ref, reactive, onBeforeUnmount, nextTick } from 'vue';

const numBooks = ref(10000);
const numLibraries = ref(100);
const numDays = ref(1000);
const bookScoreMin = ref(1);
const bookScoreMax = ref(1000);
const booksPerLibraryMin = ref(10);
const booksPerLibraryMax = ref(1000);
const signupTimeMin = ref(1);
const signupTimeMax = ref(10);
const booksPerDayMin = ref(1);
const booksPerDayMax = ref(100);

const isMenuOpen = ref(false);

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
const showModal = ref(false);
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

const presets = [
  {
    name: "US Newspaper Program", emoji: "📰",
    values: { B: 750000, L: 1200, D: 1500, BS_Min: 1, BS_Max: 250, BPL_Min: 50, BPL_Max: 5000, ST_Min: 5, ST_Max: 30, BPD_Min: 50, BPD_Max: 2000 }
  },
  {
    name: "India Mahabharat Libs", emoji: "📚",
    values: { B: 1000000, L: 2500, D: 2000, BS_Min: 10, BS_Max: 950, BPL_Min: 100, BPL_Max: 10000, ST_Min: 3, ST_Max: 45, BPD_Min: 20, BPD_Max: 1500 }
  },
  {
    name: "Latin America Colonial", emoji: "🏛️",
    values: { B: 400000, L: 350, D: 1600, BS_Min: 50, BS_Max: 1000, BPL_Min: 200, BPL_Max: 7000, ST_Min: 10, ST_Max: 50, BPD_Min: 15, BPD_Max: 500 }
  },
  {
    name: "East Asia Research", emoji: "🔬",
    values: { B: 600000, L: 500, D: 1000, BS_Min: 5, BS_Max: 900, BPL_Min: 300, BPL_Max: 6000, ST_Min: 2, ST_Max: 15, BPD_Min: 100, BPD_Max: 2500 }
  },
  {
    name: "Global History of Science", emoji: "🌍",
    values: { B: 120000, L: 800, D: 1300, BS_Min: 100, BS_Max: 1000, BPL_Min: 10, BPL_Max: 1500, ST_Min: 8, ST_Max: 40, BPD_Min: 10, BPD_Max: 800 }
  }
];

function toggleMenu() {
    isMenuOpen.value = !isMenuOpen.value;
}

function markAsCustom() {
    if (!isLoading.value && !isCustomConfig.value) {
        isCustomConfig.value = true;
        selectedPresetName.value = null;
    }
}

function applyPreset(preset) {
    numBooks.value = preset.values.B;
    numLibraries.value = preset.values.L;
    numDays.value = preset.values.D;
    bookScoreMin.value = preset.values.BS_Min;
    bookScoreMax.value = preset.values.BS_Max;
    booksPerLibraryMin.value = preset.values.BPL_Min;
    booksPerLibraryMax.value = preset.values.BPL_Max;
    signupTimeMin.value = preset.values.ST_Min;
    signupTimeMax.value = preset.values.ST_Max;
    booksPerDayMin.value = preset.values.BPD_Min;
    booksPerDayMax.value = preset.values.BPD_Max;
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
            showModal.value = true;
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

function closeModal() { showModal.value = false; }
function copyToClipboard() {
   if (!generatedInput.value) return;
   navigator.clipboard.writeText(generatedInput.value)
       .then(() => alert("Copied!"))
       .catch(err => { console.error('Copy failed: ', err); statusMessage.value = "Copy failed."; isError.value = true; showModal.value = false; });
}
function exportTxt() {
   if (!generatedInput.value) return;
   try {
       const blob = new Blob([generatedInput.value], { type: "text/plain;charset=utf-8" });
       const link = document.createElement("a");
       link.href = URL.createObjectURL(blob);
       link.download = `hashcode_${numBooks.value || 'N'}B_${numLibraries.value || 'N'}L_${numDays.value || 'N'}D.txt`;
       document.body.appendChild(link); link.click(); document.body.removeChild(link);
       URL.revokeObjectURL(link.href);
   } catch (err) { console.error("Export failed:", err); statusMessage.value = "Export failed."; isError.value = true; showModal.value = false; }
}

onBeforeUnmount(() => { stopTimer(); terminateWorker(); });
</script>

<template>
  <div class="relative min-h-screen bg-gray-900 overflow-x-hidden">

    <button
      @click="toggleMenu"
      title="Open Presets"
      class="fixed top-1/2 -translate-y-1/2 right-0 z-30 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-l-md transition-transform duration-300 ease-in-out"
      :class="{ 'translate-x-[-320px] sm:translate-x-[-384px]': isMenuOpen }"
      style="writing-mode: vertical-lr; text-orientation: mixed;"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 inline-block mb-1 transform rotate-180">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6Z" />
      </svg>
      Presets
    </button>

    <div
      class="fixed top-0 right-0 h-full w-80 sm:w-96 bg-gray-800 shadow-2xl z-40 transform transition-transform duration-300 ease-in-out overflow-y-auto"
      :class="{ 'translate-x-0': isMenuOpen, 'translate-x-full': !isMenuOpen }"
    >
      <div class="p-4">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-semibold text-gray-100">Load Preset Scenario</h2>
          <button @click="toggleMenu" title="Close Menu" class="text-gray-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <ul class="space-y-2">
          <li v-for="preset in presets" :key="preset.name">
            <button
              @click="applyPreset(preset)"
              class="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition duration-150 ease-in-out text-gray-200 flex items-center space-x-3 disabled:opacity-50"
               :disabled="isLoading"
               :class="{ 'bg-blue-800 ring-2 ring-blue-400': !isCustomConfig && selectedPresetName === preset.name }"
            >
              <span class="text-xl flex-shrink-0 w-6 text-center">{{ preset.emoji }}</span>
              <span class="text-sm font-medium">{{ preset.name }}</span>
            </button>
          </li>
        </ul>
      </div>
    </div>

     <div
      class="flex flex-col items-center justify-center p-4 sm:p-6 bg-gray-900 min-h-screen font-sans transition-transform duration-300 ease-in-out"
       :class="{ 'translate-x-[-160px] sm:translate-x-[-192px]': isMenuOpen }"
       @click="isMenuOpen ? toggleMenu() : null"
    >
      <div class="w-full max-w-lg bg-gray-800 p-6 md:p-8 rounded-xl shadow-2xl relative z-10" @click.stop>
        <div class="flex justify-center mb-4">
          <img class="w-2/3 sm:w-1/2 h-auto max-h-24 object-contain" src="/hashcode_problem.png" alt="logo" />
        </div>
        <h1 class="text-xl sm:text-2xl font-bold text-gray-100 mb-2 text-center">Book Scanning - Input Generator</h1>

        <p class="text-center text-sm text-gray-400 mb-5 -mt-1">
          <span v-if="!isCustomConfig && selectedPresetName">Using Preset: <span class="font-semibold text-gray-300">{{ selectedPresetName }}</span></span>
          <span v-else>Custom Configuration</span>
        </p>


        <fieldset class="space-y-1">
          <form @submit.prevent="handleFormSubmit" id="generation-form" ref="formRef" novalidate>

            <div class="flex flex-col sm:flex-row sm:space-x-4 space-y-3 sm:space-y-0">
               <div class="flex-1">
                  <label for="numBooks" class="block text-gray-300 font-semibold mb-1 text-sm sm:text-base">Books</label>
                  <input  :disabled="isLoading" id="numBooks" ref="numBooksRef"
                         v-model.number="numBooks" @input="markAsCustom(); checkCrossFieldValidity('numBooks')" @blur="checkCrossFieldValidity('numBooks')"
                         type="number" min="1" max="1000000" required
                         class="w-full p-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg placeholder-gray-400 disabled:opacity-50
                                focus:ring focus:ring-green-500 focus:border-green-500
                                invalid:border-red-500 invalid:ring-red-500 invalid:text-red-400"/>
                   <div class="h-3"></div>
               </div>
               <div class="flex-1">
                  <label for="numLibraries" class="block text-gray-300 font-semibold mb-1 text-sm sm:text-base">Libraries</label>
                  <input  :disabled="isLoading" id="numLibraries" v-model.number="numLibraries" @input="markAsCustom" type="number" min="1" max="2500" required
                         class="w-full p-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg placeholder-gray-400 disabled:opacity-50
                                focus:ring focus:ring-green-500 focus:border-green-500
                                invalid:border-red-500 invalid:ring-red-500 invalid:text-red-400"/>
                  <div class="h-3"></div>
               </div>
               <div class="flex-1">
                  <label for="numDays" class="block text-gray-300 font-semibold mb-1 text-sm sm:text-base">Days</label>
                  <input  :disabled="isLoading" id="numDays" v-model.number="numDays" @input="markAsCustom" type="number" min="1" max="2000" required
                         class="w-full p-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg placeholder-gray-400 disabled:opacity-50
                                focus:ring focus:ring-green-500 focus:border-green-500
                                invalid:border-red-500 invalid:ring-red-500 invalid:text-red-400"/>
                  <div class="h-3"></div>
               </div>
            </div>

            <div class="flex flex-col sm:flex-row sm:space-x-4 space-y-3 sm:space-y-0 mt-3">
                <div class="flex-1">
                   <label class="block text-gray-300 font-semibold mb-1 text-sm sm:text-base">Book Score Range</label>
                   <div class="flex space-x-2">
                      <input  :disabled="isLoading" id="bookScoreMin" ref="bookScoreMinRef"
                             v-model.number="bookScoreMin" @input="markAsCustom(); checkCrossFieldValidity('bookScoreMin')" @blur="checkCrossFieldValidity('bookScoreMin')"
                             type="number" placeholder="Min" required min="1" max="1000"
                             class="w-1/2 p-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg placeholder-gray-400 disabled:opacity-50
                                    focus:ring focus:ring-green-500 focus:border-green-500
                                    invalid:border-red-500 invalid:ring-red-500 invalid:text-red-400"/>
                      <input  :disabled="isLoading" id="bookScoreMax" ref="bookScoreMaxRef"
                             v-model.number="bookScoreMax" @input="markAsCustom(); checkCrossFieldValidity('bookScoreMax')" @blur="checkCrossFieldValidity('bookScoreMax')"
                             type="number" placeholder="Max" required min="1" max="1000"
                             class="w-1/2 p-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg placeholder-gray-400 disabled:opacity-50
                                    focus:ring focus:ring-green-500 focus:border-green-500
                                    invalid:border-red-500 invalid:ring-red-500 invalid:text-red-400"/>
                   </div>
                   <div class="h-3"></div>
                </div>
                <div class="flex-1">
                   <label class="block text-gray-300 font-semibold mb-1 text-sm sm:text-base">Books Per Library Range</label>
                   <div class="flex space-x-2">
                      <input  :disabled="isLoading" id="booksPerLibraryMin" ref="booksPerLibraryMinRef"
                             v-model.number="booksPerLibraryMin" @input="markAsCustom(); checkCrossFieldValidity('booksPerLibraryMin')" @blur="checkCrossFieldValidity('booksPerLibraryMin')"
                             type="number" placeholder="Min" required min="1" max="10000"
                             class="w-1/2 p-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg placeholder-gray-400 disabled:opacity-50
                                    focus:ring focus:ring-green-500 focus:border-green-500
                                    invalid:border-red-500 invalid:ring-red-500 invalid:text-red-400"/>
                      <input  :disabled="isLoading" id="booksPerLibraryMax" ref="booksPerLibraryMaxRef"
                             v-model.number="booksPerLibraryMax" @input="markAsCustom(); checkCrossFieldValidity('booksPerLibraryMax')" @blur="checkCrossFieldValidity('booksPerLibraryMax')"
                             type="number" placeholder="Max" required min="1" max="10000"
                             class="w-1/2 p-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg placeholder-gray-400 disabled:opacity-50
                                    focus:ring focus:ring-green-500 focus:border-green-500
                                    invalid:border-red-500 invalid:ring-red-500 invalid:text-red-400"/>
                   </div>
                   <div class="h-3"></div>
                </div>
            </div>

             <div class="flex flex-col sm:flex-row sm:space-x-4 space-y-3 sm:space-y-0 mt-3">
                <div class="flex-1">
                   <label class="block text-gray-300 font-semibold mb-1 text-sm sm:text-base">Sign-Up Time Range</label>
                   <div class="flex space-x-2">
                      <input  :disabled="isLoading" id="signupTimeMin" ref="signupTimeMinRef"
                             v-model.number="signupTimeMin" @input="markAsCustom(); checkCrossFieldValidity('signupTimeMin')" @blur="checkCrossFieldValidity('signupTimeMin')"
                             type="number" placeholder="Min" required min="1" max="50"
                             class="w-1/2 p-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg placeholder-gray-400 disabled:opacity-50
                                    focus:ring focus:ring-green-500 focus:border-green-500
                                    invalid:border-red-500 invalid:ring-red-500 invalid:text-red-400"/>
                      <input  :disabled="isLoading" id="signupTimeMax" ref="signupTimeMaxRef"
                             v-model.number="signupTimeMax" @input="markAsCustom(); checkCrossFieldValidity('signupTimeMax')" @blur="checkCrossFieldValidity('signupTimeMax')"
                             type="number" placeholder="Max" required min="1" max="50"
                             class="w-1/2 p-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg placeholder-gray-400 disabled:opacity-50
                                    focus:ring focus:ring-green-500 focus:border-green-500
                                    invalid:border-red-500 invalid:ring-red-500 invalid:text-red-400"/>
                   </div>
                   <div class="h-3"></div>
                </div>
                <div class="flex-1">
                   <label class="block text-gray-300 font-semibold mb-1 text-sm sm:text-base">Books Shipped / Day Range</label>
                   <div class="flex space-x-2">
                      <input  :disabled="isLoading" id="booksPerDayMin" ref="booksPerDayMinRef"
                             v-model.number="booksPerDayMin" @input="markAsCustom(); checkCrossFieldValidity('booksPerDayMin')" @blur="checkCrossFieldValidity('booksPerDayMin')"
                             type="number" placeholder="Min" required min="1" max="2500"
                             class="w-1/2 p-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg placeholder-gray-400 disabled:opacity-50
                                    focus:ring focus:ring-green-500 focus:border-green-500
                                    invalid:border-red-500 invalid:ring-red-500 invalid:text-red-400"/>
                      <input  :disabled="isLoading" id="booksPerDayMax" ref="booksPerDayMaxRef"
                             v-model.number="booksPerDayMax" @input="markAsCustom(); checkCrossFieldValidity('booksPerDayMax')" @blur="checkCrossFieldValidity('booksPerDayMax')"
                             type="number" placeholder="Max" required min="1" max="2500"
                             class="w-1/2 p-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg placeholder-gray-400 disabled:opacity-50
                                    focus:ring focus:ring-green-500 focus:border-green-500
                                    invalid:border-red-500 invalid:ring-red-500 invalid:text-red-400"/>
                   </div>
                   <div class="h-3"></div>
                </div>
             </div>

            <div class="flex items-center space-x-4 mt-6">
              <button type="submit" :disabled="isLoading" class="flex-grow bg-green-600 text-white py-2.5 px-4 rounded-lg hover:bg-green-700 transition duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-h-[44px]">
                <svg v-if="isLoading" class="animate-spin flex-shrink-0 -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <span>{{ isLoading ? 'Generating...' : 'Generate' }}</span>
                <span v-if="isLoading" class="text-gray-200 text-xs ml-2 tabular-nums"> ({{ elapsedTime }}s)</span>
              </button>
              <button v-if="isLoading" @click="cancelGeneration" type="button" title="Cancel Generation" class="bg-red-600 text-white p-2.5 rounded-lg hover:bg-red-700 transition duration-200 flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </form>
        </fieldset>

        <div v-if="isLoading" class="w-full bg-gray-600 rounded-full h-2.5 mt-4 mb-1 dark:bg-gray-700">
            <div class="bg-blue-500 h-2.5 rounded-full transition-all duration-150 ease-linear" :style="{ width: generationProgress + '%' }"></div>
        </div>
        <p v-if="isLoading" class="text-center text-xs text-gray-400 mb-3">{{ generationProgress.toFixed(0) }}% Complete</p>


         <p v-if="statusMessage"
           :class="{'text-red-400': isError, 'text-green-400': !isError && statusMessage.includes('successful'), 'text-yellow-500': statusMessage.includes('cancelled'), 'text-gray-400': !isError && !statusMessage.includes('successful') && !statusMessage.includes('cancelled')}"
           class="text-center mt-4 text-sm min-h-[1.25em]">
          {{ statusMessage }}
        </p>

      </div>
    </div>


    <div v-if="showModal" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 p-4 backdrop-blur-sm z-50">
      <div class="relative bg-gray-800 p-6 rounded-lg shadow-xl max-w-2xl w-full border border-gray-700 flex flex-col" style="max-height: 90vh;">
        <button @click="closeModal" title="Close" class="absolute top-3 right-3 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full p-1.5 transition duration-150 ease-in-out z-10">
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"> <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /> </svg>
        </button>
        <h2 class="text-xl font-semibold text-gray-100 mb-4 flex-shrink-0 pr-8">Generated Input</h2>
        <pre class="bg-gray-900 border border-gray-700 p-4 rounded-lg overflow-auto text-gray-200 text-sm flex-grow mb-5">{{ generatedInput }}</pre>
        <div class="flex justify-end space-x-3 flex-shrink-0">
           <button @click="copyToClipboard" title="Copy to Clipboard" class="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition duration-200 flex items-center justify-center"> <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m9.75 11.625-3.75-3.75M9.375 7.5h1.5v1.5h-1.5V7.5Z" /></svg> </button>
           <button @click="exportTxt" title="Export as .txt" class="bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700 transition duration-200 flex items-center justify-center"> <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg> </button>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
pre::-webkit-scrollbar { width: 8px; height: 8px; }
pre::-webkit-scrollbar-track { background: #4a5568; border-radius: 4px; }
pre::-webkit-scrollbar-thumb { background-color: #718096; border-radius: 4px; border: 2px solid #4a5568; }
pre::-webkit-scrollbar-thumb:hover { background-color: #a0aec0; }
pre { scrollbar-width: thin; scrollbar-color: #718096 #4a5568; }
.min-h-\[1\.25em\] { min-height: 1.25em; }
.tabular-nums { font-variant-numeric: tabular-nums; }
.min-h-\[44px\] { min-height: 44px; }
.h-3 { height: 0.75rem; }

.invalid\:border-red-500:invalid { border-color: #ef4444; }
.invalid\:ring-red-500:invalid { --tw-ring-color: #ef4444; }
.invalid\:text-red-400:invalid { color: #f87171; }

[style*="writing-mode: vertical-rl"] {
    writing-mode: vertical-rl;
    text-orientation: mixed;
}
</style>