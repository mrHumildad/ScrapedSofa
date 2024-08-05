const { chromium } = require('playwright');
const fs = require('fs');
// const extractPlayer = require('./extractPlayer');
const getTeamLinks = require('./getTeamLinks');
const extractTeam = require('./extractTeam');
const extractCoach = require('./extractCoach');
const getAttributes = require('./getAttributes');
const getImage = require('./scrapeImage');

let nations = {
  ITA: {
    "nation_id": 1,
    abbr: 'IT',
    name: 'Italy',
    flag: '',
    leagues: [
      {
        level: 1,
        name: 'Serie A',
        link: 'https://www.sofascore.com/tournament/football/italy/serie-a/23#id:63515',
        relegated: 3,
        subs: [5, 3],
        championsLPlaces: 4,
        teams: []
      },
      {
        level: 2,
        name: 'Serie B',
        link: 'https://www.sofascore.com/tournament/football/italy/serie-b/53#id:63812',
        relegated: 3,
        subs: [5, 3],
        promoted: 3,
        teams: []
      },
    ]
  },
  ESP: {
    "nation_id": 2,
    abbr: 'ESP',
    name: 'Spain',
    flag: '',
    leagues: [
      {
        level: 1,
        name: 'La Liga',
        link: 'https://www.sofascore.com/tournament/football/spain/laliga/8#id:61643',
        relegated: 3,
        subs: [5, 3],
        championsLPlaces: 4,
        teams: []
      },
      {
        level: 2,
        name: 'Segunda',
        link: 'https://www.sofascore.com/tournament/football/spain/laliga-2/54#id:62048',
        relegated: 3,
        subs: [5, 3],
        promoted: 3,
        teams: []
      },
    ]
  }
};

async function main() {
  const browser = await chromium.launch({ headless: true }); // Set to false for non-headless mode
  const page = await browser.newPage();

  for (const nationCode in nations) {
    const nation = nations[nationCode];
    for (const league of nation.leagues) {
      console.log('POPULATING ' + league.name);
      const teamArr = await getTeamLinks(page, league.link);
      
      for (let index = 0; index < teamArr.length; index++) {
        const teamURL = teamArr[index];
				console.log(teamURL)
        // Extract team information
        let team = await extractTeam(page, teamURL.url, false);
        console.log('Extracted team information:', team);

        // Extract coach
        console.log(team.coachId);
        team.coach = await extractCoach(page, team.coachLink, team.coachId);

        // Extract attributes for all players if exist
        team.rosterATTR = [];
        for (let index = 0; index < team.roster.length; index++) {
          const player = team.roster[index];
          const attr = await getAttributes(page, player.url);
          const imgURL = 'https://api.sofascore.app/api/v1/player/' + player.id + '/image';
          console.log(imgURL);
          const image = await getImage(imgURL, player.id, 'player'); // Make sure getImage is an async function
          const playerATTR = { ...player, attr: attr, image: image };
          console.log(playerATTR);
          team.rosterATTR.push(playerATTR);
        }
        league.teams.push(team);
        console.log('Extracted teamATTR information:', team);
      }
    }
  }

  const world = { nations: nations };
  // Convert the team object to JSON format
  const teamJSON = JSON.stringify(world, null, 2);
  fs.writeFile(nation.abbr + '.json', teamJSON, 'utf8', (err) => {
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
