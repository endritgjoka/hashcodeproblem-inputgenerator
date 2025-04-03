<script setup>
import { ref, reactive, onBeforeUnmount, nextTick } from 'vue';

// --- Refs for Input Values ---
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

// --- Refs for Input Elements (needed for setCustomValidity) ---
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
// --- State (unchanged) ---
const generatedInput = ref("");
const showModal = ref(false);
const isLoading = ref(false);
const worker = ref(null);
const statusMessage = ref(""); 
const isError = ref(false);
const isCancelled = ref(false);
const elapsedTime = ref(0);
const timerInterval = ref(null);


// --- Timer Functions --- (unchanged)
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

// --- Worker Termination --- (unchanged)
function terminateWorker() {
    if (worker.value) {
        console.log("Terminating worker...");
        worker.value.terminate();
        worker.value = null;
        console.log("Worker terminated.");
    }
}

// --- Custom Cross-Field Validation Logic ---
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


// --- Submit Handling ---
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

// --- Generation Logic ---
function triggerGeneration() {
  if (isLoading.value) return;

  isLoading.value = true;
  isCancelled.value = false;
  generatedInput.value = "";
  statusMessage.value = ""; 
  isError.value = false;
  startTimer();

  try {
    terminateWorker();
    worker.value = new Worker('/generator.worker.js');
    console.log("Worker created.");

    worker.value.onmessage = (event) => {
        if (isCancelled.value || !isLoading.value) {
            console.log("%c Worker message ignored (cancelled/not loading).", "color: orange", event.data?.type);
            terminateWorker(); stopTimer(); if(isLoading.value) isLoading.value = false; return;
        }
        console.log("Main received message:", event.data);
        stopTimer();
        if (event.data.type === 'result') {
            generatedInput.value = event.data.data;
            showModal.value = true;
            isError.value = false;
        } else if (event.data.type === 'error') {
            statusMessage.value = `Generation Error: ${event.data.message}`;
            isError.value = true; console.error("Worker Error:", event.data.message);
        }
        isLoading.value = false; terminateWorker();
    };

    worker.value.onerror = (error) => {
         if (isCancelled.value || !isLoading.value) {
             console.log("%c Worker error ignored (cancelled/not loading).", "color: orange");
             terminateWorker(); stopTimer(); if(isLoading.value) isLoading.value = false; return;
         }
        console.error("Error during worker execution:", error);
        stopTimer(); statusMessage.value = `Worker Error: ${error.message || 'Unknown'}`;
        isError.value = true; isLoading.value = false; terminateWorker(); error.preventDefault();
    };

    const params = {
        numBooks: numBooks.value, numLibraries: numLibraries.value, numDays: numDays.value,
        bookScoreMin: bookScoreMin.value, bookScoreMax: bookScoreMax.value,
        booksPerLibraryMin: booksPerLibraryMin.value, booksPerLibraryMax: booksPerLibraryMax.value,
        signupTimeMin: signupTimeMin.value, signupTimeMax: signupTimeMax.value,
        booksPerDayMin: booksPerDayMin.value, booksPerDayMax: booksPerDayMax.value,
    };
    worker.value.postMessage(params);
    console.log("Main sent parameters.");

  } catch (e) {
      console.error("Failed to init/communicate with worker:", e);
      stopTimer(); statusMessage.value = "Failed to initialize generation process.";
      isError.value = true; isLoading.value = false; worker.value = null;
  }
}

// --- Cancellation --- (unchanged)
function cancelGeneration() {
    if (!isLoading.value || !worker.value) { console.log("Cancel invalid state."); return; }
    console.log("%c Cancelling generation...", "color: red; font-weight: bold;");
    isCancelled.value = true; terminateWorker(); stopTimer();
    isLoading.value = false; statusMessage.value = "Generation cancelled.";
    isError.value = false; console.log("%c Cancelled.", "color: red;");
}

// --- Other Methods --- (unchanged)
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

// --- Lifecycle Hook --- (unchanged)
onBeforeUnmount(() => { stopTimer(); terminateWorker(); });
</script>

