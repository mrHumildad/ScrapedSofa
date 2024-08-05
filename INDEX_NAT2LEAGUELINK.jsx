const { chromium } = require('playwright');

async function getTournamentLinks(url, maxRetries = 10) {
  let retries = 0;
  let tournamentLinks = [];

  while (retries < maxRetries) {
    console.log('***TRY FOR ' + retries + ' TIME')
    const browser = await chromium.launch({ headless: true }); // Set to false for non-headless mode
    const page = await browser.newPage();
    
    try {
      await page.goto(url, { timeout: 200000, waitUntil: 'domcontentloaded' });

      // Wait for the main container to be present
      await page.waitForSelector('main', { timeout: 30000 });
      console.log('Main container loaded.');

      // Extract tournament links
      tournamentLinks = await page.$$eval('a[href^="/tournament/football/italy/"]', (elements) => {
        return elements.slice(0, 2).map(element => ({
          name: element.textContent.trim(),
          url: element.href
        }));
      });

      // Log the extracted tournament links
      console.log(`Tournament Links Found: ${tournamentLinks.length}`);
      tournamentLinks.forEach(link => {
        console.log(`Tournament: ${link.name}, URL: ${link.url}`);
      });

      if (tournamentLinks.length > 0) {
        break;
      }

    } catch (error) {
      console.error(`Error on attempt ${retries + 1}:`, error);
    } finally {
      await browser.close();
      retries++;
    }
  }

  if (tournamentLinks.length === 0) {
    console.error(`Failed to extract tournament links after ${maxRetries} attempts.`);
  }

  return tournamentLinks;
}

// Main execution loop
(async () => {
  const natURL = 'https://www.sofascore.com/football/italy'; // Replace with your target URL
  const tournamentLinks = await getTournamentLinks(natURL);
  
  // You can use the tournamentLinks array here if needed
})();
