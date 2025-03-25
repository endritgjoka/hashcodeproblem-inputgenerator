<template>
  <div class="flex flex-col items-center justify-center p-6 bg-gray-100 min-h-screen">
    <div class="w-full max-w-lg bg-white p-10 rounded-lg shadow-lg">
      <h1 class="text-2xl font-bold text-gray-800 mb-4 text-center">Google Hash Code Input Generator</h1>

      <form @submit.prevent="generateOutput" class="space-y-4">
        <!-- Number of Books -->
        <div>
          <label class="block text-gray-700 font-semibold">Number of Books</label>
          <input v-model="numBooks" type="number" min="1" required class="w-full p-2 border rounded-lg focus:ring focus:ring-green-300" />
        </div>

        <!-- Number of Libraries -->
        <div>
          <label class="block text-gray-700 font-semibold">Number of Libraries</label>
          <input v-model="numLibraries" type="number" min="1" required class="w-full p-2 border rounded-lg focus:ring focus:ring-green-300" />
        </div>

        <!-- Number of Days -->
        <div>
          <label class="block text-gray-700 font-semibold">Number of Days</label>
          <input v-model="numDays" type="number" min="1" required class="w-full p-2 border rounded-lg focus:ring focus:ring-green-300" />
        </div>

        <button type="submit" class="w-full bg-green-500 text-white py-2 mt-4 rounded-lg hover:bg-green-600 transition">
          Generate
        </button>
      </form>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="fixed inset-0 flex items-center justify-center bg-opacity-50 p-4">
      <div class="bg-white p-6 rounded-lg shadow-lg max-w-xl w-full">
        <h2 class="text-xl font-semibold text-gray-800">Generated Output</h2>
        <pre class="bg-gray-100 p-3 rounded-lg mt-2 overflow-auto max-h-60">{{ generatedOutput }}</pre>

        <div class="flex justify-end space-x-2 mt-4">
          <button @click="copyToClipboard" class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">Copy</button>
          <button @click="exportTxt" class="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600">Export</button>
          <button @click="showModal = false" class="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      numBooks: "",
      numLibraries: "",
      numDays: "",
      generatedOutput: "",
      showModal: false,
      errors: {
        numBooks: "",
        numLibraries: "",
        numDays: "",
      },
    };
  },
  methods: {
    generateOutput() {
      const books = parseInt(this.numBooks);
      const libraries = parseInt(this.numLibraries);
      const days = parseInt(this.numDays);

      let output = [`${books} ${libraries} ${days}`];
      let bookScores = Array.from({ length: books }, () => Math.floor(Math.random() * 100) + 1);
      output.push(bookScores.join(" "));

      for (let i = 0; i < libraries; i++) {
        let numBooksInLib = Math.min(Math.floor(Math.random() * books) + 1, books);
        let signupTime = Math.floor(Math.random() * Math.max(1, days / 2)) + 1;
        let booksPerDay = Math.floor(Math.random() * Math.max(1, numBooksInLib / 2)) + 1;
        let libraryBooks = [...Array(books).keys()].sort(() => 0.5 - Math.random()).slice(0, numBooksInLib);
        output.push(`${numBooksInLib} ${signupTime} ${booksPerDay}`);
        output.push(libraryBooks.join(" "));
      }

      this.generatedOutput = output.join("\n");
      this.showModal = true;
    },
    copyToClipboard() {
      navigator.clipboard.writeText(this.generatedOutput).then(() => alert("Copied to clipboard!"));
    },
    exportTxt() {
      const blob = new Blob([this.generatedOutput], { type: "text/plain" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "hashcode_input.txt";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
  },
};
</script>
