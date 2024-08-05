const { chromium } = require('playwright');
const fs = require('fs');
// const extractPlayer = require('./extractPlayer');
const extractTeam = require('./extractTeam');
const extractCoach = require('./extractCoach');
const getAttributes = require('./getAttributes');
const getImage = require('./scrapeImage')



let world = { nat: {} };
let nat = { name: '', leagues: [] };
let league = { name: '', teams: [] };
let teams = [];

async function main() {
  const browser = await chromium.launch({ headless: true }); // Set to false for non-headless mode
  const page = await browser.newPage();
  const testURL = 'https://www.sofascore.com/team/football/lecce/2689';
  // 'https://www.sofascore.com/player/mattia-viti/1009268';
  // 'https://www.sofascore.com/team/football/real-madrid/2829'
  
  // Extract team information
  let team = await extractTeam(page, testURL, false);
  console.log('Extracted team information:', team);
  //Extract coach
  console.log(team.coachId)
  team.coach = await extractCoach(page, team.coachLink, team.coachId);
    //Extract attributes for all players if exist
  
  team.rosterATTR = [];
  for (let index = 0; index <  team.roster.length; index++) {
    const player = team.roster[index];
    const attr = await getAttributes(page, player.url);
    const imgURL = 'https://api.sofascore.app/api/v1/player/'+ player.id + '/image'
    console.log(imgURL);
    image = getImage(imgURL, player.id, 'player');
    const playerATTR = { ...player, attr: attr, image: image };
    console.log(playerATTR);
    team.rosterATTR.push(playerATTR);
  };
  
  console.log('Extracted teamATTR information:', team);

  // Convert the team object to JSON format
  const teamJSON = JSON.stringify(team, null, 2);
  fs.writeFile(team.abbr + '.json', teamJSON, 'utf8', (err) => {
    if (err) {
      console.error('An error occurred while writing JSON to file:', err);
    } else {
      console.log('JSON file has been saved.');
    }
  });
  
  await browser.close();
}

// Call the main function
main().catch(err => {
  console.error(err);
});
