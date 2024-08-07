const { chromium } = require('playwright');

async function getTeamLinks(page, url, maxRetries = 10) {
  let retries = 0;
  let teamLinks = [];
  while (retries < maxRetries) {

    try {
      await page.goto(url, { timeout: 200000, waitUntil: 'domcontentloaded' });

      // Wait for the main container to be present
      await page.waitForSelector('main', { timeout: 30000 });
      console.log('Main container loaded.');

      // Extract team links
      teamLinks = await page.$$eval('a[href^="/team/football/"]', (elements) => {
        return elements.map(element => {
          const teamNameElement = element.querySelector('.Text.GvzuH');
          return teamNameElement ? {
            name: teamNameElement.textContent.trim(),
            url: element.href
          } : null; // Return null if team name element is not found
        }).filter(link => link !== null); // Filter out any null results
      });

      // Log the extracted team links
      //console.log(`Team Links Found: ${teamLinks.length}`);
      teamLinks.forEach(link => {
        //console.log(`Team: ${link.name}, URL: ${link.url}`);
      });

      if (teamLinks.length > 0) {
        break; // Exit loop if team links were found
      }

    } catch (error) {
      console.error(`Error on attempt ${retries + 1}:`, error);
    } finally {
      console.log('what happens?')
      retries++;
    }
  }

  if (teamLinks.length === 0) {
    console.error(`Failed to extract team links after ${maxRetries} attempts.`);
  }

  return teamLinks;
}

module.exports = getTeamLinks;