<template>
  <div class="flex flex-col items-center justify-center p-4 sm:p-6 bg-gray-900 min-h-screen font-sans">
    <div class="w-full max-w-lg bg-gray-800 p-6 md:p-8 rounded-xl shadow-2xl">
      <div class="flex justify-center mb-4">
        <img class="w-2/3 sm:w-1/2 h-auto max-h-24 object-contain" src="/hashcode_problem.png" alt="logo" />
      </div>
      <h1 class="text-xl sm:text-2xl font-bold text-gray-100 mb-5 text-center">Book Scanning Problem - Input Generator</h1>

      <fieldset :disabled="isLoading" class="space-y-1"> 
        <form @submit.prevent="handleFormSubmit" id="generation-form" ref="formRef" novalidate>

          <div class="flex flex-col sm:flex-row sm:space-x-4 space-y-3 sm:space-y-0">
             <div class="flex-1">
                <label for="numBooks" class="block text-gray-300 font-semibold mb-1 text-sm sm:text-base">Books</label>
                <input id="numBooks" ref="numBooksRef"
                       v-model.number="numBooks" @input="checkCrossFieldValidity('numBooks')" @blur="checkCrossFieldValidity('numBooks')"
                       type="number" min="1" max="100000" required
                       class="w-full p-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg placeholder-gray-400 disabled:opacity-50
                              focus:ring focus:ring-green-500 focus:border-green-500
                              invalid:border-red-500 invalid:ring-red-500 invalid:text-red-400"/>
                 <div class="h-3"></div> 
             </div>
             <div class="flex-1">
                <label for="numLibraries" class="block text-gray-300 font-semibold mb-1 text-sm sm:text-base">Libraries</label>
                <input id="numLibraries" v-model.number="numLibraries" type="number" min="1" max="100000" required
                       class="w-full p-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg placeholder-gray-400 disabled:opacity-50
                              focus:ring focus:ring-green-500 focus:border-green-500
                              invalid:border-red-500 invalid:ring-red-500 invalid:text-red-400"/>
                <div class="h-3"></div>
             </div>
             <div class="flex-1">
                <label for="numDays" class="block text-gray-300 font-semibold mb-1 text-sm sm:text-base">Days</label>
                <input id="numDays" v-model.number="numDays" type="number" min="1" max="100000" required
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
                    <input id="bookScoreMin" ref="bookScoreMinRef"
                           v-model.number="bookScoreMin" @input="checkCrossFieldValidity('bookScoreMin')" @blur="checkCrossFieldValidity('bookScoreMin')"
                           type="number" placeholder="Min" required min="1" max="1000"
                           class="w-1/2 p-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg placeholder-gray-400 disabled:opacity-50
                                  focus:ring focus:ring-green-500 focus:border-green-500
                                  invalid:border-red-500 invalid:ring-red-500 invalid:text-red-400"/>
                    <input id="bookScoreMax" ref="bookScoreMaxRef"
                           v-model.number="bookScoreMax" @input="checkCrossFieldValidity('bookScoreMax')" @blur="checkCrossFieldValidity('bookScoreMax')"
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
                    <input id="booksPerLibraryMin" ref="booksPerLibraryMinRef"
                           v-model.number="booksPerLibraryMin" @input="checkCrossFieldValidity('booksPerLibraryMin')" @blur="checkCrossFieldValidity('booksPerLibraryMin')"
                           type="number" placeholder="Min" required min="10" max="1000"
                           class="w-1/2 p-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg placeholder-gray-400 disabled:opacity-50
                                  focus:ring focus:ring-green-500 focus:border-green-500
                                  invalid:border-red-500 invalid:ring-red-500 invalid:text-red-400"/>
                    <input id="booksPerLibraryMax" ref="booksPerLibraryMaxRef"
                           v-model.number="booksPerLibraryMax" @input="checkCrossFieldValidity('booksPerLibraryMax')" @blur="checkCrossFieldValidity('booksPerLibraryMax')"
                           type="number" placeholder="Max" required min="10" max="1000"
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
                    <input id="signupTimeMin" ref="signupTimeMinRef"
                           v-model.number="signupTimeMin" @input="checkCrossFieldValidity('signupTimeMin')" @blur="checkCrossFieldValidity('signupTimeMin')"
                           type="number" placeholder="Min" required min="1" max="10"
                           class="w-1/2 p-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg placeholder-gray-400 disabled:opacity-50
                                  focus:ring focus:ring-green-500 focus:border-green-500
                                  invalid:border-red-500 invalid:ring-red-500 invalid:text-red-400"/>
                    <input id="signupTimeMax" ref="signupTimeMaxRef"
                           v-model.number="signupTimeMax" @input="checkCrossFieldValidity('signupTimeMax')" @blur="checkCrossFieldValidity('signupTimeMax')"
                           type="number" placeholder="Max" required min="1" max="10"
                           class="w-1/2 p-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg placeholder-gray-400 disabled:opacity-50
                                  focus:ring focus:ring-green-500 focus:border-green-500
                                  invalid:border-red-500 invalid:ring-red-500 invalid:text-red-400"/>
                 </div>
                 <div class="h-3"></div>
              </div>
              <div class="flex-1">
                 <label class="block text-gray-300 font-semibold mb-1 text-sm sm:text-base">Books Shipped / Day Range</label>
                 <div class="flex space-x-2">
                    <input id="booksPerDayMin" ref="booksPerDayMinRef"
                           v-model.number="booksPerDayMin" @input="checkCrossFieldValidity('booksPerDayMin')" @blur="checkCrossFieldValidity('booksPerDayMin')"
                           type="number" placeholder="Min" required min="1" max="100"
                           class="w-1/2 p-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg placeholder-gray-400 disabled:opacity-50
                                  focus:ring focus:ring-green-500 focus:border-green-500
                                  invalid:border-red-500 invalid:ring-red-500 invalid:text-red-400"/>
                    <input id="booksPerDayMax" ref="booksPerDayMaxRef"
                           v-model.number="booksPerDayMax" @input="checkCrossFieldValidity('booksPerDayMax')" @blur="checkCrossFieldValidity('booksPerDayMax')"
                           type="number" placeholder="Max" required min="1" max="100"
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

       <p v-if="statusMessage"
         :class="{'text-red-400': isError, 'text-green-400': !isError && statusMessage.includes('successful'), 'text-yellow-500': !isError && statusMessage.includes('cancelled')}"
         class="text-center mt-4 text-sm min-h-[1.25em]">
        {{ statusMessage }}
      </p>

    </div>

    <div v-if="showModal" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 p-4 backdrop-blur-sm z-50" @click.self="closeModal">
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
</style>