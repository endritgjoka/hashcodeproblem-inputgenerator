<template>
  <div class="flex flex-col items-center justify-center p-6 bg-gray-100 min-h-screen bg-cover bg-no-repeat bg-center">
    <div class="w-full max-w-xl bg-white p-14 rounded-xl shadow-2xl">
      <div class="flex justify-center mb-8">
        <img class="w-1/2 h-1/2" src="/hashcode_problem.png" alt="logo" />
      </div>
      <h1 class="text-2xl font-bold text-gray-800 mb-8 text-center">Book Scanning Problem - Input Generator</h1>

      <form @submit.prevent="generateInput" class="space-y-4">
        <div>
          <label class="block text-gray-700 font-semibold">Number of Books</label>
          <input v-model="numBooks" type="number" min="1" max="100000" required class="w-full p-2 border rounded-lg focus:ring focus:ring-green-300"/>
        </div>

        <div>
          <label class="block text-gray-700 font-semibold">Number of Libraries</label>
          <input v-model="numLibraries" type="number" min="1" max="100000" required class="w-full p-2 border rounded-lg focus:ring focus:ring-green-300"/>
        </div>

        <div>
          <label class="block text-gray-700 font-semibold">Number of Days</label>
          <input v-model="numDays" type="number" min="1" max="100000" required class="w-full p-2 border rounded-lg focus:ring focus:ring-green-300"/>
        </div>

        <div>
          <label class="block text-gray-700 font-semibold">Book Score Range</label>
          <div class="flex space-x-2">
            <input v-model="bookScoreMin" type="number" placeholder="Min" required class="w-1/2 p-2 border rounded-lg focus:ring focus:ring-green-300"/>
            <input v-model="bookScoreMax" type="number" placeholder="Max" required class="w-1/2 p-2 border rounded-lg focus:ring focus:ring-green-300"/>
          </div>
        </div>

        <div>
          <label class="block text-gray-700 font-semibold">Books Per Library Range</label>
          <div class="flex space-x-2">
            <input v-model="booksPerLibraryMin" type="number" placeholder="Min" required class="w-1/2 p-2 border rounded-lg focus:ring focus:ring-green-300"/>
            <input v-model="booksPerLibraryMax" type="number" placeholder="Max" required class="w-1/2 p-2 border rounded-lg focus:ring focus:ring-green-300"/>
          </div>
        </div>

        <div>
          <label class="block text-gray-700 font-semibold">Sign-Up Time Range</label>
          <div class="flex space-x-2">
            <input v-model="signupTimeMin" type="number" placeholder="Min" required class="w-1/2 p-2 border rounded-lg focus:ring focus:ring-green-300"/>
            <input v-model="signupTimeMax" type="number" placeholder="Max" required class="w-1/2 p-2 border rounded-lg focus:ring focus:ring-green-300"/>
          </div>
        </div>

        <!-- Books Shipped Per Library Per Day -->
        <div>
          <label class="block text-gray-700 font-semibold">Books Shipped Per Library Per Day Range</label>
          <div class="flex space-x-2">
            <input v-model="booksPerDayMin" type="number" placeholder="Min" required class="w-1/2 p-2 border rounded-lg focus:ring focus:ring-green-300"/>
            <input v-model="booksPerDayMax" type="number" placeholder="Max" required class="w-1/2 p-2 border rounded-lg focus:ring focus:ring-green-300"/>
          </div>
        </div>

        <button type="submit" class="w-full bg-green-500 text-white py-2 mt-4 rounded-lg hover:bg-green-600 transition">
          Generate
        </button>
      </form>
    </div>

    <div v-if="showModal" class="fixed inset-0 flex items-center justify-center bg-opacity-50 p-4 backdrop-blur-xs">
      <div class="bg-white p-8 rounded-lg shadow-lg max-w-2xl w-full">
        <h2 class="text-xl font-semibold text-gray-800">Generated Input</h2>
        <pre class="bg-gray-100 border border-gray-500 p-3 rounded-lg mt-2 overflow-auto max-h-96">{{ generatedInput }}</pre>

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
      bookScoreMin: 1,
      bookScoreMax: 1000,
      booksPerLibraryMin: 1,
      booksPerLibraryMax: 1000,
      signupTimeMin: 1,
      signupTimeMax: 10,
      booksPerDayMin: 1,
      booksPerDayMax: 50,
      generatedInput: "",
      showModal: false,
    };
  },
  methods: {
    generateInput() {
      const books = parseInt(this.numBooks);
      const libraries = parseInt(this.numLibraries);
      const days = parseInt(this.numDays);

      const randBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

      let output = [`${books} ${libraries} ${days}`];
      let bookScores = Array.from({ length: books }, () => randBetween(this.bookScoreMin, this.bookScoreMax));
      output.push(bookScores.join(" "));

      for (let i = 0; i < libraries; i++) {
        let numBooksInLib = randBetween(this.booksPerLibraryMin, this.booksPerLibraryMax);
        let signupTime = randBetween(this.signupTimeMin, this.signupTimeMax);
        let booksPerDay = randBetween(this.booksPerDayMin, this.booksPerDayMax);
        let libraryBooks = [...Array(books).keys()].sort(() => 0.5 - Math.random()).slice(0, numBooksInLib);
        output.push(`${numBooksInLib} ${signupTime} ${booksPerDay}`);
        output.push(libraryBooks.join(" "));
      }

      this.generatedInput = output.join("\n");
      this.showModal = true;
    },
    copyToClipboard() {
      navigator.clipboard.writeText(this.generatedInput).then(() => alert("Copied to clipboard!"));
    },
    exportTxt() {
      const blob = new Blob([this.generatedInput], { type: "text/plain" });
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
