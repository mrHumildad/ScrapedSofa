//onst { chromium } = require('playwright'); // Ensure Playwright is imported
//const fs = require('fs'); // File system module for writing files
const getImage = require('./scrapeImage');

async function extractCoach(page, url, id, teamId) {
  const maxRetries = 3;
  let attempt = 0;
  let success = false;
  let coach = {team: teamId};

  while (attempt < maxRetries && !success) {
    try {
      await page.goto(url, { timeout: 200000, waitUntil: 'domcontentloaded' });
      console.log('Extracting Coach:', url);

      // Get the JSON data from the page
      const nextData = await page.$eval('#__NEXT_DATA__', el => el.textContent);
      const json = JSON.parse(nextData);
			/* console.log('*** json.props.pageProps')
			console.log(json.props.pageProps);
			console.log('*** json.props.pageProps')
			console.log(json.props.pageProps);
			console.log('GOING AHEAD') */
			const props = json.props.pageProps;
      const managerDetails = json.props.pageProps.managerDetails.manager;
      coach = {
				id: id,
        name: managerDetails.shortName,
        favFormation: managerDetails.preferredFormation,
        nat: managerDetails.nationality,
        url: url,
				birth: managerDetails.dateOfBirthTimestamp,
        performance: {
          total: managerDetails.performance.total,
          wins: managerDetails.performance.wins,
          draws: managerDetails.performance.draws,
          losses: managerDetails.performance.losses,
          goalsScored: managerDetails.performance.goalsScored,
          goalsConceded: managerDetails.performance.goalsConceded,
          totalPoints: managerDetails.performance.totalPoints,
        }
      };

      //console.log('Manager Data:', coach);
      success = true; // Mark as successful
    } catch (error) {
      console.error(`Error in extractCoach for URL ${url} on attempt ${attempt + 1}:`, error.message);
      attempt++;
      if (attempt >= maxRetries) {
        console.error('Max retries reached. Returning empty attributes.');
        return {}; // Return an empty object on error
      }
    }
  }
	console.log(coach.id);
	const imgURL = 'https://api.sofascore.app/api/v1/manager/' + coach.id + '/image'
  console.log(imgURL);
	coach.image = getImage(imgURL, coach.id, 'coaches');
	return coach;
}

module.exports = extractCoach;

// Main execution function
/* (async () => {
  const browser = await chromium.launch({ headless: true }); // Launch the browser
  const page = await browser.newPage(); // Open a new page
  const url = 'https://www.sofascore.com/manager/luca-gotti/793664';
  const coach = await extractCoach(page, url);
  console.log('Coach object:', coach);
  
  // Optionally, write coach object to a file
  /* fs.writeFileSync('coach.json', JSON.stringify(coach, null, 2), 'utf8');
  console.log('Coach object written to coach.json'); 

  await browser.close(); // Close the browser
})(); */
