const { chromium } = require('playwright');
const fs = require('fs');
const prompt = require('prompt-sync')();

// const extractPlayer = require('./extractPlayer');
const getTeamLinks = require('./getTeamLinks');
const extractTeam = require('./extractTeam');
const extractCoach = require('./extractCoach');
const getAttributes = require('./getAttributes');
const getImage = require('./scrapeImage');
const leagues = require('./leagues');

//! THIS JUST DOWNLOADS A LEAGUE

const showBanner = (leagues) => {
  console.log('SKRAPED_SOFA');
  console.log('by mrHumildad');
  console.log('https://github.com/mrHumildad/ScrapedSofa');
  console.log(leagues.length + ' leagues found')
  for (let index = 0; index < leagues.length; index++) {
    const league = leagues[index];
    console.log('press ' + (index + 1) + ' to select ' + league.name);
  };
}

const makeDirs = (leagueName) => {
  const teamDir = './world/teams/' + leagueName + '/';
  if (!fs.existsSync(teamDir)) {
    console.log('creating... ' + teamDir);
    fs.mkdirSync(teamDir, { recursive: true });
  }

  const plPicsDir = './world/pics/players/';
  if (!fs.existsSync(plPicsDir)) {
    console.log('creating... ' + plPicsDir);
    fs.mkdirSync(plPicsDir, { recursive: true });
  }

  const coachesPicsDir = './world/pics/coaches/';
  if (!fs.existsSync(coachesPicsDir)) {
    console.log('creating... ' + coachesPicsDir);
    fs.mkdirSync(coachesPicsDir, { recursive: true });
  }
  return {
    teamDir,
    plPicsDir,
    coachesPicsDir
  }
};

const promptUser = (leagues) => {
  const leagueIndex = Number(prompt('select a target league\n')) - 1;
  const league = leagues[leagueIndex];
  const trick = prompt('which is your favorite team?\n');
  if (trick.toLowerCase === 'bari') {
    console.log('E ci nu zumpa é nu barese alé alé');
    return -1;
  };
  if (trick.toLowerCase() !== 'lecce') {
    console.log('next time try "Lecce" ;)');
    return -1;
  };
  console.log('FORZA LECCE!!');
  return leagueIndex;
};

const url2Id = (url) => url.split("/").pop();

async function main() {
  showBanner(leagues);
  const leagueIndex = promptUser(leagues);
  if (leagueIndex < 0) {
    return;
  };
  const browser = await chromium.launch({ headless: true }); // Set to false for non-headless mode
  const page = await browser.newPage();
  // Ensure directories exist

  const league = leagues[leagueIndex];
  const dirs = makeDirs(league.name);
  const teamArr = await getTeamLinks(page, league.link);
  console.log('\nPOPULATING ' + teamArr.length + ' teams in ' + league.name);
  for (let index = 0; index < teamArr.length; index++) {
    const teamURL = teamArr[index].url;
    const teamId = url2Id(teamURL);
    const teamFileName = `${teamId}.json`;
    // Check if the file already exists
    if (fs.existsSync('./world/teams/' + league.name + '/' + teamFileName)) {
      console.log(`File ${teamFileName} already exists. Skipping...`);
      continue;
    }
    console.log(index + '/' + teamArr.length + ' : ' + teamURL);
    // Extract team information
    let team = await extractTeam(page, teamURL, teamId, league.nat);
    console.log(index + '/' + teamArr.length + ' : ' + 'information got:', team.name);
    // Extract coach
    team.coach = await extractCoach(page, team.coachLink, team.coachId, team.id);
    // Extract attributes for all players if exist
    for (let index = 0; index < team.roster.length; index++) {
      const player = team.roster[index];
      const attr = await getAttributes(page, player.url);
      if (attr) {
        player.attr = attr;
      };
      const imgUrl = await page.$eval('div[data-testid="player_image"] img', img => img.src);
      //const imgURL = 'https://api.sofascore.app/api/v1/player/' + player.id + '/image';
      console.log(imgUrl);
      if (!imgUrl.includes('placeholder')) {
        player.image = await getImage(imgUrl, player.id, 'players');
      } else {
        player.image = 'placeholder';
        console.log(player.name + ' has no picture!!');
      }
      console.log(index + '/' + team.roster.length + ' : ' + 'got Attributes') // Make sure getImage is an async function
    }
    console.log('Extracted team + ATTR + IMAGE information:', team.name);
    const teamJSON = JSON.stringify(team, null, 2);
    // Write the team file
    const jsonPath = dirs.teamDir + teamFileName;
    fs.writeFile(jsonPath, teamJSON, 'utf8', (err) => {
      if (err) {
        console.error('An error occurred while writing JSON to file:' + jsonPath, err);
      } else {
        console.log(`JSON file has been saved as ${teamFileName}. at : ` + jsonPath);
      }
    });
  };
  await browser.close();
};

// Call the main function
main().catch(err => {
  console.error(err);
});
