const randBetween = (min, max) => {
  min = Number(min);
  max = Number(max);
  if (isNaN(min) || isNaN(max)) {
    return NaN;
  }
  if (min > max) {
    [min, max] = [max, min];
  }
  if (min === max) {
    return min;
  }
  return Math.floor(Math.random() * (max - min + 1)) + min;
};


self.onmessage = function(event) {
  const params = event.data;

  try {
    const books = params.numBooks;
    const libraries = params.numLibraries;
    const days = params.numDays;
    const scoreMin = params.bookScoreMin;
    const scoreMax = params.bookScoreMax;
    const booksLibMin = params.booksPerLibraryMin;
    const effectiveBooksLibMax = Math.min(params.booksPerLibraryMax, books);
    const signupMin = params.signupTimeMin;
    const signupMax = params.signupTimeMax;
    const shipMin = params.booksPerDayMin;
    const shipMax = params.booksPerDayMax;

    if (books <= 0 || libraries <= 0 || days <= 0) {
      throw new Error("Invalid parameters: Books, Libraries, and Days must be positive.");
    }
    if (scoreMin > scoreMax || booksLibMin > effectiveBooksLibMax || signupMin > signupMax || shipMin > shipMax) {
      throw new Error("Invalid ranges: Minimum cannot be greater than maximum.");
    }
     if (booksLibMin > books) {
       throw new Error(`Minimum books per library (${booksLibMin}) cannot be greater than the total number of books (${books}).`);
     }


    let output = [`${books} ${libraries} ${days}`];
    let bookScores = Array.from({ length: books }, () => randBetween(scoreMin, scoreMax));
    output.push(bookScores.join(" "));

    let lastReportedProgress = -1;

    for (let i = 0; i < libraries; i++) {
      let numBooksInLib = randBetween(booksLibMin, effectiveBooksLibMax);
      let signupTime = randBetween(signupMin, signupMax);
      let booksPerDay = randBetween(shipMin, shipMax);

      if (isNaN(numBooksInLib) || isNaN(signupTime) || isNaN(booksPerDay)) {
         throw new Error("NaN detected during random number generation. Check ranges.");
      }

      const selectedBookIndices = new Set();
      if (numBooksInLib > books) { 
         numBooksInLib = books;
      }
      while (selectedBookIndices.size < numBooksInLib) {
          selectedBookIndices.add(randBetween(0, books - 1));
      }
      const libraryBooks = Array.from(selectedBookIndices).sort((a, b) => a - b);


      output.push(`${numBooksInLib} ${signupTime} ${booksPerDay}`);
      output.push(libraryBooks.join(" "));

      const currentProgress = Math.round(((i + 1) / libraries) * 100);
      if (currentProgress > lastReportedProgress) {
         self.postMessage({ type: 'progress', value: currentProgress });
         lastReportedProgress = currentProgress;
      }
    }

    if (lastReportedProgress < 100) {
         self.postMessage({ type: 'progress', value: 100 });
    }


    const result = output.join("\n");

    self.postMessage({ type: 'result', data: result });

  } catch (error) {
    self.postMessage({ type: 'error', message: error.message });
  }
};

self.onerror = function(event) {
   self.postMessage({ type: 'error', message: 'Worker script error: ' + event.message });
};