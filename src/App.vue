<script setup>
import { ref } from "vue";

const numBooks = ref("");
const numLibraries = ref("");
const numDays = ref("");
const generatedOutput = ref("");
const showModal = ref(false);

const generateOutput = () => {
  const books = parseInt(numBooks.value);
  const libraries = parseInt(numLibraries.value);
  const days = parseInt(numDays.value);

  if (isNaN(books) || isNaN(libraries) || isNaN(days) || books < 1 || libraries < 1 || days < 1) {
    alert("Please enter valid positive numbers.");
    return;
  }

  let output = [];
  output.push(`${books} ${libraries} ${days}`);

  let bookScores = Array.from({ length: books }, () => Math.floor(Math.random() * 100) + 1);
  output.push(bookScores.join(" "));

  for (let i = 0; i < libraries; i++) {
    let numBooksInLib = Math.min(Math.floor(Math.random() * books) + 1, books);
    let signupTime = Math.floor(Math.random() * Math.max(1, days / 2)) + 1;
    let booksPerDay = Math.floor(Math.random() * Math.max(1, numBooksInLib / 2)) + 1;

    let libraryBooks = [...Array(books).keys()]
        .sort(() => 0.5 - Math.random())
        .slice(0, numBooksInLib);

    output.push(`${numBooksInLib} ${signupTime} ${booksPerDay}`);
    output.push(libraryBooks.join(" "));
  }

  generatedOutput.value = output.join("\n");
  showModal.value = true;
};


const copyToClipboard = () => {
  navigator.clipboard.writeText(generatedOutput.value);
  alert("Copied to clipboard!");
};

const exportTxt = () => {
  const blob = new Blob([generatedOutput.value], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "hashcode_input.txt";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
</script>

<template>
  <div class="container">
    <h2>Google Hash Code 2020 Input Generator</h2>

    <div class="input-container">
      <label>Number of Books:</label>
      <input v-model="numBooks" type="number" min="1" required />

      <label>Number of Libraries:</label>
      <input v-model="numLibraries" type="number" min="1" required />

      <label>Number of Days for Scanning:</label>
      <input v-model="numDays" type="number" min="1" required />

      <button @click="generateOutput">Generate Output</button>
    </div>

    <div v-if="showModal" class="modal">
      <div class="modal-content">
        <h3>Generated Output</h3>
        <pre>{{ generatedOutput }}</pre>
        <button @click="copyToClipboard">Copy</button>
        <button @click="exportTxt">Export as .txt</button>
        <button @click="showModal = false">Close</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  text-align: center;
  max-width: 400px;
  margin: 20px auto;
  padding: 20px;
  border-radius: 8px;
  background: #666161;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.input-group {
  margin-bottom: 15px;
}

label {
  display: block;
  font-weight: bold;
}

input {
  width: 100%;
  padding: 8px;
  font-size: 16px;
  margin-top: 5px;
}

button {
  background: #42b883;
  color: white;
  border: none;
  padding: 10px 15px;
  margin-top: 10px;
  cursor: pointer;
  font-size: 16px;
  border-radius: 5px;
}

button:hover {
  background: #36996f;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.modal-content {
  background: #918c8c;
  padding: 20px;
  border-radius: 8px;
  text-align: left;
  max-width: 90%;
  max-height: 80%;
  overflow: auto;
  white-space: pre-wrap; 
}

pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}

.modal-buttons button {
  margin: 5px;
}
</style>
