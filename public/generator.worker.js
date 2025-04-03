// public/generator.worker.js

// Helper function (needs to be self-contained within the worker)
const randBetween = (min, max) => {
    // Ensure min/max are numbers and min <= max
    min = Number(min);
    max = Number(max);
    if (isNaN(min) || isNaN(max)) {
      console.error("Invalid non-numeric input to randBetween:", min, max);
      return NaN; // Or throw an error
    }
    if (min > max) {
      console.warn("randBetween called with min > max. Swapping them.", min, max);
      [min, max] = [max, min]; // Swap them
    }
     // Handle case where min === max
    if (min === max) {
      return min;
    }
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };
  
  
  // Listen for messages from the main thread
  self.onmessage = function(event) {
    console.log("Worker received data:", event.data);
    const params = event.data;
  
    try {
      // --- Generation Logic (copied and adapted from your component method) ---
      const books = params.numBooks;
      const libraries = params.numLibraries;
      const days = params.numDays;
      const scoreMin = params.bookScoreMin;
      const scoreMax = params.bookScoreMax;
      const booksLibMin = params.booksPerLibraryMin;
      // Ensure max books per lib doesn't exceed total books
      const effectiveBooksLibMax = Math.min(params.booksPerLibraryMax, books);
      const signupMin = params.signupTimeMin;
      const signupMax = params.signupTimeMax;
      const shipMin = params.booksPerDayMin;
      const shipMax = params.booksPerDayMax;
  
      // Basic validation within worker (optional, but good practice)
       if (books <= 0 || libraries <= 0 || days <= 0) {
        throw new Error("Invalid parameters: Books, Libraries, and Days must be positive.");
      }
       if (scoreMin > scoreMax || booksLibMin > effectiveBooksLibMax || signupMin > signupMax || shipMin > shipMax) {
         throw new Error("Invalid ranges: Minimum cannot be greater than maximum.");
       }
        if (booksLibMin > effectiveBooksLibMax) {
          // This specific check might be better handled pre-emptively in the main thread,
          // but we can include it here for robustness.
          throw new Error(`Minimum books per library (${booksLibMin}) cannot be greater than the effective maximum (${effectiveBooksLibMax}).`);
        }
  
  
      let output = [`${books} ${libraries} ${days}`];
      let bookScores = Array.from({ length: books }, () => randBetween(scoreMin, scoreMax));
      output.push(bookScores.join(" "));
  
      const allBookIndices = Array.from({ length: books }, (_, k) => k);
  
      for (let i = 0; i < libraries; i++) {
        // Check for potential infinite loops if randBetween returns NaN or invalid ranges somehow slip through
        let numBooksInLib = randBetween(booksLibMin, effectiveBooksLibMax);
        let signupTime = randBetween(signupMin, signupMax);
        let booksPerDay = randBetween(shipMin, shipMax);
  
         if (isNaN(numBooksInLib) || isNaN(signupTime) || isNaN(booksPerDay)) {
           console.error("NaN detected during generation", {numBooksInLib, signupTime, booksPerDay});
           throw new Error("NaN detected during random number generation. Check ranges.");
         }
  
        let shuffledIndices = [...allBookIndices].sort(() => 0.5 - Math.random());
        // Ensure slice length doesn't exceed available indices (shouldn't happen with current logic, but safeguard)
        let libraryBooks = shuffledIndices.slice(0, Math.min(numBooksInLib, shuffledIndices.length));
  
        output.push(`${numBooksInLib} ${signupTime} ${booksPerDay}`);
        output.push(libraryBooks.sort((a, b) => a - b).join(" "));
  
         // Optional: Send progress update periodically (more complex)
         // if (i % 100 === 0 && i > 0) {
         //   self.postMessage({ type: 'progress', value: (i / libraries) * 100 });
         // }
      }
  
      const result = output.join("\n");
      // --- End of Generation Logic ---
  
      console.log("Worker finished generation.");
      // Send the result back to the main thread
      self.postMessage({ type: 'result', data: result });
  
    } catch (error) {
      console.error("Error in worker:", error);
      // Send error back to the main thread
      self.postMessage({ type: 'error', message: error.message });
    } finally {
        // You could close the worker here if it's truly single-use per button press
        // self.close();
    }
  };
  
  // Handle potential errors loading the worker script itself (less common)
  self.onerror = function(event) {
      console.error("Unhandled error in worker:", event);
      // You could try posting an error back, but the worker might be broken
      // self.postMessage({ type: 'error', message: 'Worker script error: ' + event.message });
  };
  
  console.log("Worker script loaded."); // For debugging